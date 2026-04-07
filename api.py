import asyncio
import concurrent.futures
import datetime as _dt
import json
import logging
import logging.handlers
import math
import os
import re
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from typing import Dict, List, Optional

import requests as http_requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from starlette.middleware.base import BaseHTTPMiddleware

load_dotenv()

# ── Environment ────────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY: str = os.environ.get("ANTHROPIC_API_KEY", "")
APP_SECRET: str = os.environ.get("APP_SECRET", "")
ENV: str = os.environ.get("ENV", "development")

# ── Logging setup ──────────────────────────────────────────────────────────────
_LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
os.makedirs(_LOG_DIR, exist_ok=True)

_logger = logging.getLogger("myfrontier.api")
_logger.setLevel(logging.INFO)
_handler = logging.handlers.TimedRotatingFileHandler(
    os.path.join(_LOG_DIR, "api.log"),
    when="midnight",
    backupCount=30,
    encoding="utf-8",
)
_handler.setFormatter(logging.Formatter("%(asctime)s %(message)s"))
_logger.addHandler(_handler)

# ── Prompt injection patterns ──────────────────────────────────────────────────
_INJECTION_RE = re.compile(
    r"ignore previous instructions|you are now|system:|jailbreak",
    re.IGNORECASE,
)

# ── HTML tag strip ─────────────────────────────────────────────────────────────
_HTML_TAG_RE = re.compile(r"<[^>]+>")


def _strip_html(text: str) -> str:
    return _HTML_TAG_RE.sub("", text).strip()


# ── Token bucket rate limiter ─────────────────────────────────────────────────
# Stores per-IP state as (tokens, last_refill_time).
_rate_buckets: Dict[str, Dict[str, float]] = defaultdict(dict)

# Config: (max_tokens, refill_rate tokens/second)
_RATE_CONFIG = {
    "/optimize":   {"max": 3,  "window": 300},  # 3 per 5 min
    "/advisor":    {"max": 10, "window": 60},   # 10 per 1 min
    "/alex":       {"max": 10, "window": 60},   # 10 per 1 min
    "/categories": {"max": 60, "window": 60},   # 60 per 1 min
    "/health":     {"max": 60, "window": 60},   # 60 per 1 min
}


def _check_rate_limit(ip: str, endpoint: str) -> Optional[int]:
    """Return None if allowed, or seconds to wait if rate-limited."""
    cfg = _RATE_CONFIG.get(endpoint)
    if cfg is None:
        return None

    now = time.monotonic()
    bucket = _rate_buckets[ip].get(endpoint)

    if bucket is None:
        _rate_buckets[ip][endpoint] = {"tokens": cfg["max"] - 1, "reset_at": now + cfg["window"]}
        return None

    if now >= bucket["reset_at"]:
        # Window expired — full refill
        _rate_buckets[ip][endpoint] = {"tokens": cfg["max"] - 1, "reset_at": now + cfg["window"]}
        return None

    if bucket["tokens"] > 0:
        bucket["tokens"] -= 1
        return None

    return max(1, int(bucket["reset_at"] - now))


# ── Startup / lifespan ────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Verify optimizer imports cleanly
    try:
        import optimizer as _opt_check  # noqa: F401
    except Exception as exc:
        _logger.error(f"[startup] optimizer import failed: {exc}")
        raise RuntimeError(f"optimizer.py failed to import: {exc}") from exc

    # Validate etf_universe_extra.json if present
    _extra_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "etf_universe_extra.json")
    if os.path.exists(_extra_path):
        try:
            with open(_extra_path, "r", encoding="utf-8") as f:
                json.load(f)
        except json.JSONDecodeError as exc:
            _logger.error(f"[startup] etf_universe_extra.json is invalid JSON: {exc}")
            raise RuntimeError(f"etf_universe_extra.json is invalid JSON: {exc}") from exc

    _logger.info(f"My Frontier API ready — v1.0.0 — {_dt.datetime.utcnow().isoformat()}Z")
    yield


import optimizer as opt

app = FastAPI(title="FrontierFi API", description="ETF portfolio optimization API", lifespan=lifespan)

# ── CORS ───────────────────────────────────────────────────────────────────────
if ENV == "production":
    _allowed_origins = ["https://myfrontierapp.com"]
else:
    _allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-App-Secret"],
)


# ── X-App-Secret middleware ────────────────────────────────────────────────────
class _AppSecretMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Health check is exempt so load balancers can probe without the secret
        if request.url.path == "/health":
            return await call_next(request)
        if APP_SECRET and request.headers.get("X-App-Secret") != APP_SECRET:
            return JSONResponse(status_code=403, content={"error": "Forbidden"})
        return await call_next(request)


app.add_middleware(_AppSecretMiddleware)


# ── Request timeout middleware ─────────────────────────────────────────────────
class _TimeoutMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, timeout: int = 120) -> None:
        super().__init__(app)
        self.timeout = timeout

    async def dispatch(self, request: Request, call_next):
        try:
            return await asyncio.wait_for(call_next(request), timeout=float(self.timeout))
        except asyncio.TimeoutError:
            return JSONResponse(
                status_code=504,
                content={"error": "Request timed out. Portfolio calculation is taking longer than expected. Please try again."},
            )


app.add_middleware(_TimeoutMiddleware, timeout=120)


# ── Request logging middleware ─────────────────────────────────────────────────
class _LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.monotonic()
        ip = request.client.host if request.client else "unknown"
        endpoint = request.url.path
        response = await call_next(request)
        elapsed_ms = int((time.monotonic() - start) * 1000)
        # Never log portfolio data or personal information — only metadata
        _logger.info(
            f"ip={ip} method={request.method} endpoint={endpoint} "
            f"status={response.status_code} elapsed_ms={elapsed_ms}"
        )
        return response


app.add_middleware(_LoggingMiddleware)


# ── Request / Response models ──────────────────────────────────────────────────

class OptimizeRequest(BaseModel):
    name: str = Field(default="Investor", description="Investor name")
    categories: List[str] = Field(description="ETF category names to include (see GET /categories)")
    risk_tolerance: int = Field(ge=1, le=5, description="1=Very Conservative … 5=Very Aggressive")
    lump_sum: float = Field(ge=0, le=10_000_000, description="One-time investment amount in USD")
    weekly_contribution: float = Field(ge=0, le=100_000, description="Weekly recurring contribution in USD")
    age: int = Field(ge=13, le=100, description="Current age of the investor")


class HoldingResult(BaseModel):
    ticker: str
    name: str
    description: str
    weight: float
    lump_sum_amount: float
    weekly_amount: float
    historical_annual_return_pct: float
    top_holdings: List[str]


class ProjectionPoint(BaseModel):
    years: float
    at_age: float
    conservative: float
    optimistic: float


class PortfolioScores(BaseModel):
    smart_score: float
    risk_score_pct: float
    diversification_score: float
    grade: str


class PortfolioPerformanceResult(BaseModel):
    expected_annual_return: float
    annual_volatility: float
    sharpe_ratio: float


class InvestorProfile(BaseModel):
    name: str
    categories: List[str]
    risk_tolerance: int
    risk_label: str
    lump_sum: float
    weekly_contribution: float
    age: int


class OptimizeResponse(BaseModel):
    profile: InvestorProfile
    performance: PortfolioPerformanceResult
    scores: PortfolioScores
    holdings: List[HoldingResult]
    projections: List[ProjectionPoint]
    categories_applied: List[str]  # categories that contributed ≥1 non-leveraged ETF


class AdvisorMessage(BaseModel):
    role: str
    content: str


class AdvisorRequest(BaseModel):
    messages: List[AdvisorMessage]
    portfolio: dict
    user_name: str


class AlexRequest(BaseModel):
    messages: List[AdvisorMessage]
    portfolio: dict
    user_name: str


# ── Helpers ────────────────────────────────────────────────────────────────────

def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _validate_categories(categories: List[str]) -> None:
    if not categories:
        raise HTTPException(status_code=422, detail="At least one category must be selected.")
    if len(categories) > 100:
        raise HTTPException(status_code=422, detail="Maximum 100 categories allowed.")
    for cat in categories:
        if len(cat) > 100:
            raise HTTPException(status_code=422, detail=f"Category name too long (max 100 chars): {cat[:40]}…")


def _validate_name(name: str) -> str:
    cleaned = _strip_html(name)
    if len(cleaned) > 50:
        raise HTTPException(status_code=422, detail="Name must be 50 characters or fewer.")
    return cleaned or "Investor"


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/health", summary="Health check — used by the mobile app and Railway to verify server health")
def health():
    # Universe stats
    categories = len(opt.UNIVERSE_TO_ETFS)
    etfs_in_universe = len({t for etfs in opt.UNIVERSE_TO_ETFS.values() for t in etfs})

    # Cache status — check if a fresh pickle exists without loading it
    cache_path = getattr(opt, "_CACHE_PATH", None)
    import os as _os, time as _time, pickle as _pickle
    cache_status = "cold"
    if cache_path and _os.path.exists(cache_path):
        try:
            with open(cache_path, "rb") as _f:
                _payload = _pickle.load(_f)
            _age = _time.time() - float(_payload.get("timestamp", 0))
            cache_status = "warm" if _age < 86400 else "stale"
        except Exception:
            cache_status = "corrupt"

    return {
        "status": "ok",
        "version": "1.0.0",
        "categories": categories,
        "etfs_in_universe": etfs_in_universe,
        "cache_status": cache_status,
        "timestamp": _dt.datetime.utcnow().isoformat() + "Z",
    }


@app.get("/categories", response_model=List[str], summary="List available ETF categories")
def get_categories(request: Request):
    ip = _get_client_ip(request)
    wait = _check_rate_limit(ip, "/categories")
    if wait is not None:
        return JSONResponse(
            status_code=429,
            content={"error": f"Too many requests. Please wait {wait} seconds."},
            headers={"Retry-After": str(wait)},
        )
    return list(opt.UNIVERSE_TO_ETFS.keys())


@app.post("/optimize", response_model=OptimizeResponse, summary="Run portfolio optimization")
def optimize(req: OptimizeRequest, request: Request):
    ip = _get_client_ip(request)
    wait = _check_rate_limit(ip, "/optimize")
    if wait is not None:
        return JSONResponse(
            status_code=429,
            content={"error": f"Too many requests. Please wait {wait} seconds."},
            headers={"Retry-After": str(wait)},
        )

    # Additional input validation beyond Pydantic
    _validate_categories(req.categories)
    req.name = _validate_name(req.name)

    # Reject categories that are completely unknown OR resolve to an empty ETF list
    bad = [c for c in req.categories if not opt.UNIVERSE_TO_ETFS.get(c)]
    if bad:
        raise HTTPException(status_code=422, detail=f"Unknown categories: {bad}. Call GET /categories for valid options.")

    try:
        universe = opt.remove_leveraged_etfs(opt.build_universe(req.categories))
        if not universe:
            raise HTTPException(status_code=422, detail="No non-leveraged ETFs available for the selected categories.")

        # Track which requested categories actually contributed ≥1 ticker to the
        # non-leveraged universe.  Log a warning for any that contributed nothing
        # (e.g. all their ETFs were stripped as leveraged products).
        universe_set = set(universe)
        categories_applied: List[str] = []
        for cat in req.categories:
            cat_etfs = set(opt.UNIVERSE_TO_ETFS.get(cat, []))
            if cat_etfs & universe_set:
                categories_applied.append(cat)
            else:
                _logger.warning(
                    f"[/optimize] Category '{cat}' contributed 0 non-leveraged ETFs to universe"
                )

        today = _dt.date.today()
        start_date = today - _dt.timedelta(days=365 * 10)
        min_observations = 252 * 3

        prices = opt.download_10y_prices(universe, start_date, today, min_observations=min_observations)
        if prices.empty or prices.shape[1] == 0:
            raise HTTPException(status_code=422, detail="No tickers had enough historical data. Try different categories.")

        # Drop near-duplicate ETFs BEFORE padding so the pad step can bring the count
        # back up to MIN_PORTFOLIO_ETFS after filtering removes correlated duplicates.
        # Order matters: filter first → pad after ensures the final pool is always ≥ 10.
        prices = opt.filter_correlated_etfs(prices)

        # Guarantee at least MIN_PORTFOLIO_ETFS tickers even after correlation filtering
        # or thin category selections left fewer tickers with sufficient history.
        prices = opt.pad_prices_to_minimum(prices, start_date, today, min_observations=min_observations)

        # Memory protection: trim to top 80 tickers by estimated Sharpe
        if prices.shape[1] > 80:
            ann_return, ann_vol = opt.per_etf_metrics(prices)
            sharpe_est = (ann_return / ann_vol.replace(0, float("nan"))).dropna()
            top80 = sharpe_est.nlargest(80).index.tolist()
            prices = prices[top80]

        # Optimization with 60-second timeout (Windows-safe via ThreadPoolExecutor)
        def _run_optimize():
            # Risk-free rate calibrated to current ~4.5% 3-month T-bill yield.
            # Using 0.0 inflated all Sharpe ratios and distorted frontier selection.
            return opt.optimize_portfolio(prices, req.risk_tolerance, risk_free_rate=0.045)

        weights = None
        perf = None
        timed_out = False
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_run_optimize)
            try:
                weights, perf = future.result(timeout=60)
            except concurrent.futures.TimeoutError:
                timed_out = True

        if timed_out or weights is None:
            # Fallback: equal weight across top 20 ETFs by historical return
            ann_return_fb, _ = opt.per_etf_metrics(prices)
            top20 = ann_return_fb.nlargest(min(20, len(ann_return_fb))).index.tolist()
            import pandas as pd
            weights = pd.Series(1.0 / len(top20), index=top20)
            perf_vals = opt.compute_performance_from_weights(
                weights,
                opt.compute_mu(prices[top20]),
                opt.compute_cov(prices[top20]),
                0.045,  # match optimizer risk-free rate (current ~4.5% T-bill yield)
            )
            perf = perf_vals

        etf_ann_return, _ = opt.per_etf_metrics(prices)
        recommended = weights.index.tolist()
        lump_alloc = opt.allocate_exact(req.lump_sum, weights)
        weekly_alloc = opt.allocate_exact(req.weekly_contribution, weights)

        holdings_out: List[HoldingResult] = []
        for ticker in recommended:
            full_name, desc = opt.etf_details(ticker)
            top = opt.etf_top_holdings(ticker, n=5)
            holdings_out.append(HoldingResult(
                ticker=ticker,
                name=full_name,
                description=opt.simplify_description(desc),
                weight=round(float(weights.loc[ticker]), 6),
                lump_sum_amount=lump_alloc[ticker],
                weekly_amount=weekly_alloc[ticker],
                historical_annual_return_pct=round(float(etf_ann_return.get(ticker, 0.0)) * 100, 2),
                top_holdings=top,
            ))

        risk_score = float(min(0.20, max(0.0, perf.volatility)))
        # Smart Score: 10 * (1 - e^(-1.5 * sharpe))
        # ×1.5 exponent maps realistic ETF Sharpe range (0–1.5) to full 0–10 scale:
        #   A (≥7.5) → Sharpe ≥ 0.92 | B (≥6.0) → Sharpe ≥ 0.67
        #   C (≥4.5) → Sharpe ≥ 0.47 | D (≥2.5) → Sharpe ≥ 0.19 | F (<2.5)
        smart = max(0.0, min(10.0, 10.0 * (1.0 - math.exp(-1.5 * max(0.0, float(perf.sharpe))))))
        div_eff = 1.0 / float((weights.fillna(0.0) ** 2).sum()) if not weights.empty else 1.0
        diversification_score = max(0.0, min(10.0, div_eff))
        grade = (
            "A" if (smart >= 7.5 and diversification_score >= 6.0) else
            "B" if smart >= 6.0 else
            "C" if smart >= 4.5 else
            "D" if smart >= 2.5 else
            "F"
        )

        proj_return = float(min(0.15, max(0.0, perf.expected_return)))
        proj_return_opt = float(min(0.15, proj_return * 1.20))
        proj_return_cons = float(max(0.0, proj_return * 0.80))

        projections: List[ProjectionPoint] = []
        retirement_age = 59.5
        age_f = float(req.age)

        if age_f < retirement_age:
            years_to_ret = retirement_age - age_f
            milestone_years: List[float] = []
            k = 10
            while k < years_to_ret:
                milestone_years.append(float(k))
                k += 10
            milestone_years.append(float(years_to_ret))

            for y in milestone_years:
                cons = opt.future_value_with_weekly_contrib(req.lump_sum, req.weekly_contribution, y, proj_return_cons)
                optv = opt.future_value_with_weekly_contrib(req.lump_sum, req.weekly_contribution, y, proj_return_opt)
                projections.append(ProjectionPoint(
                    years=round(y, 1),
                    at_age=round(age_f + y, 1),
                    conservative=round(cons, 2),
                    optimistic=round(optv, 2),
                ))
        else:
            for horizon in [5, 10, 15, 20]:
                cons = opt.future_value_with_weekly_contrib(req.lump_sum, req.weekly_contribution, float(horizon), proj_return_cons)
                optv = opt.future_value_with_weekly_contrib(req.lump_sum, req.weekly_contribution, float(horizon), proj_return_opt)
                projections.append(ProjectionPoint(
                    years=float(horizon),
                    at_age=age_f + float(horizon),
                    conservative=round(cons, 2),
                    optimistic=round(optv, 2),
                ))

        risk_label = (
            "Very Conservative" if req.risk_tolerance == 1 else
            "Conservative" if req.risk_tolerance == 2 else
            "Moderate" if req.risk_tolerance == 3 else
            "Aggressive" if req.risk_tolerance == 4 else
            "Very Aggressive"
        )

        return OptimizeResponse(
            profile=InvestorProfile(
                name=req.name or "Investor",
                categories=req.categories,
                risk_tolerance=req.risk_tolerance,
                risk_label=risk_label,
                lump_sum=req.lump_sum,
                weekly_contribution=req.weekly_contribution,
                age=req.age,
            ),
            performance=PortfolioPerformanceResult(
                expected_annual_return=round(perf.expected_return, 6),
                annual_volatility=round(perf.volatility, 6),
                sharpe_ratio=round(perf.sharpe, 4) if not math.isnan(perf.sharpe) else 0.0,
            ),
            scores=PortfolioScores(
                smart_score=round(smart, 2),
                risk_score_pct=round(risk_score * 100, 2),
                diversification_score=round(diversification_score, 2),
                grade=grade,
            ),
            holdings=holdings_out,
            projections=projections,
            categories_applied=categories_applied,
        )

    except HTTPException:
        raise
    except Exception as exc:
        print(f"[/optimize] Unhandled error: {type(exc).__name__}: {exc}")
        return JSONResponse(
            status_code=500,
            content={"error": "Portfolio calculation failed. This is usually caused by a data download issue. Please try again in a few moments."},
        )


@app.post("/advisor", summary="Proxy AI advisor messages through the backend")
def advisor(req: AdvisorRequest, request: Request):
    ip = _get_client_ip(request)
    wait = _check_rate_limit(ip, "/advisor")
    if wait is not None:
        return JSONResponse(
            status_code=429,
            content={"error": f"Too many requests. Please wait {wait} seconds."},
            headers={"Retry-After": str(wait)},
        )

    # Validate message count and length
    if len(req.messages) > 50:
        raise HTTPException(status_code=422, detail="Maximum 50 messages allowed.")
    for msg in req.messages:
        if len(msg.content) > 500:
            raise HTTPException(status_code=422, detail="Each message must be under 500 characters.")
        if _INJECTION_RE.search(msg.content):
            raise HTTPException(status_code=400, detail="Message contains disallowed content.")

    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=503, detail="AI advisor is not configured on this server.")

    # Build system prompt server-side
    portfolio = req.portfolio
    portfolio_summary = json.dumps({
        "name": req.user_name,
        "risk_label": portfolio.get("profile", {}).get("risk_label", ""),
        "grade": portfolio.get("scores", {}).get("grade", ""),
        "smart_score": portfolio.get("scores", {}).get("smart_score", 0),
        "expected_return": f"{portfolio.get('performance', {}).get('expected_annual_return', 0) * 100:.1f}%",
        "top_holdings": [
            {"ticker": h.get("ticker"), "weight": f"{h.get('weight', 0) * 100:.1f}%"}
            for h in portfolio.get("holdings", [])[:5]
        ],
    })
    system_prompt = (
        f"You are a friendly, plain-English financial educator named Alex. "
        f"You have access to this user's My Frontier portfolio: {portfolio_summary}. "
        f"Answer questions about their portfolio, explain what ETFs are, help them understand risk, "
        f"and encourage smart long-term investing habits. "
        f"Never give specific buy/sell advice. Always remind users this is educational only. "
        f"Keep responses under 150 words. Be warm, encouraging, and use simple language."
    )

    try:
        response = http_requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "Content-Type": "application/json",
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
            },
            json={
                "model": "claude-haiku-4-5-20251001",
                "max_tokens": 200,
                "system": system_prompt,
                "messages": [{"role": m.role, "content": m.content} for m in req.messages],
            },
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()
        reply = (data.get("content", [{}])[0].get("text", "")).strip()
        return {"reply": reply}
    except http_requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="AI advisor timed out. Please try again.")
    except http_requests.exceptions.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"AI advisor unavailable: {exc}")


@app.post("/alex", summary="Alex AI — personalized portfolio guide")
def alex(req: AlexRequest, request: Request):
    ip = _get_client_ip(request)
    wait = _check_rate_limit(ip, "/alex")
    if wait is not None:
        return JSONResponse(
            status_code=429,
            content={"error": f"Too many requests. Please wait {wait} seconds."},
            headers={"Retry-After": str(wait)},
        )

    if len(req.messages) > 50:
        raise HTTPException(status_code=422, detail="Maximum 50 messages allowed.")
    for msg in req.messages:
        if len(msg.content) > 500:
            raise HTTPException(status_code=422, detail="Each message must be under 500 characters.")
        if _INJECTION_RE.search(msg.content):
            raise HTTPException(status_code=400, detail="Message contains disallowed content.")

    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=503, detail="Alex AI is not configured on this server.")

    # Build portfolio context for personalized responses
    portfolio = req.portfolio
    portfolio_summary = json.dumps({
        "name": req.user_name,
        "risk_label": portfolio.get("profile", {}).get("risk_label", ""),
        "grade": portfolio.get("scores", {}).get("grade", ""),
        "smart_score": portfolio.get("scores", {}).get("smart_score", 0),
        "expected_return": f"{portfolio.get('performance', {}).get('expected_annual_return', 0) * 100:.1f}%",
        "top_holdings": [
            {"ticker": h.get("ticker"), "weight": f"{h.get('weight', 0) * 100:.1f}%"}
            for h in portfolio.get("holdings", [])[:5]
        ],
    })
    system_prompt = (
        "You are Alex, a friendly financial guide inside the My Frontier app. "
        "You help first-time investors understand their portfolio results in plain English. "
        "You never give specific buy/sell advice. "
        "You explain concepts simply, stay encouraging, and always remind users this is not financial advice. "
        "Keep responses under 100 words. "
        f"The user's current portfolio: {portfolio_summary}"
    )

    try:
        response = http_requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "Content-Type": "application/json",
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
            },
            json={
                "model": "claude-haiku-4-5-20251001",
                "max_tokens": 150,
                "system": system_prompt,
                "messages": [{"role": m.role, "content": m.content} for m in req.messages],
            },
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()
        reply = (data.get("content", [{}])[0].get("text", "")).strip()
        return {"reply": reply}
    except http_requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Alex timed out. Please try again.")
    except http_requests.exceptions.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Alex unavailable: {exc}")

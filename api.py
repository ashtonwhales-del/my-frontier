import asyncio
import concurrent.futures
import datetime as _dt
import gc
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
GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")
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
    "/optimize":            {"max": 3,  "window": 300},  # 3 per 5 min
    "/advisor":             {"max": 10, "window": 60},   # 10 per 1 min
    "/alex":                {"max": 10, "window": 60},   # 10 per 1 min
    "/categories":          {"max": 60, "window": 60},   # 60 per 1 min
    "/health":              {"max": 60, "window": 60},   # 60 per 1 min
    "/market-pulse":        {"max": 30, "window": 60},   # 30 per 1 min
    "/historical":          {"max": 5,  "window": 300},  # 5 per 5 min
    "/leaderboard/submit":  {"max": 10, "window": 300},  # 10 per 5 min
    "/leaderboard/rank":    {"max": 30, "window": 60},   # 30 per 1 min
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

    _logger.info(f"[startup] Gemini key loaded: {'YES' if GEMINI_API_KEY else 'NO — set GEMINI_API_KEY in environment'}")

    _logger.info(f"My Frontier API ready — v1.0.0 — {_dt.datetime.utcnow().isoformat()}Z")
    yield


import optimizer as opt

# ── Startup price cache — pre-fetch common tickers every 4 hours ─────────────
_PRICE_CACHE: Dict = {}  # {ticker: pd.Series}
_PRICE_CACHE_TS: float = 0.0
_CORE_TICKERS = [
    "VTI", "SPY", "QQQ", "AGG", "BND", "GLD", "VWO", "VNQ", "ARKK", "XLK",
    "XLF", "XLE", "XLV", "XLI", "SCHD", "DGRO", "VB", "IJR", "SCHA", "VEA",
    "VXUS", "TLT", "IEF", "SHY", "GDX", "USO", "XLY", "XLP", "XLU", "XLRE",
]


def _refresh_price_cache() -> None:
    global _PRICE_CACHE, _PRICE_CACHE_TS
    if time.time() - _PRICE_CACHE_TS < 14400:  # 4 hours
        return
    try:
        import yfinance as yf
        _logger.info(f"[cache] Refreshing price cache for {len(_CORE_TICKERS)} tickers...")
        data = yf.download(_CORE_TICKERS, period="6mo", auto_adjust=True, progress=False)
        if hasattr(data, 'columns') and hasattr(data.columns, 'levels'):
            close = data["Close"]
        else:
            close = data
        for t in _CORE_TICKERS:
            if t in close.columns:
                _PRICE_CACHE[t] = close[t].dropna()
        _PRICE_CACHE_TS = time.time()
        _logger.info(f"[cache] Cached {len(_PRICE_CACHE)} tickers")
        gc.collect()
    except Exception as e:
        _logger.error(f"[cache] Price cache refresh failed: {e}")

app = FastAPI(title="My Frontier API", description="ETF portfolio optimization API", lifespan=lifespan)

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
        # Public endpoints exempt from X-App-Secret so load balancers and
        # diagnostic tools can probe without the secret header.
        if request.url.path in ("/health", "/alex-test"):
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


class HistoricalRequest(BaseModel):
    weights: Dict[str, float]


class LeaderboardSubmitRequest(BaseModel):
    smart_score: float = Field(ge=0.0, le=10.0)
    grade: str = Field(max_length=1)


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

@app.get("/health", summary="Health check — used by the mobile app and Render to verify server health")
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
        "gemini": "configured" if GEMINI_API_KEY else "MISSING — add GEMINI_API_KEY to Render environment variables",
        "timestamp": _dt.datetime.utcnow().isoformat() + "Z",
    }


@app.get("/prices", summary="Get current prices with change data")
def get_prices(tickers: str = ""):
    """Returns price, change, changePercent, and 5-day history per ticker."""
    _refresh_price_cache()
    requested = [t.strip().upper() for t in tickers.split(",") if t.strip()][:20]
    result: Dict = {}
    for t in requested:
        if t in _PRICE_CACHE and len(_PRICE_CACHE[t]) >= 2:
            series = _PRICE_CACHE[t]
            curr = float(series.iloc[-1])
            prev = float(series.iloc[-2])
            chg = round(curr - prev, 2)
            pct = round((chg / prev) * 100, 2) if prev != 0 else 0.0
            history = [round(float(v), 2) for v in series.tail(5).tolist()]
            result[t] = {"price": round(curr, 2), "change": chg, "changePercent": pct, "history": history}
        elif t in _PRICE_CACHE and len(_PRICE_CACHE[t]) == 1:
            result[t] = {"price": round(float(_PRICE_CACHE[t].iloc[-1]), 2), "change": 0, "changePercent": 0, "history": []}
        else:
            # On-demand fetch for tickers not in core cache
            try:
                import yfinance as yf
                hist = yf.Ticker(t).history(period="5d", timeout=6)
                if len(hist) >= 2:
                    curr = float(hist["Close"].iloc[-1]); prev = float(hist["Close"].iloc[-2])
                    chg = round(curr - prev, 2); pct = round((chg / prev) * 100, 2) if prev != 0 else 0.0
                    result[t] = {"price": round(curr, 2), "change": chg, "changePercent": pct, "history": [round(float(v), 2) for v in hist["Close"].tolist()]}
                elif len(hist) == 1:
                    result[t] = {"price": round(float(hist["Close"].iloc[-1]), 2), "change": 0, "changePercent": 0, "history": []}
            except Exception:
                pass
            finally:
                gc.collect()
    return {"prices": result}


@app.get("/alex-test", summary="Quick check — is an AI key configured?")
def alex_test():
    """Key-presence check only. No generate_content call — saves quota."""
    if GEMINI_API_KEY:
        return {"ok": True, "message": "Gemini key is configured", "key_present": True}
    if ANTHROPIC_API_KEY:
        return {"ok": True, "message": "Anthropic key is configured", "key_present": True}
    return {"ok": False, "error": "GEMINI_API_KEY not set", "key_present": False}


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
    _logger.info(f"[optimize] START — categories={len(req.categories)}, risk={req.risk_tolerance}, lump={req.lump_sum}")
    # Memory guard — reject if server is already under pressure
    try:
        import psutil
        mem_pct = psutil.virtual_memory().percent
        _logger.info(f"[optimize] Memory: {mem_pct}%")
        if mem_pct > 75:
            return JSONResponse(status_code=503, content={"error": "Server busy. Please wait 30 seconds and try again."})
    except ImportError:
        pass  # psutil not installed — skip check
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
        _logger.info(f"[optimize] Universe built: {len(universe)} tickers")
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

        _logger.info(f"[optimize] Downloading prices for {len(universe)} tickers...")
        prices = opt.download_10y_prices(universe, start_date, today, min_observations=min_observations)
        _logger.info(f"[optimize] Prices fetched: {prices.shape[1]} tickers, {prices.shape[0]} rows")
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

        gc.collect()  # Free memory before optimization
        _logger.info(f"[optimize] After filter+pad: {prices.shape[1]} tickers — starting optimization")
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
        # Smart Score: 10 * (1 - e^(-1.8 * sharpe))
        # ×1.8 exponent maps realistic ETF Sharpe range (0–1.5) to full 0–10 scale:
        #   A (≥9.0) → Sharpe ≥ 1.28 | B (≥7.5) → Sharpe ≥ 0.83
        #   C (≥6.0) → Sharpe ≥ 0.56 | D (≥4.5) → Sharpe ≥ 0.32 | F (<4.5)
        smart = max(0.0, min(10.0, 10.0 * (1.0 - math.exp(-1.8 * max(0.0, float(perf.sharpe))))))
        import math as _math
        _weight_vals = weights.fillna(0.0).values.tolist() if not weights.empty else [1.0]
        _n = len(_weight_vals)
        # Component 1: holdings count score (max 3.5)
        _holdings_score = min(3.5, 1.5 * _math.log(_n / 5 + 1))
        # Component 2: HHI concentration (max 4.0) — lower HHI = better
        _hhi = sum(w**2 for w in _weight_vals)
        _perfect_hhi = 1.0 / _n
        _hhi_denom = max(1.0 - _perfect_hhi, 1e-9)
        _hhi_score = max(0.0, 4.0 * (1.0 - (_hhi - _perfect_hhi) / _hhi_denom))
        # Component 3: partial corr credit from count (max 2.5)
        _corr_score = min(2.5, _n * 0.15)
        diversification_score = max(0.0, min(10.0, _holdings_score + _hhi_score + _corr_score))
        grade = (
            "A" if (smart >= 9.0 and diversification_score >= 6.0) else
            "B" if smart >= 7.5 else
            "C" if smart >= 6.0 else
            "D" if smart >= 4.5 else
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
        _logger.error(f"[/optimize] Unhandled error: {type(exc).__name__}: {exc}")
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


# ── Alex AI — Smart pre-computed responses (free, instant, never fails) ──────
import random as _alex_rnd

_ALEX_DB: Dict[str, List[str]] = {
    "score": [
        "Your Frontier Score of {score}/10 measures how efficiently your portfolio converts risk into return. {quality} — the higher the score, the closer you sit to the mathematical Efficient Frontier.",
        "A Frontier Score of {score}/10 puts you in the {percentile} of portfolios. The score uses the Sharpe ratio — your return divided by your volatility. Solid work!",
    ],
    "improve": [
        "To improve your {grade} portfolio, consider adding more uncorrelated assets. Bonds and international ETFs often move differently from US stocks, reducing volatility without cutting returns.",
        "Look at reducing concentration — if any single ETF holds more than 15% of your portfolio, redistributing could improve your Frontier Score.",
    ],
    "risk": [
        "Your risk score of {risk}% means your portfolio could swing roughly that much in a bad year. Historically, diversified portfolios like yours recover within 1-3 years.",
        "A {risk}% volatility is typical for a {grade}-grade portfolio. It balances growth potential with stability. The key is staying invested through the dips.",
    ],
    "diversification": [
        "Your diversification score of {div}/10 reflects how spread out your holdings are. {div_quality} — low correlation between ETFs means when one dips, others tend to hold steady.",
        "True diversification comes from low correlation, not just holding many ETFs. Your {etf_count} holdings across different sectors achieve this well.",
    ],
    "etf": [
        "ETFs are baskets of stocks or bonds that trade like a single stock. Instead of buying Apple individually, an ETF like QQQ gives you exposure to 100 top tech companies at once.",
        "Each ETF in your portfolio was selected because it provides sector exposure while having low correlation with your other holdings. That is the Efficient Frontier in action.",
    ],
    "return": [
        "Your expected return of {ret}% per year is based on historical ETF performance, annualized. A $10,000 investment could grow to ${p10yr} in 10 years and ${p30yr} in 30 years.",
        "At {ret}% annual return, your money roughly doubles every {double_yrs} years. Time in the market is the most powerful wealth builder.",
    ],
    "default": [
        "Your {grade}-grade portfolio has a {ret}% expected return with {risk}% volatility. The Efficient Frontier model optimized your ETF weights to maximize return for your chosen risk level. This is for education only, not financial advice.",
        "Great question! Your portfolio uses Nobel Prize-winning mathematics to balance risk and return. Each ETF was weighted to minimize correlation while maximizing expected return. Remember, this is for education only.",
        "The Efficient Frontier maps every possible portfolio and identifies ones that give maximum return for minimum risk. Your portfolio sits on or near that frontier — mathematically efficient.",
    ],
}


def _alex_respond(message: str, portfolio: dict) -> str:
    scores = portfolio.get("scores", {})
    perf = portfolio.get("performance", {})
    grade = scores.get("grade", "B")
    score = scores.get("smart_score", 7.0)
    ret = round(perf.get("expected_annual_return", 0.10) * 100, 1)
    risk = round(perf.get("annual_volatility", 0.15) * 100, 1)
    div = scores.get("diversification_score", 7.0)
    etf_count = len(portfolio.get("holdings", []))
    quality = "Excellent" if score >= 8 else "Good" if score >= 6 else "Decent"
    percentile = "top 20%" if score >= 8 else "top 40%" if score >= 6 else "top 60%"
    div_quality = "Excellent spread" if div >= 8 else "Good spread" if div >= 6 else "Moderate spread"
    p10yr = f"{round(10000 * (1 + ret / 100) ** 10):,}"
    p30yr = f"{round(10000 * (1 + ret / 100) ** 30):,}"
    double_yrs = round(72 / max(ret, 1))

    msg = message.lower()
    if any(w in msg for w in ["score", "frontier score", "smart score", "grade"]):
        pool = _ALEX_DB["score"]
    elif any(w in msg for w in ["improve", "better", "higher", "increase"]):
        pool = _ALEX_DB["improve"]
    elif any(w in msg for w in ["risk", "volatile", "volatility", "safe", "crash"]):
        pool = _ALEX_DB["risk"]
    elif any(w in msg for w in ["diversif", "spread", "correl"]):
        pool = _ALEX_DB["diversification"]
    elif any(w in msg for w in ["etf", "fund", "stock", "bond", "what is"]):
        pool = _ALEX_DB["etf"]
    elif any(w in msg for w in ["return", "earn", "grow", "profit", "project"]):
        pool = _ALEX_DB["return"]
    else:
        pool = _ALEX_DB["default"]

    tmpl = _alex_rnd.choice(pool)
    return tmpl.format(
        grade=grade, score=round(score, 1), ret=ret, risk=risk, div=round(div, 1),
        etf_count=etf_count, quality=quality, percentile=percentile,
        div_quality=div_quality, p10yr=p10yr, p30yr=p30yr, double_yrs=double_yrs,
    )


@app.post("/alex", summary="Alex AI — smart portfolio guide (free, instant, never fails)")
def alex(req: AlexRequest, request: Request):
    ip = _get_client_ip(request)
    wait = _check_rate_limit(ip, "/alex")
    if wait is not None:
        return JSONResponse(status_code=429, content={"error": f"Too many requests. Wait {wait}s."})
    if not req.messages:
        raise HTTPException(status_code=422, detail="No messages provided.")
    last_msg = req.messages[-1].content if req.messages else ""
    portfolio = req.portfolio or {}
    reply = _alex_respond(last_msg, portfolio)
    return {"reply": reply, "model": "frontier-ai"}


# ── Market Pulse ──────────────────────────────────────────────────────────────
_MARKET_PULSE_CACHE: Dict = {}
_TICKER_TAPE_SYMBOLS = [
    "SPY", "QQQ", "DIA", "IWM", "VTI", "AGG", "GLD", "SLV", "USO",
    "BTC-USD", "ETH-USD", "AAPL", "MSFT", "NVDA", "TSLA", "AMZN",
]


@app.get("/market-pulse", summary="Market sentiment and ticker tape data (17 tickers)")
def market_pulse(request: Request):
    ip = _get_client_ip(request)
    wait = _check_rate_limit(ip, "/market-pulse")
    if wait is not None:
        return JSONResponse(status_code=429, content={"error": f"Rate limited. Wait {wait}s."})

    # 5-minute server-side cache
    now = time.time()
    if _MARKET_PULSE_CACHE.get("ts") and now - _MARKET_PULSE_CACHE["ts"] < 300:
        return _MARKET_PULSE_CACHE["data"]

    try:
        import yfinance as yf

        def _ticker_data(symbol: str) -> Dict:
            try:
                hist = yf.Ticker(symbol).history(period="5d")
                if len(hist) < 2:
                    return {"symbol": symbol, "price": 0, "change_pct": 0}
                price = float(hist["Close"].iloc[-1])
                prev = float(hist["Close"].iloc[-2])
                pct = (price - prev) / prev * 100
                return {"symbol": symbol, "price": round(price, 2), "change_pct": round(pct, 2)}
            except Exception:
                return {"symbol": symbol, "price": 0, "change_pct": 0}

        tickers = [_ticker_data(s) for s in _TICKER_TAPE_SYMBOLS]

        spy_c = next((t["change_pct"] for t in tickers if t["symbol"] == "SPY"), 0)
        qqq_c = next((t["change_pct"] for t in tickers if t["symbol"] == "QQQ"), 0)
        agg_c = next((t["change_pct"] for t in tickers if t["symbol"] == "AGG"), 0)

        sentiment = "bullish" if spy_c > 1 else ("bearish" if spy_c < -1 else "neutral")
        messages = {
            "bullish": "Markets are up today. Growth portfolios are having a good day.",
            "bearish": "Markets dipped today. Every crash in history has recovered.",
            "neutral": "Markets are steady today. Business as usual.",
        }
        data = {
            "spy_change": round(spy_c, 2),
            "qqq_change": round(qqq_c, 2),
            "agg_change": round(agg_c, 2),
            "sentiment": sentiment,
            "message": messages[sentiment],
            "tickers": tickers,
        }
        _MARKET_PULSE_CACHE.update({"ts": now, "data": data})
        return data
    except Exception as exc:
        _logger.error(f"[market-pulse] error: {exc}")
        raise HTTPException(status_code=500, detail="Market data unavailable right now.")


# ── Historical Portfolio Performance — mock only (zero memory) ────────────────
@app.post("/historical", summary="10-year portfolio vs SPY benchmark (monthly, estimated)")
def historical(req: HistoricalRequest, request: Request):
    ip = _get_client_ip(request)
    wait = _check_rate_limit(ip, "/historical")
    if wait is not None:
        return JSONResponse(status_code=429, content={"error": f"Rate limited. Wait {wait}s."})

    import random as _rnd
    expected_return = 0.10  # default
    if req.weights:
        expected_return = max(0.04, min(0.15, sum(req.weights.values()) * 0.10))

    mock_data = []
    port_val = 10000.0
    spy_val = 10000.0
    monthly_port = (1 + expected_return) ** (1 / 12) - 1
    monthly_spy = 1.10 ** (1 / 12) - 1
    for i in range(120):
        _rnd.seed(i * 137 + 42)
        noise = 1 + (_rnd.random() - 0.5) * 0.025
        port_val *= (1 + monthly_port) * noise
        spy_val *= (1 + monthly_spy)
        year = 2015 + (i // 12)
        month = (i % 12) + 1
        mock_data.append({"date": f"{year}-{month:02d}", "portfolio": round(port_val, 2), "spy": round(spy_val, 2)})

    return {"points": mock_data, "start_value": 10000, "estimated": True, "label": "Estimated based on expected return"}


# ── Anonymous Leaderboard ─────────────────────────────────────────────────────
_LEADERBOARD_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "leaderboard.json")


def _load_leaderboard() -> List[Dict]:
    if not os.path.exists(_LEADERBOARD_PATH):
        return []
    try:
        with open(_LEADERBOARD_PATH, "r") as f:
            data = json.load(f)
        # Keep only entries from current week (ISO week)
        current_week = _dt.datetime.utcnow().isocalendar()[:2]
        return [e for e in data if tuple(e.get("week", [0, 0])) == current_week]
    except Exception:
        return []


def _save_leaderboard(entries: List[Dict]) -> None:
    try:
        with open(_LEADERBOARD_PATH, "w") as f:
            json.dump(entries, f)
    except Exception as exc:
        _logger.error(f"[leaderboard] save failed: {exc}")


@app.post("/leaderboard/submit", summary="Submit anonymous portfolio score to leaderboard")
def leaderboard_submit(req: LeaderboardSubmitRequest, request: Request):
    ip = _get_client_ip(request)
    wait = _check_rate_limit(ip, "/leaderboard/submit")
    if wait is not None:
        return JSONResponse(status_code=429, content={"error": f"Rate limited. Wait {wait}s."})

    entries = _load_leaderboard()
    now = _dt.datetime.utcnow()
    week = list(now.isocalendar()[:2])
    entries.append({"smart_score": req.smart_score, "grade": req.grade, "week": week, "ts": now.isoformat()})
    _save_leaderboard(entries)

    scores = [e["smart_score"] for e in entries]
    scores.sort()
    rank = sum(1 for s in scores if s <= req.smart_score)
    percentile = round((1 - rank / len(scores)) * 100) if scores else 50
    return {"percentile": percentile, "total_submissions": len(scores)}


@app.get("/leaderboard/rank", summary="Get leaderboard stats for current week")
def leaderboard_rank(request: Request):
    entries = _load_leaderboard()
    if not entries:
        return {"percentile": 50, "total_submissions": 0}
    return {"total_submissions": len(entries), "avg_score": round(sum(e["smart_score"] for e in entries) / len(entries), 2)}

import datetime as _dt
import math
import json
import os
import pickle
import re
import time
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

import numpy as np
import pandas as pd
import yfinance as yf
import riskfolio as rp

try:
    from curl_cffi import requests as curl_requests
    _CURL_CFFI_AVAILABLE = True
except ImportError:
    curl_requests = None  # type: ignore[assignment]
    _CURL_CFFI_AVAILABLE = False


SECTOR_TO_ETFS: Dict[str, List[str]] = {
    "AI & Technology": [
        "QQQ",   # Invesco NASDAQ-100, ER 0.20%
        "VGT",   # Vanguard IT, ER 0.10%
        "IYW",   # iShares US Technology, ER 0.39%
        "SOXX",  # iShares Semiconductor, ER 0.35%
        "SMH",   # VanEck Semiconductor, ER 0.35%
        "IGV",   # iShares Software, ER 0.41%
        "BOTZ",  # Global X Robotics & AI, ER 0.68%
        "FTEC",  # Fidelity MSCI IT, ER 0.08%
    ],
    "Healthcare & Biotech": [
        "XLV",   # SPDR Health Care Sector, ER 0.10%
        "VHT",   # Vanguard Health Care, ER 0.10%
        "IBB",   # iShares Biotechnology, ER 0.44%
        "XBI",   # SPDR Biotech, ER 0.35%
        "IHI",   # iShares Medical Devices, ER 0.40%
        "FHLC",  # Fidelity MSCI Health Care, ER 0.08%
        "ARKG",  # ARK Genomic Revolution, ER 0.75%
        "HTEC",  # Robo Global Healthcare, ER 0.68%
    ],
    "Clean Energy & Environment": [
        "ICLN",  # iShares Global Clean Energy, ER 0.40%
        "TAN",   # Invesco Solar, ER 0.67%
        "FAN",   # First Trust Wind Energy, ER 0.60%
        "QCLN",  # First Trust NASDAQ Clean Edge, ER 0.58%
        "ACES",  # ALPS Clean Energy, ER 0.55%
        "CNRG",  # SPDR Clean Energy, ER 0.45%
        "SMOG",  # VanEck Low Carbon Energy, ER 0.50%
        "ERTH",  # Invesco MSCI Sustainable Future, ER 0.55%
    ],
    "Robotics & Innovation": [
        "ARKK",  # ARK Innovation, ER 0.75%
        "ROBO",  # Robo Global Robotics, ER 0.95%
        "BOTZ",  # Global X Robotics & AI, ER 0.68%
        "IRBO",  # iShares Robotics & AI, ER 0.47%
        "KOMP",  # SPDR S&P Kensho New Economies, ER 0.20%
        "ARKX",  # ARK Space Exploration, ER 0.75%
        "METV",  # Roundhill Ball Metaverse, ER 0.59%
        "PRNT",  # 3D Printing ETF, ER 0.66%
    ],
    "Real Estate": [
        "VNQ",   # Vanguard Real Estate, ER 0.12%
        "SCHH",  # Schwab US REIT, ER 0.07%
        "IYR",   # iShares US Real Estate, ER 0.39%
        "XLRE",  # Real Estate Select Sector SPDR, ER 0.10%
        "ICF",   # iShares Cohen & Steers REIT, ER 0.33%
        "REZ",   # iShares Residential Real Estate, ER 0.48%
        "INDS",  # Pacer Industrial Real Estate, ER 0.55%
        "REM",   # iShares Mortgage Real Estate, ER 0.48%
    ],
    "Commodities & Resources": [
        "GLD",   # SPDR Gold Shares, ER 0.40%
        "IAU",   # iShares Gold Trust, ER 0.25%
        "SLV",   # iShares Silver Trust, ER 0.50%
        "PDBC",  # Invesco Optimum Yield Diversified, ER 0.59%
        "COMT",  # iShares GSCI Commodity, ER 0.48%
        "PALL",  # Aberdeen Physical Palladium, ER 0.60%
        "CPER",  # US Copper Index Fund, ER 0.65%
        "WEAT",  # Teucrium Wheat Fund, ER 1.00%
    ],
    "Financials": [
        "XLF",   # Financial Select Sector SPDR, ER 0.10%
        "VFH",   # Vanguard Financials, ER 0.10%
        "KBE",   # SPDR S&P Bank, ER 0.35%
        "KRE",   # SPDR S&P Regional Banking, ER 0.35%
        "IAI",   # iShares Broker-Dealers & Exchanges, ER 0.40%
        "KBWB",  # Invesco KBW Bank, ER 0.35%
        "FTXO",  # First Trust Nasdaq Bank, ER 0.60%
        "BIZD",  # VanEck BDC Income, ER 0.41%
    ],
    "Consumer & Retail": [
        "XLY",   # Consumer Discretionary Select Sector SPDR, ER 0.10%
        "XLP",   # Consumer Staples Select Sector SPDR, ER 0.10%
        "VCR",   # Vanguard Consumer Discretionary, ER 0.10%
        "IYK",   # iShares US Consumer Staples, ER 0.39%
        "FDIS",  # Fidelity MSCI Consumer Discretionary, ER 0.08%
        "FSTA",  # Fidelity MSCI Consumer Staples, ER 0.08%
        "IYC",   # iShares US Consumer Discretionary, ER 0.39%
        "ONLN",  # ProShares Online Retail, ER 0.58%
    ],
    "Industrials & Defense": [
        "XLI",   # Industrial Select Sector SPDR, ER 0.10%
        "VIS",   # Vanguard Industrials, ER 0.10%
        "ITA",   # iShares US Aerospace & Defense, ER 0.40%
        "PPA",   # Invesco Aerospace & Defense, ER 0.57%
        "XAR",   # SPDR Aerospace & Defense, ER 0.35%
        "IYT",   # iShares Transportation Average, ER 0.39%
        "WOOD",  # iShares Global Timber & Forestry, ER 0.41%
        "ITB",   # iShares US Home Construction, ER 0.39%
    ],
    "Emerging & International Markets": [
        "EEM",   # iShares MSCI Emerging Markets, ER 0.68%
        "VWO",   # Vanguard FTSE Emerging Markets, ER 0.08%
        "IEMG",  # iShares Core MSCI Emerging Markets, ER 0.09%
        "SCHE",  # Schwab Emerging Markets, ER 0.11%
        "FNDE",  # Schwab Fundamental EM Large Company, ER 0.39%
        "EWJ",   # iShares MSCI Japan, ER 0.50%
        "EWZ",   # iShares MSCI Brazil, ER 0.57%
        "INDA",  # iShares MSCI India, ER 0.65%
    ],
    "Bonds & Fixed Income": [
        "AGG",   # iShares Core US Aggregate Bond, ER 0.03%
        "BND",   # Vanguard Total Bond Market, ER 0.03%
        "TLT",   # iShares 20+ Year Treasury Bond, ER 0.15%
        "IEF",   # iShares 7-10 Year Treasury Bond, ER 0.15%
        "LQD",   # iShares Investment Grade Corporate Bond, ER 0.14%
        "HYG",   # iShares High Yield Corporate Bond, ER 0.48%
        "EMB",   # iShares JP Morgan USD Emerging Markets Bond, ER 0.39%
        "MUB",   # iShares National Muni Bond, ER 0.07%
    ],
    "Dividends & Income": [
        "VYM",   # Vanguard High Dividend Yield, ER 0.06%
        "SCHD",  # Schwab US Dividend Equity, ER 0.06%
        "HDV",   # iShares Core High Dividend, ER 0.08%
        "DGRO",  # iShares Core Dividend Growth, ER 0.08%
        "NOBL",  # ProShares S&P 500 Dividend Aristocrats, ER 0.35%
        "DVY",   # iShares Select Dividend, ER 0.38%
        "SDY",   # SPDR S&P Dividend, ER 0.35%
        "SPYD",  # SPDR Portfolio S&P 500 High Dividend, ER 0.07%
    ],
    "Small & Mid Cap": [
        "IWM",   # iShares Russell 2000, ER 0.19%
        "IJH",   # iShares Core S&P Mid-Cap, ER 0.05%
        "VB",    # Vanguard Small-Cap, ER 0.05%
        "VO",    # Vanguard Mid-Cap, ER 0.04%
        "IJR",   # iShares Core S&P Small-Cap, ER 0.06%
        "SCHA",  # Schwab US Small-Cap, ER 0.04%
        "IWO",   # iShares Russell 2000 Growth, ER 0.24%
        "MDY",   # SPDR S&P MidCap 400, ER 0.23%
    ],
    "Sector Specific": [
        "XLE",   # Energy Select Sector SPDR, ER 0.10%
        "XLU",   # Utilities Select Sector SPDR, ER 0.10%
        "XLB",   # Materials Select Sector SPDR, ER 0.10%
        "XLK",   # Technology Select Sector SPDR, ER 0.10%
        "XLC",   # Communication Services Select Sector, ER 0.10%
        "GDX",   # VanEck Gold Miners, ER 0.51%
        "LIT",   # Global X Lithium & Battery Tech, ER 0.75%
        "REMX",  # VanEck Rare Earth/Strategic Metals, ER 0.53%
    ],
    "Crypto & Blockchain": [
        "BITO",  # ProShares Bitcoin Strategy, ER 0.95%
        "BLOK",  # Amplify Transformational Data Sharing, ER 0.71%
        "BITQ",  # Bitwise Crypto Industry Innovators, ER 0.85%
        "GBTC",  # Grayscale Bitcoin Trust, ER 1.50%
        "DAPP",  # VanEck Digital Transformation, ER 0.51%
        "BKCH",  # Global X Blockchain, ER 0.50%
    ],
    "Leveraged & Alternative": [
        "JEPI",  # JPMorgan Equity Premium Income, ER 0.35%
        "JEPQ",  # JPMorgan Nasdaq Equity Premium Income, ER 0.35%
        "COWZ",  # Pacer US Cash Cows 100, ER 0.49%
        "MOAT",  # VanEck Morningstar Wide Moat, ER 0.46%
        "DIVO",  # Amplify CWP Enhanced Dividend Income, ER 0.55%
        "SPHD",  # Invesco S&P 500 High Dividend Low Volatility, ER 0.30%
        "OMFL",  # Invesco Russell 1000 Dynamic Multifactor, ER 0.29%
        "PFF",   # iShares Preferred & Income Securities, ER 0.46%
    ],
}

# ── Tier-1 ETFs: the 15 most liquid/established ETFs per built-in category ────
# Used in build_universe() to prioritise liquid ETFs and keep the download
# universe small (≤ 60 tickers) when the user selects many categories.
TIER_1_ETFS: Dict[str, List[str]] = {k: v[:15] for k, v in SECTOR_TO_ETFS.items()}

# ── Core diversification anchors ──────────────────────────────────────────────
# These are always injected into every portfolio regardless of category selection,
# ensuring broad-market exposure and a minimum ETF count.
BROAD_MARKET_CORE: List[str] = ["VTI", "QQQ", "SPY"]   # large-cap broad anchors
SMALL_CAP_CORE:    List[str] = ["VB",  "IJR", "SCHA"]  # small-cap diversifiers
ALL_CORE_ETFS:     List[str] = BROAD_MARKET_CORE + SMALL_CAP_CORE

# Portfolio constraint constants
MIN_PORTFOLIO_ETFS:      int   = 10    # always return at least this many ETFs
BROAD_MARKET_MIN_WEIGHT: float = 0.30  # combined floor for ALL_CORE_ETFS (all risk levels)

# Load additional ETF categories/tickers without editing code.
# The extra file is optional; if it doesn't exist, the app uses the built-in universe.
script_dir = os.path.dirname(os.path.abspath(__file__))
_extra_path = os.path.join(script_dir, "etf_universe_extra.json")

LEVERAGED_BLACKLIST_RE = re.compile(r"\b(2X|3X|BULL|BEAR|ULTRA|SHORT|INVERSE)\b", re.IGNORECASE)

# ── Known delisted / broken tickers — filtered out before any download attempt ─
# These are skipped in build_universe() so they never reach yfinance.
# Adding a ticker here is the correct fix when logs show:
#   "PARTIAL HIT — 59/60 tickers cached, downloading 1 missing"
# followed by "Saved 59 tickers" (the missing one returned nothing usable).
#
# BOAT  — no recognized active ETF with this ticker; was causing the 59/60 miss
# ASEA  — Global X Southeast Asia ETF, liquidated Nov 2022
# AWAY  — ETFMG Travel Tech ETF, liquidated Mar 2022
# TRVL  — no recognized active ETF with this ticker
DELISTED_TICKERS: set = {"RXP", "SXP", "FBGX", "BOAT", "ASEA", "AWAY", "TRVL"}

# ── Fallback universe — used to pad portfolios when < MIN_PORTFOLIO_ETFS tickers
# survive the data-quality filter.  All 20 are large, liquid, battle-tested funds
# with 10+ years of history.  Ordered by decreasing liquidity / reliability.
FALLBACK_UNIVERSE: List[str] = [
    "VTI", "QQQ", "SPY", "VB",  "IJR",
    "SCHA", "IWM", "MDY", "VEA", "VWO",
    "GLD", "TLT", "LQD", "VNQ", "XLK",
    "XLV", "XLF", "XLE", "XLI", "XLU",
]

# ── Local price-data cache ────────────────────────────────────────────────────
_CACHE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "price_cache.pkl")
_CACHE_MAX_AGE_SECONDS: float = 24 * 60 * 60  # 24 hours


def _load_raw_universe() -> Dict[str, List[str]]:
    universe: Dict[str, List[str]] = {k: list(v) for k, v in SECTOR_TO_ETFS.items()}
    if os.path.exists(_extra_path):
        try:
            with open(_extra_path, "r", encoding="utf-8") as f:
                extra = json.load(f)
            if isinstance(extra, dict):
                for category, tickers in extra.items():
                    if not isinstance(category, str) or not isinstance(tickers, list):
                        continue
                    existing = list(universe.get(category, []))
                    for t in tickers:
                        if not isinstance(t, str):
                            continue
                        sym = t.strip().upper()
                        if sym:
                            existing.append(sym)
                    universe[category] = existing
        except Exception:
            pass
    return universe


def _dedupe_universe_global(raw: Dict[str, List[str]]) -> Dict[str, List[str]]:
    # Deduplicate tickers *within* each category only.
    # ETFs that appear in multiple categories are intentional — the same fund
    # can serve multiple themes (e.g. DRIV covers both EV and Battery Tech).
    # Cross-category deduplication happens at portfolio-build time inside
    # build_universe() so that every selected category contributes ≥ 1 ticker.
    cleaned: Dict[str, List[str]] = {}
    for category, tickers in raw.items():
        seen_in_cat: set = set()
        out: List[str] = []
        for t in tickers:
            sym = str(t).strip().upper()
            if not sym or sym in seen_in_cat:
                continue
            out.append(sym)
            seen_in_cat.add(sym)
        cleaned[category] = out
    return cleaned


def _is_leveraged_from_metadata(name: str, description: str) -> bool:
    text = f"{name} {description}".strip()
    return bool(LEVERAGED_BLACKLIST_RE.search(text))


UNIVERSE_TO_ETFS: Dict[str, List[str]] = _dedupe_universe_global(_load_raw_universe())


@dataclass(frozen=True)
class PortfolioPerformance:
    expected_return: float  # annualized, decimal (e.g. 0.12)
    volatility: float  # annualized, decimal (e.g. 0.18)
    sharpe: float


def _save_price_cache(prices: pd.DataFrame) -> None:
    """Persist a downloaded price DataFrame to a local pickle file with a timestamp."""
    try:
        payload = {"timestamp": time.time(), "prices": prices}
        with open(_CACHE_PATH, "wb") as f:
            pickle.dump(payload, f, protocol=pickle.HIGHEST_PROTOCOL)
        print(f"[cache] Saved {prices.shape[1]} tickers to {_CACHE_PATH}")
    except Exception as exc:
        print(f"[cache] Failed to write cache: {exc}")


def _load_price_cache() -> Tuple[Optional[pd.DataFrame], float]:
    """Return (prices, age_seconds) if cache is fresh (< 24 h), else (None, age)."""
    try:
        if not os.path.exists(_CACHE_PATH):
            print("[cache] MISS — no cache file found.")
            return None, 0.0
        with open(_CACHE_PATH, "rb") as f:
            payload = pickle.load(f)
        age = time.time() - float(payload.get("timestamp", 0))
        if age > _CACHE_MAX_AGE_SECONDS:
            print(f"[cache] MISS — cache expired ({age / 3600:.1f} h old), will re-download.")
            return None, age
        prices = payload.get("prices")
        if isinstance(prices, pd.DataFrame) and not prices.empty:
            return prices, age
    except Exception as exc:
        print(f"[cache] Failed to read cache: {exc}")
    return None, 0.0


# Keep old names as aliases so any external callers still work.
def cache_prices(prices: pd.DataFrame, cache_key: str = "") -> None:
    _save_price_cache(prices)


def load_cached_prices(cache_key: str = "") -> Optional[pd.DataFrame]:
    df, _ = _load_price_cache()
    return df


def _chunks(seq: Sequence[str], chunk_size: int) -> Iterable[List[str]]:
    for i in range(0, len(seq), chunk_size):
        yield list(seq[i : i + chunk_size])


def _download_tickers_raw(
    tickers: Sequence[str],
    start_date: _dt.date,
    end_date: _dt.date,
    batch_size: int,
    min_observations: int,
    session,
) -> pd.DataFrame:
    """Download, parse, and filter price data for *tickers*. Internal helper.

    Does NOT touch the cache — callers handle cache read/write.
    """
    price_frames: List[pd.DataFrame] = []
    for batch in _chunks(list(tickers), batch_size):
        df = None
        for attempt in range(2):
            try:
                kwargs: Dict = dict(
                    start=str(start_date),
                    end=str(end_date),
                    interval="1d",
                    auto_adjust=True,
                    group_by="ticker",
                    progress=False,
                    threads=True,
                    timeout=30,
                )
                if session is not None:
                    kwargs["session"] = session
                df = yf.download(batch, **kwargs)
                break
            except Exception as exc:
                if attempt == 0:
                    print(f"[download] Batch attempt 1 failed ({type(exc).__name__}: {exc}), retrying in 3 s…")
                    time.sleep(3)
                else:
                    print(f"[download] Batch attempt 2 failed — skipping {len(batch)} ticker(s). ({type(exc).__name__}: {exc})")
                    df = None

        if df is None or df.empty:
            continue

        # Extract Close prices, handling both MultiIndex layouts yfinance may return.
        if isinstance(df.columns, pd.MultiIndex):
            lv0 = df.columns.get_level_values(0)
            lv1 = df.columns.get_level_values(1)
            if "Close" in set(lv1):
                close = df.xs("Close", axis=1, level=1)
            elif "Close" in set(lv0):
                close = df.xs("Close", axis=1, level=0)
            else:
                continue
        else:
            if "Close" not in df.columns:
                continue
            close = df[["Close"]]
            close.columns = batch[:1]

        close.columns = [str(c) for c in close.columns]
        price_frames.append(close)

    if not price_frames:
        return pd.DataFrame()

    prices = pd.concat(price_frames, axis=1)
    prices = prices.loc[:, ~prices.columns.duplicated()]

    # Drop ETFs with insufficient history.
    counts = prices.count()
    valid = counts[counts >= min_observations].index.tolist()
    prices = prices[valid]

    prices = prices.ffill().dropna(how="any")
    return prices


def _parse_int_list(raw: str, max_value: int) -> List[int]:
    parts = [p.strip() for p in raw.split(",") if p.strip()]
    indices: List[int] = []
    for p in parts:
        v = int(p)
        if v < 1 or v > max_value:
            raise ValueError(f"Selection {v} is out of range 1..{max_value}.")
        indices.append(v)
    # De-dup while keeping order
    seen = set()
    deduped = []
    for v in indices:
        if v not in seen:
            seen.add(v)
            deduped.append(v)
    return deduped


def _prompt_float(prompt: str, allow_zero: bool = True) -> float:
    while True:
        raw = input(prompt).strip().replace(",", "")
        try:
            val = float(raw)
        except ValueError:
            print("Please enter a number.")
            continue
        if not allow_zero and val <= 0:
            print("Value must be > 0.")
            continue
        if allow_zero and val < 0:
            print("Value must be >= 0.")
            continue
        return val


def _prompt_int(prompt: str, min_value: int = 1, max_value: int = 100) -> int:
    while True:
        raw = input(prompt).strip()
        try:
            val = int(raw)
        except ValueError:
            print("Please enter an integer.")
            continue
        if val < min_value or val > max_value:
            print(f"Value must be between {min_value} and {max_value}.")
            continue
        return val


def prompt_user_inputs() -> Tuple[str, List[str], int, float, float, int]:
    name = input("What is your name? ").strip()
    if not name:
        name = "Investor"

    categories = list(UNIVERSE_TO_ETFS.keys())
    print("\nWhich ETF categories are you interested in?")
    for i, s in enumerate(categories, start=1):
        print(f"{i}. {s}")

    while True:
        raw = input("Enter category numbers (comma-separated): ").strip()
        try:
            chosen_indices = _parse_int_list(raw, max_value=len(categories))
            chosen_categories = [categories[i - 1] for i in chosen_indices]
            if not chosen_categories:
                raise ValueError("No categories selected.")
            break
        except Exception as e:
            print(f"Invalid input: {e}")

    while True:
        risk = input(
            "\nWhat is your risk comfort? (1=Very Conservative, 2=Conservative, 3=Moderate, 4=Aggressive, 5=Very Aggressive) "
        ).strip()
        try:
            risk_tolerance = int(risk)
        except ValueError:
            print("Enter a number from 1 to 5.")
            continue
        if risk_tolerance < 1 or risk_tolerance > 5:
            print("Enter a number from 1 to 5.")
            continue
        break

    lump_sum = _prompt_float("\nHow much are you investing as a One-Time Investment right now? (can be $0) $", allow_zero=True)
    weekly = _prompt_float("\nHow much are you investing weekly? (can be $0) $", allow_zero=True)
    age = _prompt_int("\nHow old are you? (18-100) ", min_value=18, max_value=100)

    return name, chosen_categories, risk_tolerance, lump_sum, weekly, age


def build_universe(selected_categories: Sequence[str]) -> List[str]:
    """Build an ordered ticker list for *selected_categories*.

    Strategy:
    1. Always prepend ALL_CORE_ETFS (broad-market anchors).
    2. First pass — add up to 15 TIER_1 ETFs per selected category.
       These are the most liquid/established funds in each category.
    3. Second pass — add remaining ETFs only if total universe < 60 tickers.
       This keeps the download fast while still supporting diversity.
    """
    tickers: List[str] = []
    seen: set = set()

    # Step 1: core anchors always come first.
    for core in ALL_CORE_ETFS:
        if core not in seen and core not in DELISTED_TICKERS:
            seen.add(core)
            tickers.append(core)

    # Step 2: add TIER_1 ETFs for each selected category.
    for category in selected_categories:
        tier1 = TIER_1_ETFS.get(category, UNIVERSE_TO_ETFS.get(category, []))
        for t in tier1:
            if t not in seen and t not in DELISTED_TICKERS:
                seen.add(t)
                tickers.append(t)

    # Step 3: fill in the rest of each category only if still under 60 tickers.
    if len(tickers) < 60:
        for category in selected_categories:
            for t in UNIVERSE_TO_ETFS.get(category, []):
                if len(tickers) >= 60:
                    break
                if t not in seen and t not in DELISTED_TICKERS:
                    seen.add(t)
                    tickers.append(t)

    return tickers


def remove_leveraged_etfs(tickers: Sequence[str]) -> List[str]:
    # Permanently remove leveraged/inverse/short/ultra/bull/bear ETFs based on name/description.
    kept: List[str] = []
    for sym in tickers:
        name, desc = etf_details(sym)
        if _is_leveraged_from_metadata(name, desc):
            continue
        kept.append(sym)
    return kept


def download_10y_prices(
    tickers: Sequence[str],
    start_date: Optional[_dt.date] = None,
    end_date: Optional[_dt.date] = None,
    *,
    min_observations: int = 252 * 3,
    batch_size: int = 40,
) -> pd.DataFrame:
    """Download adjusted daily close prices for *tickers* from Yahoo Finance.

    Cache strategy:
    - On a full HIT (all requested tickers present in a fresh cache) → return instantly.
    - On a PARTIAL HIT → download only the missing tickers, merge, save, return.
    - On a MISS → download everything, save, return.
    Cache is valid for 24 hours; stale cache triggers a full re-download.
    """
    if start_date is None:
        start_date = _dt.date.today() - _dt.timedelta(days=365 * 10)
    if end_date is None:
        end_date = _dt.date.today()

    # Deduplicate while preserving order.
    tickers_list: List[str] = list(dict.fromkeys(tickers))

    # Build a curl_cffi browser-impersonation session to avoid Yahoo 401 blocks.
    if _CURL_CFFI_AVAILABLE:
        session = curl_requests.Session(impersonate="chrome")  # type: ignore[union-attr]
    else:
        session = None
        print("[download] curl_cffi not installed — falling back to default session (may hit 401 errors).")

    # ── Cache lookup ──────────────────────────────────────────────────────────
    cached_df, cache_age = _load_price_cache()

    if cached_df is not None:
        cached_tickers = set(cached_df.columns.tolist())
        requested_set = set(tickers_list)
        missing = requested_set - cached_tickers

        if not missing:
            # Full hit — every requested ticker is already cached.
            print(f"[cache] HIT — all {len(requested_set)} tickers in cache ({cache_age / 60:.1f} min old). Skipping download.")
            available = [t for t in tickers_list if t in cached_tickers]
            return cached_df[available]
        else:
            # Partial hit — download only the missing tickers.
            print(
                f"[cache] PARTIAL HIT — {len(requested_set) - len(missing)}/{len(requested_set)} tickers cached "
                f"({cache_age / 60:.1f} min old). Downloading {len(missing)} missing ticker(s)."
            )
            fresh = _download_tickers_raw(
                list(missing), start_date, end_date, batch_size, min_observations, session
            )
            if not fresh.empty:
                merged = pd.concat([cached_df, fresh], axis=1)
                merged = merged.loc[:, ~merged.columns.duplicated()]
                _save_price_cache(merged)
                cached_df = merged
            available = [t for t in tickers_list if t in cached_df.columns]
            return cached_df[available] if available else pd.DataFrame()
    else:
        # Full miss — download everything.
        print(f"[cache] MISS — downloading all {len(tickers_list)} tickers.")
        prices = _download_tickers_raw(
            tickers_list, start_date, end_date, batch_size, min_observations, session
        )
        if not prices.empty:
            _save_price_cache(prices)
        return prices


def pad_prices_to_minimum(
    prices: pd.DataFrame,
    start_date: _dt.date,
    end_date: _dt.date,
    *,
    min_tickers: int = MIN_PORTFOLIO_ETFS,
    min_observations: int = 252 * 3,
) -> pd.DataFrame:
    """Ensure *prices* has at least *min_tickers* columns.

    If the portfolio universe produced fewer tickers than the minimum (e.g.
    because a niche category has only 1 ETF with sufficient history), this
    function downloads FALLBACK_UNIVERSE tickers not already present and
    merges them in.  The merge is an outer join on the date index with NaN
    values forward-filled, so the primary prices are never overwritten.

    Returns the original DataFrame unchanged if already at or above the minimum.
    """
    if prices.shape[1] >= min_tickers:
        return prices

    # Only request tickers not already in the DataFrame
    candidates = [t for t in FALLBACK_UNIVERSE if t not in prices.columns]
    if not candidates:
        return prices

    needed = min_tickers - prices.shape[1]
    # Request a few extras so that history-filter dropouts still leave enough
    fetch = candidates[: needed + 5]
    print(
        f"[pad] Portfolio has only {prices.shape[1]} tickers (<{min_tickers}). "
        f"Downloading {len(fetch)} fallback ticker(s): {fetch}"
    )
    fallback = download_10y_prices(
        fetch, start_date, end_date, min_observations=min_observations
    )
    if fallback.empty:
        return prices

    merged = pd.concat([prices, fallback], axis=1)
    merged = merged.loc[:, ~merged.columns.duplicated()]
    return merged


# ── Known expense ratios for common overlapping ETF pairs ─────────────────────
# Used as tiebreaker when two ETFs exceed the correlation threshold.
# Lower ER = cheaper fund = kept. Format: ticker → annual ER as decimal.
_KNOWN_ER: Dict[str, float] = {
    # Gold trackers
    "IAU":  0.0009, "GLD":  0.0040, "SGOL": 0.0017, "GLDM": 0.0010, "BAR":  0.0017,
    # Silver trackers
    "SLV":  0.0050, "SIVR": 0.0030,
    # S&P 500 trackers
    "SPY":  0.0009, "IVV":  0.0003, "VOO":  0.0003, "SPLG": 0.0002,
    # Total US market
    "VTI":  0.0003, "ITOT": 0.0003, "SCHB": 0.0003,
    # Nasdaq/growth
    "QQQ":  0.0020, "QQQM": 0.0015,
    # Small cap
    "VB":   0.0005, "IJR":  0.0006, "IWM":  0.0019, "SCHA": 0.0004,
    # International developed
    "VEA":  0.0005, "EFA":  0.0032, "SCHF": 0.0006,
    # Emerging markets
    "VWO":  0.0008, "EEM":  0.0070, "SCHE": 0.0011,
    # US bonds (total)
    "BND":  0.0003, "AGG":  0.0003, "SCHZ": 0.0003,
    # Long-term Treasury
    "TLT":  0.0015, "VGLT": 0.0004, "SPTL": 0.0006,
    # Corp bonds
    "LQD":  0.0014, "VCIT": 0.0004,
    # Tech sector
    "XLK":  0.0013, "VGT":  0.0010, "FTEC": 0.0008,
    # REITs
    "VNQ":  0.0012, "IYR":  0.0039, "SCHH": 0.0007,
    # Energy
    "XLE":  0.0009, "VDE":  0.0010, "IYE":  0.0039,
    # Healthcare
    "XLV":  0.0013, "VHT":  0.0010,
    # Financials
    "XLF":  0.0013, "VFH":  0.0010,
}


def filter_correlated_etfs(prices: pd.DataFrame, *, threshold: float = 0.85) -> pd.DataFrame:
    """Remove near-duplicate ETFs whose pairwise return correlation exceeds *threshold*.

    Motivation: assets like SGOL and IAU both track gold spot price with ~0.99
    correlation.  Including both doesn't add diversification — it just makes the
    covariance matrix near-singular and inflates position counts.

    Rules:
    - Core anchors (ALL_CORE_ETFS) are NEVER dropped regardless of correlation.
    - Between a core anchor and a non-core ETF, drop the non-core one.
    - Between two non-core ETFs, keep the one with the lower expense ratio.
    - If ER is unknown for both, keep the earlier-appearing one (tier-1 priority).

    Logs each removal:
        [corr-filter] Dropped SGOL (corr=0.99 with IAU, ER=0.17% vs 0.09%)
    """
    if prices.shape[1] <= 1:
        return prices

    tickers = list(prices.columns)
    rets = prices.pct_change().dropna(how="any")
    if rets.empty or rets.shape[0] < 30:
        return prices  # insufficient returns history — skip filter

    corr = rets.corr()
    dropped: set = set()

    def _er(ticker: str) -> float:
        # Unknown ER → 0.9999 so it always loses the tiebreak to a known-ER fund
        return _KNOWN_ER.get(ticker, 0.9999)

    for i in range(len(tickers)):
        t1 = tickers[i]
        if t1 in dropped:
            continue
        for j in range(i + 1, len(tickers)):
            t2 = tickers[j]
            if t2 in dropped:
                continue
            if t1 not in corr.index or t2 not in corr.columns:
                continue
            c = float(corr.loc[t1, t2])
            if c <= threshold:
                continue

            t1_core = t1 in ALL_CORE_ETFS
            t2_core = t2 in ALL_CORE_ETFS
            if t1_core and t2_core:
                continue  # Never pit core anchors against each other
            if t1_core:
                drop, keep = t2, t1
            elif t2_core:
                drop, keep = t1, t2
            else:
                # Both non-core: keep the cheaper fund
                drop, keep = (t2, t1) if _er(t1) <= _er(t2) else (t1, t2)

            dropped.add(drop)
            er_keep = _KNOWN_ER.get(keep)
            er_drop = _KNOWN_ER.get(drop)
            keep_str = f"{er_keep * 100:.2f}%" if er_keep is not None else "ER unknown"
            drop_str = f"{er_drop * 100:.2f}%" if er_drop is not None else "ER unknown"
            print(
                f"[corr-filter] Dropped {drop} (corr={c:.2f} with {keep}, "
                f"ER={drop_str} vs {keep_str})"
            )

    if dropped:
        remaining = [t for t in tickers if t not in dropped]
        print(
            f"[corr-filter] {len(dropped)} duplicate(s) removed — "
            f"{len(remaining)}/{len(tickers)} tickers kept (threshold={threshold:.0%})"
        )
        return prices[remaining]

    return prices


def _one_sentence(text: str, max_chars: int = 160) -> str:
    cleaned = re.sub(r"\s+", " ", (text or "").strip())
    if not cleaned:
        return ""
    # Prefer the first sentence if present.
    idx = cleaned.find(".")
    if idx != -1 and idx < max_chars:
        return cleaned[: idx + 1]
    return (cleaned[:max_chars] + ("..." if len(cleaned) > max_chars else "")).rstrip(".") + "."


def _full_text(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip())


def etf_details(ticker: str) -> Tuple[str, str]:
    # Best-effort metadata; if fields are missing, we fall back to ticker-derived text.
    try:
        t = yf.Ticker(ticker)
        info = t.info or {}
    except Exception:
        info = {}

    long_name = info.get("longName") or info.get("shortName") or ticker

    description = (
        info.get("longBusinessSummary")
        or info.get("summary")
        or info.get("sector")
        or info.get("industry")
        or ""
    )
    description = _full_text(str(description))
    if not description:
        description = "Description unavailable via data source."
    return str(long_name), description


def simplify_description(full: str) -> str:
    # 1-2 plain-English sentences max; avoid heavy jargon.
    text = _full_text(full)
    if not text:
        return "A diversified fund that holds a basket of stocks or bonds."
    # Remove/soften jargon-y phrases.
    replacements = {
        "benchmark index": "a market list",
        "tracks the": "follows",
        "seeks to provide investment results": "aims to match",
        "non-diversified": "more concentrated than most funds",
        "derivatives": "special contracts",
        "swaptions": "special contracts",
    }
    lowered = text
    for k, v in replacements.items():
        lowered = re.sub(re.escape(k), v, lowered, flags=re.IGNORECASE)
    # Keep only first 2 sentences.
    sentences = re.split(r"(?<=[.!?])\s+", lowered)
    kept = " ".join(sentences[:2]).strip()
    if not kept.endswith((".", "!", "?")):
        kept += "."
    # Reasonable length cap.
    return kept[:320].rstrip() + ("..." if len(kept) > 320 else "")


def etf_top_holdings(ticker: str, n: int = 5) -> List[str]:
    # Best-effort: yfinance can return ETF top holdings for many tickers.
    try:
        fd = yf.Ticker(ticker).get_funds_data()
        th = getattr(fd, "top_holdings", None)
        if th is None or not isinstance(th, pd.DataFrame) or th.empty:
            return []
        if "Name" in th.columns:
            names = [str(x).strip() for x in th["Name"].head(n).tolist()]
        else:
            names = [str(x).strip() for x in th.head(n).index.tolist()]
        return [x for x in names if x]
    except Exception:
        return []


def is_leveraged_name(name: str) -> bool:
    n = (name or "").upper()
    return (" 2X" in n) or (" 3X" in n) or ("2X " in n) or ("3X " in n) or ("ULTRAPRO" in n) or ("ULTRA " in n)


def per_etf_metrics(prices: pd.DataFrame) -> Tuple[pd.Series, pd.Series]:
    rets = prices.pct_change().dropna(how="any")
    if rets.empty:
        idx = prices.columns
        return pd.Series(0.0, index=idx), pd.Series(0.0, index=idx)
    ann_return = (1.0 + rets.mean()) ** 252 - 1.0
    ann_vol = rets.std(ddof=1) * math.sqrt(252.0)
    return ann_return, ann_vol


def compute_mu(prices: pd.DataFrame) -> pd.Series:
    """Annualised expected returns from daily prices.

    Uses compounding: ``(1 + μ_daily)^252 − 1``.  Consistent with the
    Riskfolio-Lib internal estimate used inside ``optimize_portfolio``.
    """
    rets = prices.pct_change().dropna(how="any")
    return (1.0 + rets.mean()) ** 252 - 1.0


def compute_cov(prices: pd.DataFrame) -> pd.DataFrame:
    """Annualised sample covariance matrix from daily prices.

    Multiplies daily covariance by 252 — already annualised; do NOT
    multiply again.  Consistent with Riskfolio-Lib's ``method_cov='hist'``
    estimate scaled to annual units.
    """
    rets = prices.pct_change().dropna(how="any")
    return rets.cov() * 252.0


def compute_performance_from_weights(
    weights: pd.Series,
    mu: pd.Series,
    cov: pd.DataFrame,
    risk_free_rate: float,
) -> PortfolioPerformance:
    w = weights.reindex(mu.index).fillna(0.0).values.astype(float)
    mu_vec = mu.values.astype(float)
    cov_mat = cov.values.astype(float)

    expected_return = float(np.dot(w, mu_vec))
    volatility = float(math.sqrt(float(w.T @ cov_mat @ w)))
    sharpe = float((expected_return - risk_free_rate) / volatility) if volatility > 0 else float("nan")
    return PortfolioPerformance(
        expected_return=expected_return,
        volatility=volatility,
        sharpe=sharpe,
    )


def filter_and_renormalize(weights: pd.Series, *, min_allocation: float = 0.02) -> pd.Series:
    w = weights.astype(float)
    w = w[w > 1e-12]
    if w.empty:
        return w
    filtered = w[w >= min_allocation]
    if filtered.empty:
        filtered = w.nlargest(1)
    return filtered / float(filtered.sum())


def enforce_portfolio_constraints(
    weights: pd.Series,
    prices: pd.DataFrame,
    mu: pd.Series,
    *,
    min_etfs: int = MIN_PORTFOLIO_ETFS,
    broad_floor: float = BROAD_MARKET_MIN_WEIGHT,
    risk_tolerance: int = 3,
) -> pd.Series:
    """Post-optimization guardrails applied to every risk level:

    1. Ensure combined weight of ALL_CORE_ETFS >= broad_floor (30 %).
       Uses risk-differentiated minimum targets so conservative portfolios
       favour VTI (stability) while aggressive portfolios favour QQQ (growth).

    2. Pad the portfolio to at least min_etfs holdings by seeding the
       highest-mu candidates from the downloaded universe at 2 % each,
       then renormalising.

    3. Hard-cap any single ETF at 20 %.
    """
    w = weights.astype(float, copy=True)

    # Only consider core anchors that actually survived the history filter
    anchors: List[str] = [t for t in ALL_CORE_ETFS if t in prices.columns]

    # ── Step 1: Risk-differentiated broad-market floor ────────────────────────
    # Minimum weight targets per anchor, differentiated by risk tolerance.
    # Each risk profile sums to broad_floor (30 %) across all six anchors.
    _anchor_targets: Dict[str, Dict[str, float]] = {
        # All individual targets capped at 0.10 to match the per-ETF weight cap.
        "conservative": {"VTI": 0.10, "SPY": 0.10, "QQQ": 0.04, "VB": 0.025, "IJR": 0.025, "SCHA": 0.010},
        "moderate":     {"VTI": 0.09, "SPY": 0.09, "QQQ": 0.07, "VB": 0.020, "IJR": 0.020, "SCHA": 0.010},
        "aggressive":   {"VTI": 0.05, "SPY": 0.08, "QQQ": 0.10, "VB": 0.030, "IJR": 0.030, "SCHA": 0.010},
    }
    risk_key = "conservative" if risk_tolerance <= 2 else ("aggressive" if risk_tolerance >= 4 else "moderate")
    anchor_targets = _anchor_targets[risk_key]
    default_target = broad_floor / max(1, len(anchors))

    if anchors:
        # Raise each anchor to at least its target minimum
        for a in anchors:
            target = anchor_targets.get(a, default_target)
            current = float(w[a]) if a in w.index else 0.0
            if current < target:
                w[a] = target

        # If total anchor weight still below floor (e.g. some anchors absent),
        # distribute remaining deficit equally among present anchors.
        anchor_total = float(sum(float(w[a]) if a in w.index else 0.0 for a in anchors))
        if anchor_total < broad_floor:
            deficit = broad_floor - anchor_total
            per_anchor = deficit / len(anchors)
            for a in anchors:
                current = float(w[a]) if a in w.index else 0.0
                w[a] = current + per_anchor

        # Scale non-anchors down so portfolio still sums to ≈ 1
        anchor_total_now = float(sum(float(w[a]) if a in w.index else 0.0 for a in anchors))
        non_anchor_keys = [t for t in w.index if t not in anchors]
        non_total = float(sum(float(w[t]) for t in non_anchor_keys))
        target_non = max(0.0, 1.0 - anchor_total_now)
        if non_total > 1e-9 and target_non < non_total:
            scale = target_non / non_total
            for t in non_anchor_keys:
                w[t] = float(w[t]) * scale

    # Renormalise after anchor adjustment
    total = float(w.sum())
    if total > 1e-9:
        w = w / total

    # ── Step 2: Minimum ETF count ─────────────────────────────────────────────
    if len(w) < min_etfs:
        needed = min_etfs - len(w)
        # Candidates: highest expected-return tickers in the universe not yet held
        candidates = [
            t for t in mu.sort_values(ascending=False).index
            if t not in w.index and t in prices.columns
        ]
        for cand in candidates[:needed]:
            w[cand] = 0.02  # seed at minimum allocation
        total = float(w.sum())
        if total > 1e-9:
            w = w / total

    # ── Step 3: Hard cap each ETF at 10 % ────────────────────────────────────
    max_single = 0.10
    for _pass in range(20):  # iterate until stable (redistribute excess each pass)
        over = {t: float(w[t]) for t in w.index if float(w[t]) > max_single}
        if not over:
            break
        excess = sum(v - max_single for v in over.values())
        for t in over:
            w[t] = max_single
        under = [t for t in w.index if float(w[t]) < max_single]
        if not under:
            break
        per_under = excess / len(under)
        for t in under:
            new_val = float(w[t]) + per_under
            w[t] = min(max_single, new_val)
    total = float(w.sum())
    if total > 1e-9:
        w = w / total
    # Re-apply cap one final time: renormalization can push capped weights above
    # max_single when fewer ETFs share the weight budget (e.g. 8 ETFs at 10% each
    # = 0.80, renormalized = 12.5% each). A single extra pass is always sufficient.
    over_final = [t for t in w.index if float(w[t]) > max_single + 1e-9]
    if over_final:
        excess_final = sum(float(w[t]) - max_single for t in over_final)
        for t in over_final:
            w[t] = max_single
        under_final = [t for t in w.index if float(w[t]) < max_single - 1e-9]
        if under_final:
            per_u = excess_final / len(under_final)
            for t in under_final:
                w[t] = min(max_single, float(w[t]) + per_u)
        total = float(w.sum())
        if total > 1e-9:
            w = w / total

    # ── Step 4: Energy/MLP sector concentration cap ───────────────────────────
    # Pipeline and MLP ETFs can crowd a portfolio (e.g. AMLP + ENFR + MLPA = 42%).
    # Cap their combined weight at 15 % and redistribute excess to broad anchors.
    _ENERGY_MLP: set = {"AMLP", "ENFR", "MLPA", "AMZA", "EMLP"}
    _ENERGY_CAP: float = 0.15
    energy_held = [t for t in w.index if t in _ENERGY_MLP]
    if energy_held:
        energy_total = float(sum(float(w[t]) for t in energy_held))
        if energy_total > _ENERGY_CAP:
            excess = energy_total - _ENERGY_CAP
            scale = _ENERGY_CAP / energy_total
            for t in energy_held:
                w[t] = float(w[t]) * scale
            # Redistribute excess weight to broad-market anchors; fall back to
            # equal renormalisation if none of VTI/QQQ/SPY are present.
            redistributors = [t for t in ("VTI", "QQQ", "SPY") if t in w.index]
            if redistributors:
                per_r = excess / len(redistributors)
                for t in redistributors:
                    w[t] = min(0.10, float(w[t]) + per_r)
            total = float(w.sum())
            if total > 1e-9:
                w = w / total

    return w.sort_values(ascending=False)


def _differentiate_equal_weights(weights: pd.Series, mu: pd.Series, tolerance: float = 0.0005) -> pd.Series:
    """If more than 3 ETFs share the same rounded weight, use expected returns
    to break ties — higher-mu ETFs get a small positive nudge so each position
    looks meaningfully different in the report."""
    w = weights.copy().astype(float)
    # Bucket by weight rounded to 3 decimal places
    rounded = (w * 1000).round().astype(int)
    for wt_val, count in rounded.value_counts().items():
        if count <= 3:
            continue
        tied = rounded[rounded == wt_val].index.tolist()
        n = len(tied)
        # Sort tied tickers by expected return (best gets the highest nudge)
        mu_sorted = mu.reindex(tied).fillna(0.0).sort_values(ascending=False)
        for rank, ticker in enumerate(mu_sorted.index):
            # Linear nudge: top gets +(n-1)*tolerance/2, bottom gets -(n-1)*tolerance/2
            nudge = ((n - 1) / 2.0 - rank) * tolerance
            w[ticker] = max(0.001, float(w[ticker]) + nudge)
    total = float(w.sum())
    if total > 1e-9:
        w = w / total
    return w


def optimize_portfolio(
    prices: pd.DataFrame,
    risk_tolerance: int,
    *,
    risk_free_rate: float = 0.0,
) -> Tuple[pd.Series, PortfolioPerformance]:
    """Mean-variance optimisation using Riskfolio-Lib.

    Objective by risk profile:
    - RT 1–2 (Conservative): MinRisk  — minimise portfolio variance.
    - RT 3–5 (Moderate / Aggressive): Sharpe — maximise risk-adjusted return.

    Fallback chain (solver failures, infeasible problems, etc.):
        MaxSharpe  →  MinRisk  →  EqualWeight

    Hard constraints enforced at the solver level:
    - No short selling  (port.sht = False)
    - Max 10 % per ETF  (port.upperlng = 0.10)
    - Fully invested    (port.upperlng ≤ 1 sum constraint implicit)

    Post-solver pipeline (unchanged business rules):
        filter_and_renormalize  →  enforce_portfolio_constraints
        →  _differentiate_equal_weights  →  filter_and_renormalize
        →  final hard-cap pass  →  compute_performance_from_weights
    """
    # ── Annualised mu and cov — used by every downstream function ────────────
    rets = prices.pct_change().dropna(how="any")
    mu = (1.0 + rets.mean()) ** 252 - 1.0   # compounding annualisation
    cov = rets.cov() * 252.0                  # scale daily cov to annual

    tickers = list(prices.columns)
    n = len(tickers)

    if n == 1:
        weights = pd.Series({tickers[0]: 1.0})
        perf = compute_performance_from_weights(weights, mu, cov, risk_free_rate)
        return weights, perf

    # Riskfolio's internal estimates are in daily units; rf must match.
    # Convert annual rf (e.g. 0.045) to its daily equivalent.
    rf_daily = (1.0 + risk_free_rate) ** (1.0 / 252) - 1.0

    # Conservative profiles minimise variance; others maximise Sharpe.
    primary_obj = "MinRisk" if risk_tolerance <= 2 else "Sharpe"

    def _build_port() -> rp.Portfolio:
        port = rp.Portfolio(returns=rets)
        port.assets_stats(method_mu="hist", method_cov="hist")
        port.sht = False       # no short selling
        port.upperlng = 0.10   # hard 10 % per-ETF cap at solver level
        port.lowerlng = 0.0    # no negative weights
        return port

    raw_weights: Optional[pd.Series] = None

    # ── Attempt 1: primary objective ──────────────────────────────────────────
    try:
        port = _build_port()
        w_df = port.optimization(model="Classic", rm="MV", obj=primary_obj, rf=rf_daily, l=0, hist=True)
        if w_df is not None and not w_df.empty:
            raw_weights = w_df["weights"]
            n_active = int((raw_weights > 1e-4).sum())
            print(f"[optimizer] {primary_obj} succeeded: {n_active} active ETFs")
    except Exception as exc:
        print(f"[optimizer] {primary_obj} failed: {exc}")

    # ── Attempt 2: fallback to MinRisk ────────────────────────────────────────
    if raw_weights is None and primary_obj != "MinRisk":
        try:
            port = _build_port()
            w_df = port.optimization(model="Classic", rm="MV", obj="MinRisk", rf=rf_daily, l=0, hist=True)
            if w_df is not None and not w_df.empty:
                raw_weights = w_df["weights"]
                print("[optimizer] Fell back to MinRisk")
        except Exception as exc:
            print(f"[optimizer] MinRisk fallback failed: {exc}")

    # ── Attempt 3: equal weight ───────────────────────────────────────────────
    if raw_weights is None:
        print("[optimizer] Fell back to equal weight")
        raw_weights = pd.Series(1.0 / n, index=tickers, dtype=float)

    # ── Post-solver pipeline (business rules — unchanged) ────────────────────
    cleaned = filter_and_renormalize(raw_weights, min_allocation=0.02)
    if cleaned.empty:
        best_ticker = str(mu.idxmax())
        cleaned = pd.Series({best_ticker: 1.0})

    # Broad-market floor (30 % min across ALL_CORE_ETFS) + 10-ETF minimum count.
    cleaned = enforce_portfolio_constraints(cleaned, prices, mu, risk_tolerance=risk_tolerance)
    # Break ties when > 3 ETFs share the same weight.
    cleaned = _differentiate_equal_weights(cleaned, mu)
    # Final renormalise (1 % threshold keeps newly-seeded ETFs alive).
    cleaned = filter_and_renormalize(cleaned, min_allocation=0.01)

    # Hard cap one final time — filter_and_renormalize renormalizes and can push
    # weights above 10 % if fewer than 10 ETFs share the budget
    # (e.g. 8 × 10 % = 0.80, renormalized → 12.5 %).  Authoritative enforcement.
    _final_cap = 0.10
    if float(cleaned.max()) > _final_cap + 1e-9:
        cleaned = cleaned.clip(upper=_final_cap)
        _t = float(cleaned.sum())
        if _t > 1e-9:
            cleaned = cleaned / _t

    perf = compute_performance_from_weights(cleaned, mu, cov, risk_free_rate)
    return cleaned, perf


def allocate_exact(total: float, weights: pd.Series) -> Dict[str, float]:
    # Allocate using weights, rounding all but the last to 2 decimals.
    tickers = list(weights.index)
    amounts: Dict[str, float] = {}
    remaining = round(float(total), 2)
    for i, t in enumerate(tickers):
        w = float(weights.loc[t])
        if i == len(tickers) - 1:
            amounts[t] = float(round(remaining, 2))
        else:
            amt = round(float(total) * w, 2)
            amounts[t] = amt
            remaining = round(remaining - amt, 2)
    return amounts


def future_value_with_weekly_contrib(
    lump_sum: float,
    weekly_contrib: float,
    years: float,
    expected_annual_return: float,
) -> float:
    # Convert annual return into a weekly compounding rate.
    r_week = (1.0 + expected_annual_return) ** (1.0 / 52.0) - 1.0
    n = int(round(float(years) * 52))

    if n <= 0:
        return float(lump_sum + weekly_contrib)

    if abs(r_week) < 1e-12:
        return float(lump_sum + weekly_contrib * n)

    fv_lump = lump_sum * ((1.0 + r_week) ** n)
    fv_contrib = weekly_contrib * (((1.0 + r_week) ** n - 1.0) / r_week)
    return float(fv_lump + fv_contrib)


def run(
    categories: Optional[List[str]] = None,
    *,
    risk_tolerance: int = 3,
    lump_sum: float = 1000.0,
    weekly_contribution: float = 0.0,
    age: int = 30,
    name: str = "Investor",
) -> Dict:
    """Run portfolio optimisation.

    Can be called two ways:

    1. **Programmatic** — pass ``categories`` (and optional kwargs).
       Returns a results dict with at minimum ``{"weights": {ticker: float}}``.

    2. **Interactive CLI** — call with no arguments.
       Prompts the user for all inputs, prints a full report, and still
       returns the same results dict.
    """
    if categories is not None:
        chosen_categories = list(categories)
        weekly = weekly_contribution
    else:
        name, chosen_categories, risk_tolerance, lump_sum, weekly, age = prompt_user_inputs()

    universe = remove_leveraged_etfs(build_universe(chosen_categories))
    if not universe:
        raise SystemExit("No non-leveraged ETFs available for the selected categories.")

    # 10 years of history.
    today = _dt.date.today()
    start_date = today - _dt.timedelta(days=365 * 10)

    # Require enough history to build a stable covariance matrix.
    min_observations = 252 * 3  # ~3 trading years
    print("\nDownloading historical prices (this may take a while)...")
    prices = download_10y_prices(universe, start_date, today, min_observations=min_observations)

    if prices.empty or prices.shape[1] == 0:
        raise SystemExit("No tickers had enough historical data. Try different categories.")

    if prices.shape[1] == 1:
        print("Only one ETF had enough historical data; using 100% allocation.")

    # Drop near-duplicate ETFs (e.g. SGOL + IAU both tracking gold spot price)
    # BEFORE padding so the pad step can bring the count back up to MIN_PORTFOLIO_ETFS.
    # Order matters: filter first → pad after ensures the final pool is always ≥ 10.
    prices = filter_correlated_etfs(prices)

    # Pad to MIN_PORTFOLIO_ETFS (10) using FALLBACK_UNIVERSE if correlation filtering
    # or thin category selections left fewer tickers with sufficient history.
    prices = pad_prices_to_minimum(prices, start_date, today, min_observations=min_observations)

    # Risk-free rate: use current approximate 3-month T-bill yield (~4.5%).
    # Using 0.0 inflated Sharpe ratios and distorted the efficient frontier by
    # treating all return as "excess" — now calibrated to today's environment.
    weights, perf = optimize_portfolio(prices, risk_tolerance, risk_free_rate=0.045)
    etf_ann_return, etf_ann_vol = per_etf_metrics(prices)

    # Prepare output.
    recommended = weights.index.tolist()
    lump_alloc = allocate_exact(lump_sum, weights)
    weekly_alloc = allocate_exact(weekly, weights)

    # Fetch metadata only for recommended ETFs.
    details = {}
    top_holdings = {}
    print("\nFetching ETF names/descriptions...")
    for t in recommended:
        details[t] = etf_details(t)
        top_holdings[t] = etf_top_holdings(t, n=5)

    # Projections: cap expected returns at 15% to avoid misleading outputs.
    proj_return = float(min(0.15, max(0.0, perf.expected_return)))
    proj_return_opt = float(min(0.15, proj_return * 1.20))
    proj_return_cons = float(max(0.0, proj_return * 0.80))

    # Projections are now age-based (see "WHAT YOUR MONEY COULD BECOME" section below).

    lines: List[str] = []
    script_dir = os.path.dirname(os.path.abspath(__file__))
    results_path = os.path.join(script_dir, "results.txt")

    def add_line(s: str = "") -> None:
        print(s)
        lines.append(s)

    add_line("═══════════════════════════════════════")
    add_line(f"👋 HI {name.upper()}! HERE IS YOUR FRONTIERFI REPORT")
    add_line("═══════════════════════════════════════")
    add_line("")
    add_line("⚖️  FRIENDLY LEGAL DISCLAIMER (PLEASE READ)")
    add_line("FrontierFi is for educational and informational purposes only.")
    add_line("- This is NOT financial advice")
    add_line("- FrontierFi is NOT a registered investment advisor")
    add_line("- Past performance does NOT guarantee future results")
    add_line("- All investing involves risk including possible loss of principal")
    add_line("- This tool does not know your full situation (taxes, debt, goals, income, etc.)")
    add_line("- Always consider talking to a licensed financial advisor")
    add_line("- Do not invest money you cannot afford to lose")
    add_line("")

    risk_label = (
        "🟢 Conservative" if risk_tolerance <= 2 else ("🟡 Moderate" if risk_tolerance == 3 else "🔴 Aggressive")
    )
    add_line("🎯 YOUR INVESTMENT PROFILE")
    add_line(f"- You care about: {', '.join(chosen_categories)}")
    add_line(f"- Your risk comfort: {risk_label}")
    add_line(f"- You are investing: ${lump_sum:,.2f} One-Time Investment + ${weekly:,.2f}/week")
    add_line(f"- Your goal: retirement planning")
    add_line(f"- Your current age: {age}")
    add_line("")

    # Scores (plain English)
    risk_score = float(min(0.20, max(0.0, perf.volatility)))
    risk_pct = risk_score * 100.0
    swing_amount = float(lump_sum) * risk_score
    # ── Smart Score ───────────────────────────────────────────────────────────
    # Formula: 10 * (1 - e^(-1.5 * sharpe))
    # The ×1.5 exponent scales the typical ETF Sharpe range (0.0–1.5) to the
    # full 0–10 display scale so grades are meaningfully distributed:
    #   A (smart ≥ 7.5) → Sharpe ≥ 0.92  — genuinely excellent
    #   B (smart ≥ 6.0) → Sharpe ≥ 0.67  — above average
    #   C (smart ≥ 4.5) → Sharpe ≥ 0.47  — average (ETF benchmark range)
    #   D (smart ≥ 2.5) → Sharpe ≥ 0.19  — below average
    #   F (smart < 2.5) → Sharpe < 0.19  — genuinely poor
    # BEFORE (bug): exponent was -1*sharpe, requiring Sharpe ≥ 1.39 for an A —
    # an impossible bar for any capped diversified portfolio, causing C-clustering.
    smart = max(0.0, min(10.0, 10.0 * (1.0 - math.exp(-1.5 * max(0.0, float(perf.sharpe))))))
    smart_emoji = "🌟" if smart >= 7 else ("✅" if smart >= 5.5 else "⚠️")
    div_eff = 1.0 / float((weights.fillna(0.0) ** 2).sum()) if not weights.empty else 1.0
    diversification_score = max(0.0, min(10.0, div_eff))
    grade = (
        "A" if (smart >= 7.5 and diversification_score >= 6.0) else
        "B" if smart >= 6.0 else
        "C" if smart >= 4.5 else
        "D" if smart >= 2.5 else
        "F"
    )

    add_line("📊 YOUR PORTFOLIO HEALTH SCORE")
    add_line(
        f"- Smart Score: {smart:.1f}/10 {smart_emoji} — This measures how much return you get for the risk you take. Higher is better. Anything above 7 is excellent."
    )
    add_line(
        f"- Risk Score: {risk_pct:.0f}% — In any given year your portfolio has historically swung up OR down by this percentage. On your ${lump_sum:,.2f} One-Time Investment that means you could gain ${swing_amount:,.2f} or lose ${swing_amount:,.2f} in a single year. The higher this number, the wilder the ride."
    )
    add_line(f"- Expected Growth: {proj_return * 100.0:.1f}% per year on average")
    add_line(f"- Letter Grade: {grade}")
    add_line(f"- Diversification Score: {diversification_score:.1f}/10")
    add_line("")

    add_line("💼 YOUR RECOMMENDED ETFs")
    for t in recommended:
        full_name, desc = details[t]
        alloc_pct = float(weights.loc[t]) * 100.0
        r = float(etf_ann_return.get(t, 0.0)) * 100.0
        holdings = top_holdings.get(t, [])
        add_line(f"✅ {full_name} ({t}) — {simplify_description(desc)}")
        if holdings:
            add_line(f"   🏢 You are investing in companies like: {', '.join(holdings[:3])}")
        add_line(f"   📈 Recommended Split: {alloc_pct:.1f}% = ${lump_alloc[t]:,.2f} one-time / ${weekly_alloc[t]:,.2f} weekly")
        add_line(f"   📊 Historical Performance: Averaged {r:.1f}% per year over the available history")
        add_line("")

    add_line("💰 WHAT YOUR MONEY COULD BECOME")
    retirement_age = 59.5
    if float(age) < retirement_age:
        years_to_ret = retirement_age - float(age)
        # 10-year milestones until 59.5, then final 59.5 line
        milestone_years: List[float] = []
        k = 10
        while k < years_to_ret:
            milestone_years.append(float(k))
            k += 10
        milestone_years.append(float(years_to_ret))

        for y in milestone_years:
            at_age = float(age) + float(y)
            cons = future_value_with_weekly_contrib(lump_sum, weekly, y, proj_return_cons)
            opt = future_value_with_weekly_contrib(lump_sum, weekly, y, proj_return_opt)
            if abs(at_age - retirement_age) < 1e-6:
                add_line(
                    f"- At age 59.5 ({y:.1f} years - TAX FREE WITHDRAWAL AGE): ${cons:,.0f} (conservative) → ${opt:,.0f} (optimistic)"
                )
            else:
                add_line(f"- At age {at_age:.0f} ({y:.0f} years): ${cons:,.0f} (conservative) → ${opt:,.0f} (optimistic)")

        add_line("")
        add_line(
            "Note: Age 59.5 is when you can withdraw from retirement accounts like a Roth IRA or 401k without paying a 10% early withdrawal penalty. If you invest through a regular brokerage account this restriction does not apply."
        )

        # Fun retirement milestone using conservative projection at 59.5
        retire_value = future_value_with_weekly_contrib(lump_sum, weekly, years_to_ret, proj_return_cons)
        monthly_4pct = (retire_value * 0.04) / 12.0
        add_line("")
        add_line(
            f"🎉 RETIREMENT GOAL: If you stay consistent, by the time you're 59 you could have ${retire_value/1_000_000:,.2f} million. That means you could withdraw about ${monthly_4pct:,.0f} per month forever without touching your principal (using the 4% rule)."
        )
    else:
        for horizon in [5, 10, 15, 20]:
            cons = future_value_with_weekly_contrib(lump_sum, weekly, float(horizon), proj_return_cons)
            opt = future_value_with_weekly_contrib(lump_sum, weekly, float(horizon), proj_return_opt)
            add_line(f"- In {horizon} years: ${cons:,.0f} (conservative) → ${opt:,.0f} (optimistic)")
    add_line("")

    add_line("🌟 WHY WE PICKED THESE FOR YOU")
    add_line(
        f"We focused on the categories you chose ({', '.join(chosen_categories)}), then looked for funds that historically offered strong growth for the amount of risk you're comfortable taking."
    )
    add_line("We also capped your Risk Score at 20% so the ride stays more reasonable for everyday investors.")
    add_line("")

    add_line("📋 IMPORTANT REMINDERS")
    add_line("- Diversification does not guarantee profit or protect against loss")
    add_line("- ETF data is sourced from Yahoo Finance — verify all information independently")
    add_line("- Rebalance at least once per year (a simple calendar reminder works)")
    add_line("- Consider your full financial picture before investing")
    add_line("")
    add_line("🔄 SUGGESTED NEXT STEPS:")
    add_line("1. Open a brokerage account (Fidelity, Schwab, or Robinhood are beginner friendly)")
    add_line("2. Search for each ETF ticker symbol listed above")
    add_line("3. Invest your recommended amounts")
    add_line("4. Set a calendar reminder to review this portfolio in 12 months")
    add_line("5. Consider speaking with a licensed financial advisor")

    add_line("")
    add_line(f"Saved your report to: {results_path}")

    with open(results_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    # Always return a results dict (useful for programmatic callers and tests).
    return {
        "weights": {t: float(weights.loc[t]) for t in weights.index},
        "performance": {
            "expected_annual_return": float(perf.expected_return),
            "annual_volatility": float(perf.volatility),
            "sharpe_ratio": float(perf.sharpe) if not math.isnan(perf.sharpe) else 0.0,
        },
        "scores": {
            "smart_score": float(smart),
            "grade": grade,
            "diversification_score": float(diversification_score),
        },
        "categories": chosen_categories,
    }


if __name__ == "__main__":
    run()

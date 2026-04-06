/**
 * brokerageService.ts
 *
 * Foundation for brokerage deep-link integration.
 * All functions here are stubs — they build URLs based on publicly documented
 * deep-link schemes.  Actual execution requires the user's brokerage app to be
 * installed and the scheme to be registered on the device.
 *
 * References:
 *   Fidelity:  https://developer.fidelity.com  (mobile deep-link scheme: fidelity://)
 *   Schwab:    Charles Schwab mobile app uses  schwab://  (documented in their developer portal)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BrokerageHolding {
  ticker: string;
  weight: number;       // 0–1 (e.g. 0.35 = 35%)
  dollarAmount: number; // estimated dollar value to invest in this holding
}

// The shape we expect from the optimizer API response (mirrors OptimizeResponse.holdings)
interface RawHolding {
  ticker: string;
  weight: number;
  lump_sum_amount: number;
  weekly_amount?: number;
  name?: string;
}

interface RawPortfolio {
  holdings: RawHolding[];
}

// ---------------------------------------------------------------------------
// formatPortfolioForBrokerage
// ---------------------------------------------------------------------------

/**
 * Converts the raw optimizer response into a clean, brokerage-agnostic shape.
 * Each entry contains the ticker, fractional weight, and estimated lump-sum dollar amount.
 */
export function formatPortfolioForBrokerage(portfolio: RawPortfolio): BrokerageHolding[] {
  return portfolio.holdings.map(h => ({
    ticker: h.ticker,
    weight: h.weight,
    dollarAmount: h.lump_sum_amount,
  }));
}

// ---------------------------------------------------------------------------
// generateFidelityDeepLink
// ---------------------------------------------------------------------------

/**
 * Builds a Fidelity mobile deep link for a given portfolio.
 *
 * What Fidelity needs:
 *   - Ticker symbol  (required)
 *   - Order type     (e.g. "market" or "limit")
 *   - Dollar amount or share quantity
 *
 * Fidelity deep-link format (publicly documented):
 *   fidelity://trade?symbol=TICKER&orderType=market&dollarAmount=AMOUNT
 *
 * Because portfolios contain multiple tickers, this returns a link to the
 * first/largest holding as a starting point.  A production implementation
 * would either open each ticker sequentially or use Fidelity's basket trading
 * feature (requires Wealth Services API access).
 *
 * @param portfolio  Raw optimizer response object
 * @returns          Deep-link URI string
 */
export function generateFidelityDeepLink(portfolio: RawPortfolio): string {
  const holdings = formatPortfolioForBrokerage(portfolio);

  if (holdings.length === 0) {
    return 'fidelity://trade';
  }

  // Link to the largest single holding; surface the full list in the UI
  const primary = holdings.reduce((best, h) => (h.weight > best.weight ? h : best), holdings[0]);

  const params = new URLSearchParams({
    symbol:      primary.ticker,
    orderType:   'market',
    dollarAmount: primary.dollarAmount.toFixed(2),
  });

  return `fidelity://trade?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// generateSchwabDeepLink
// ---------------------------------------------------------------------------

/**
 * Builds a Charles Schwab mobile deep link for a given portfolio.
 *
 * What Schwab needs:
 *   - Ticker symbol
 *   - Action        ("buy" or "sell")
 *   - Dollar amount or share quantity
 *
 * Schwab deep-link format (publicly documented):
 *   schwab://trade?symbol=TICKER&action=buy&amount=AMOUNT
 *
 * Same single-ticker limitation as Fidelity above — production use would
 * integrate with the Schwab Individual Trader API for programmatic order entry.
 *
 * @param portfolio  Raw optimizer response object
 * @returns          Deep-link URI string
 */
export function generateSchwabDeepLink(portfolio: RawPortfolio): string {
  const holdings = formatPortfolioForBrokerage(portfolio);

  if (holdings.length === 0) {
    return 'schwab://trade';
  }

  const primary = holdings.reduce((best, h) => (h.weight > best.weight ? h : best), holdings[0]);

  const params = new URLSearchParams({
    symbol: primary.ticker,
    action: 'buy',
    amount: primary.dollarAmount.toFixed(2),
  });

  return `schwab://trade?${params.toString()}`;
}

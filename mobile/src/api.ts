// TODO: Before App Store launch, implement SSL certificate pinning using
// react-native-ssl-pinning to prevent man-in-the-middle attacks. See SECURITY.md.

import { OnboardingData, OptimizeResponse, MarketPulseData, HistoricalPoint, LeaderboardRank } from './types';
import { APP_SECRET } from './constants';

// Install via: npx expo install @react-native-community/netinfo
import NetInfo from '@react-native-community/netinfo';

// Production: Render backend — update .env when URL changes.
// EXPO_PUBLIC_API_URL is set in mobile/.env — edit that file, never this line directly.
// Fallback is the Render URL so the app works even if .env is missing.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://my-frontier-api.onrender.com';
const TIMEOUT_MS = 35_000; // 35s — gives Render free tier cold starts (~30s) time to wake
const OPTIMIZE_TIMEOUT_MS = 120_000; // portfolio calc can take up to 2 minutes

// ---------------------------------------------------------------------------
// Auth header — sent with every request as a lightweight scraping deterrent
// ---------------------------------------------------------------------------
const AUTH_HEADERS = {
  'Content-Type': 'application/json',
  'X-App-Secret': APP_SECRET,
};

// ---------------------------------------------------------------------------
// Network connectivity check
// ---------------------------------------------------------------------------
async function assertConnected(): Promise<void> {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    throw new Error('No internet connection. Please check your network and try again.');
  }
}

// ---------------------------------------------------------------------------
// Input sanitization — called before any API request
// ---------------------------------------------------------------------------
export function sanitizeOnboardingData(data: OnboardingData): OnboardingData {
  const name = data.name.trim().slice(0, 50);

  const lumpSum = parseFloat(String(data.lumpSum));
  if (isNaN(lumpSum) || lumpSum < 0 || lumpSum > 10_000_000) {
    throw new Error('Lump sum must be between $0 and $10,000,000.');
  }

  const weeklyContribution = parseFloat(String(data.weeklyContribution));
  if (isNaN(weeklyContribution) || weeklyContribution < 0 || weeklyContribution > 100_000) {
    throw new Error('Weekly contribution must be between $0 and $100,000.');
  }

  const age = parseInt(String(data.age), 10);
  if (isNaN(age) || age < 13 || age > 100) {
    throw new Error('Age must be between 13 and 100.');
  }

  const riskTolerance = parseInt(String(data.riskTolerance), 10);
  if (isNaN(riskTolerance) || riskTolerance < 1 || riskTolerance > 5) {
    throw new Error('Risk tolerance must be between 1 and 5.');
  }

  return { name, categories: data.categories, lumpSum, weeklyContribution, age, riskTolerance };
}

// ---------------------------------------------------------------------------
// Core fetch wrapper — aborts after timeoutMs (defaults to TIMEOUT_MS)
// ---------------------------------------------------------------------------
async function fetchWithTimeout(
  url: string,
  options?: RequestInit,
  timeoutMs: number = TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (e: any) {
    if (e.name === 'AbortError') {
      throw new Error('Portfolio calculation timed out. Please try again.');
    }
    throw e;
  } finally {
    clearTimeout(id);
  }
}

// ---------------------------------------------------------------------------
// Retry wrapper — retries up to 2 times (handles Render free-tier cold starts)
// Waits 5s between attempts so a waking server has time to come up.
// ---------------------------------------------------------------------------
async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise(resolve => setTimeout(resolve, 5000));
    return withRetry(fn, retries - 1);
  }
}

// ---------------------------------------------------------------------------
// checkHealth — pings /health, returns true if the server is reachable & OK
// ---------------------------------------------------------------------------
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// fetchCategories
// ---------------------------------------------------------------------------
export async function fetchCategories(): Promise<string[]> {
  await assertConnected();
  return withRetry(async () => {
    const url = `${BASE_URL}/categories`;
    console.log('[fetchCategories] Calling:', url);
    const res = await fetchWithTimeout(url, {
      headers: AUTH_HEADERS,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any)?.detail ?? (err as any)?.error ?? `Server error ${res.status}`);
    }
    return res.json();
  });
}

// ---------------------------------------------------------------------------
// optimizePortfolio — uses 120s timeout (calculation takes 30–90s)
// ---------------------------------------------------------------------------
export async function optimizePortfolio(data: OnboardingData): Promise<OptimizeResponse> {
  await assertConnected();
  const safe = sanitizeOnboardingData(data);
  return withRetry(async () => {
    const res = await fetchWithTimeout(
      `${BASE_URL}/optimize`,
      {
        method: 'POST',
        headers: AUTH_HEADERS,
        body: JSON.stringify({
          name: safe.name,
          categories: safe.categories,
          risk_tolerance: safe.riskTolerance,
          lump_sum: safe.lumpSum,
          weekly_contribution: safe.weeklyContribution,
          age: safe.age,
        }),
      },
      OPTIMIZE_TIMEOUT_MS,
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any)?.detail ?? (err as any)?.error ?? `Server error ${res.status}`);
    }
    return res.json();
  });
}

// ---------------------------------------------------------------------------
// callAdvisor — legacy proxy; kept for backward compat (used by AdvisorScreen)
// ---------------------------------------------------------------------------
export async function callAdvisor(
  messages: { role: string; content: string }[],
  portfolio: OptimizeResponse | null,
): Promise<string> {
  return callAlex(messages, portfolio);
}

// ---------------------------------------------------------------------------
// callAlex — Alex AI assistant via dedicated /alex endpoint
// Accepts multi-turn message history + current portfolio for personalisation.
// ---------------------------------------------------------------------------
export async function callAlex(
  messages: { role: string; content: string }[],
  portfolio: OptimizeResponse | null,
): Promise<string> {
  await assertConnected();
  const url = `${BASE_URL}/alex`;
  console.log('[Alex] calling:', url);
  const ALEX_TIMEOUT = 20_000;

  async function attempt(): Promise<string> {
    const res = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: AUTH_HEADERS,
        body: JSON.stringify({
          messages,
          portfolio,
          user_name: portfolio?.profile?.name ?? 'User',
        }),
      },
      ALEX_TIMEOUT,
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any)?.detail ?? (err as any)?.error ?? `API error ${res.status}`);
    }
    const data = await res.json();
    return (data?.reply ?? '').trim();
  }

  try {
    return await attempt();
  } catch {
    // Retry once after 2s
    await new Promise(r => setTimeout(r, 2000));
    try {
      return await attempt();
    } catch {
      return 'Having trouble connecting. Try again in a moment!';
    }
  }
}

// ---------------------------------------------------------------------------
// fetchMarketPulse — GET /market-pulse (SPY, QQQ, AGG daily changes)
// ---------------------------------------------------------------------------
export async function fetchMarketPulse(): Promise<MarketPulseData> {
  const res = await fetchWithTimeout(`${BASE_URL}/market-pulse`, { headers: AUTH_HEADERS });
  if (!res.ok) throw new Error(`Market pulse error ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// fetchHistorical — POST /historical (portfolio vs SPY over 10y)
// ---------------------------------------------------------------------------
export async function fetchHistorical(
  weights: Record<string, number>,
): Promise<HistoricalPoint[]> {
  await assertConnected();
  const res = await fetchWithTimeout(
    `${BASE_URL}/historical`,
    {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({ weights }),
    },
    OPTIMIZE_TIMEOUT_MS,
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.detail ?? `Historical error ${res.status}`);
  }
  const data = await res.json();
  return data?.points ?? [];
}

// ---------------------------------------------------------------------------
// submitLeaderboard — POST /leaderboard/submit (anonymous score submission)
// ---------------------------------------------------------------------------
export async function submitLeaderboard(smartScore: number, grade: string): Promise<LeaderboardRank> {
  const res = await fetchWithTimeout(
    `${BASE_URL}/leaderboard/submit`,
    {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: JSON.stringify({ smart_score: smartScore, grade }),
    },
  );
  if (!res.ok) throw new Error(`Leaderboard error ${res.status}`);
  return res.json();
}

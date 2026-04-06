import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, shadow } from '../../theme';
import { OptimizeResponse } from '../../types';

// ── Ticker classification sets (used for breakdown bars) ─────────────────────
const BOND_TICKERS = new Set([
  'AGG','BND','TLT','IEF','LQD','HYG','JNK','EMB','MUB','TIP',
  'VTIP','SCHP','STIP','USFR','FLRN','FLTR','IVOL','PFIX','RINF','LTPZ',
]);
const SMALL_CAP_TICKERS = new Set([
  'VB','IJR','IWM','SCHA','VBK','VBR','IWO','IWN','MDY','IVOO',
  'IJJ','IJK','IJS','VO','SDOG',
]);
const BROAD_MARKET_TICKERS = new Set([
  'VTI','SPY','QQQ','VOO','SCHB','ITOT','SCHX','IVV','VV',
]);

function classifyHolding(ticker: string): 'broad' | 'bonds' | 'smallcap' | 'sector' {
  if (BROAD_MARKET_TICKERS.has(ticker)) return 'broad';
  if (BOND_TICKERS.has(ticker)) return 'bonds';
  if (SMALL_CAP_TICKERS.has(ticker)) return 'smallcap';
  return 'sector';
}

function BreakdownBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  if (pct < 0.5) return null;
  return (
    <View style={wtmStyles.breakdownRow}>
      <Text style={wtmStyles.breakdownLabel}>{label}</Text>
      <View style={wtmStyles.breakdownTrack}>
        <View style={[wtmStyles.breakdownFill, { width: `${Math.min(100, Math.round(pct))}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={wtmStyles.breakdownPct}>{pct.toFixed(0)}%</Text>
    </View>
  );
}

export default function WhatThisMeansSection({ result }: { result: OptimizeResponse }) {
  // Classify holdings to compute the breakdown bars
  let broadPct = 0, bondsPct = 0, smallCapPct = 0, sectorPct = 0;
  result.holdings.forEach(h => {
    const cls = classifyHolding(h.ticker);
    const p = h.weight * 100;
    if (cls === 'broad') broadPct += p;
    else if (cls === 'bonds') bondsPct += p;
    else if (cls === 'smallcap') smallCapPct += p;
    else sectorPct += p;
  });

  // Trim grade in case the API ever returns trailing whitespace
  const grade = (result.scores.grade ?? '').trim().toUpperCase();
  const expectedReturn = result.performance.expected_annual_return;
  const annualVol = result.performance.annual_volatility;
  // risk_score_pct is annual_volatility × 100 from the API
  const riskPct = result.scores.risk_score_pct;

  // ── Diagnostic — remove once confirmed stable ────────────────────────────────
  console.log('[WhatThisMeans] incoming values:', {
    grade,
    expectedReturn: (expectedReturn * 100).toFixed(1) + '%',
    riskPct: riskPct.toFixed(1) + '%',
    annualVol: (annualVol * 100).toFixed(1) + '%',
    smartScore: result.scores.smart_score,
    diversification: result.scores.diversification_score,
  });

  // ── Hook — punchy opener, distinct for every grade ──────────────────────────
  const hooks: Record<string, string> = {
    A: 'Your portfolio is firing on all cylinders.',
    B: "You've put together a strong, well-structured portfolio.",
    C: "You've got a solid starting point to build on.",
    D: 'This portfolio has potential, but the setup needs some tuning.',
    F: 'This one needs a rethink before you put real money in.',
  };
  const hookText = hooks[grade] ?? `Grade ${grade || '?'} — check console for incoming values.`;

  // ── Tradeoff — qualitative only; exact numbers are already in the scorecard ─
  const isHighRisk   = riskPct >= 15;
  const isLowRisk    = riskPct <= 8;
  const isHighReturn = expectedReturn >= 0.12;
  const isLowReturn  = expectedReturn <= 0.07;
  let tradeoff: string;
  if (isHighRisk && isHighReturn) {
    tradeoff = "You're swinging for higher returns and accepting a bumpier ride — a smart move if you have a decade or more to let it grow.";
  } else if (isLowRisk && !isHighReturn) {
    tradeoff = "You're keeping things stable, which protects you in downturns but limits how fast your money can grow over time.";
  } else if (isHighRisk && isLowReturn) {
    tradeoff = "You're carrying more risk than the expected returns justify — this mix works harder against you in bad years than it does for you in good ones.";
  } else {
    tradeoff = "You're balancing risk and growth in a way that's worked well for long-term investors — not the fastest path, but a reliable one.";
  }

  // ── Actionable tip — varies by grade AND composition so it always feels fresh ─
  let tip: string;
  if (grade === 'A') {
    // Even A-grade portfolios: vary the tip based on composition
    tip = bondsPct < 10 && riskPct >= 14
      ? 'Consider adding a bond category as your portfolio grows — a small cushion makes drawdowns far easier to hold through.'
      : isHighRisk
      ? 'You\'re in great shape. Keep contributions consistent and avoid reacting to short-term volatility — staying invested is the edge.'
      : 'Stay consistent with your contributions — time in the market is the most powerful move you have from here.';
  } else if (grade === 'B') {
    tip = bondsPct < 10
      ? 'Try adding a bond category to cushion downturns — it barely dents long-term growth but makes bad years far easier to sit through.'
      : 'Increasing your weekly contribution is the single highest-impact move you can make from here.';
  } else if (grade === 'C') {
    tip = 'Try adding 1–2 categories with historically stronger returns, or nudge your risk tolerance up one level to sharpen the results.';
  } else if (grade === 'D') {
    tip = "Head back to Categories and swap in some stronger growth sectors — your current mix isn't rewarding the risk you're taking.";
  } else {
    tip = 'Go back and pick more growth-oriented categories, or raise your risk tolerance a notch — this portfolio currently barely beats a savings account.';
  }

  return (
    <View style={wtmStyles.container}>
      <Text style={wtmStyles.title}>💡 What This Means</Text>

      {/* Grade-aware narrative — hook + tradeoff in 2 sentences */}
      <Text style={wtmStyles.hook}>{hookText}</Text>
      <Text style={wtmStyles.tradeoff}>{tradeoff}</Text>

      {/* Breakdown bars — unique visual info not shown elsewhere in the screen */}
      <Text style={wtmStyles.sectionHead}>Your portfolio breakdown:</Text>
      <BreakdownBar label="🌐 Broad Market" pct={broadPct}    color="#4361EE" />
      <BreakdownBar label="🎯 Sector Funds"  pct={sectorPct}  color="#FB923C" />
      <BreakdownBar label="📦 Small Cap"     pct={smallCapPct} color="#14B8A6" />
      <BreakdownBar label="🏛️ Bonds"         pct={bondsPct}   color="#10B981" />

      {/* One actionable next step */}
      <View style={wtmStyles.tipBox}>
        <Text style={wtmStyles.tipLabel}>💬 Next step</Text>
        <Text style={wtmStyles.tipText}>{tip}</Text>
      </View>

      <Text style={wtmStyles.disclaimer}>
        This is not financial advice. All projections and amounts are estimates only. Past performance does not guarantee future results. Consult a licensed financial advisor before investing.
      </Text>
    </View>
  );
}

const wtmStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  title: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.sm },
  hook: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 23,
    marginBottom: 6,
  },
  tradeoff: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  sectionHead: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabel: { width: 120, fontSize: 12, color: colors.textSecondary },
  breakdownTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  breakdownFill: { height: 6, borderRadius: 3 },
  breakdownPct: { width: 36, fontSize: 12, fontWeight: '700', color: colors.textPrimary, textAlign: 'right' },
  tipBox: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  tipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  tipText: { fontSize: 13, color: colors.textPrimary, lineHeight: 20 },
  disclaimer: { fontSize: 11, color: colors.textMuted, lineHeight: 16, marginTop: spacing.sm },
});

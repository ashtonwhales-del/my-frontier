import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import AdBanner from '../components/ads/SmartBanner';
import LoadingAd from '../components/LoadingAd';
import LoadingCalculation from '../components/LoadingCalculation';
import NativeAdCard from '../components/ads/NativeAdCard';
import RewardedFeature from '../components/ads/RewardedFeature';
import PortfolioScoreCard, { calcFrontierScore } from '../components/PortfolioScoreCard';
import ScoreCard from '../components/results/ScoreCard';
import HoldingCard from '../components/results/ETFBreakdown';
import WhatThisMeansSection from '../components/results/WhatThisMeans';
import ProjectionsSection from '../components/results/ProjectionsSection';
import RiskSwitcher from '../components/results/RiskSwitcher';
import ShareCard from '../components/results/ShareCard';
import HistoricalChart from '../components/results/HistoricalChart';
import ETFDetailModal from '../components/results/ETFDetailModal';
import { buildShareText, generatePortfolioHTML } from '../components/results/pdfExport';

import { STORAGE, PREMIUM_TRIGGER_COUNT } from '../constants';
import { RootStackParamList, OptimizeResponse, SavedPortfolio, OnboardingData, HoldingResult } from '../types';
import { optimizePortfolio } from '../api';
import { colors, spacing, radius } from '../theme';
import { checkAndAwardBadges } from '../services/badgeService';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Results'>;
  route: RouteProp<RootStackParamList, 'Results'>;
};

async function savePortfolioToStorage(data: OnboardingData, result: OptimizeResponse): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE.SAVED_PORTFOLIOS);
    const existing: SavedPortfolio[] = raw ? JSON.parse(raw) : [];
    // Auto-increment duplicate names: "Moderate Portfolio", "Moderate Portfolio #2", etc.
    let baseName = `${result.profile.risk_label} Portfolio`;
    const existingNames = existing.map(p => p.name);
    let finalName = baseName;
    let counter = 1;
    while (existingNames.includes(finalName)) {
      counter++;
      finalName = `${baseName} #${counter}`;
    }
    const newEntry: SavedPortfolio = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: finalName,
      createdAt: Date.now(),
      data,
      result,
    };
    const updated = [newEntry, ...existing].slice(0, 20);
    await AsyncStorage.setItem(STORAGE.SAVED_PORTFOLIOS, JSON.stringify(updated));
    const countRaw = await AsyncStorage.getItem(STORAGE.PORTFOLIO_RUN_COUNT);
    const count = countRaw ? parseInt(countRaw, 10) : 0;
    await AsyncStorage.setItem(STORAGE.PORTFOLIO_RUN_COUNT, String(count + 1));
    const firstTs = await AsyncStorage.getItem(STORAGE.FIRST_PORTFOLIO_TIMESTAMP);
    if (!firstTs) await AsyncStorage.setItem(STORAGE.FIRST_PORTFOLIO_TIMESTAMP, String(Date.now()));
    return count + 1;
  } catch { return 0; }
}

export default function ResultsScreen({ navigation, route }: Props) {
  const { data } = route.params;
  const [result, setResult] = useState<OptimizeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingAdVisible, setLoadingAdVisible] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<number>(data.riskTolerance);
  const [riskSwitching, setRiskSwitching] = useState(false);
  const [detailHolding, setDetailHolding] = useState<HoldingResult | null>(null);

  async function handleRiskChange(newRisk: number) {
    if (newRisk === selectedRisk || riskSwitching) return;
    setSelectedRisk(newRisk);
    setRiskSwitching(true);
    try {
      const res = await optimizePortfolio({ ...data, riskTolerance: newRisk });
      setResult(res);
    } catch (e: any) {
      setError(e.message ?? 'Recalculation failed');
    } finally { setRiskSwitching(false); }
  }

  useEffect(() => {
    optimizePortfolio(data)
      .then(async res => {
        setResult(res);
        const newCount = await savePortfolioToStorage(data, res);
        // Award badges based on portfolio results
        await checkAndAwardBadges({
          portfolioCount: newCount,
          grade: res.scores.grade,
          smartScore: res.scores.smart_score,
          divScore: res.scores.diversification_score,
          expectedReturn: res.performance.expected_annual_return,
          volatility: res.performance.annual_volatility,
          sharpe: res.performance.sharpe_ratio,
          categoriesCount: res.profile.categories.length,
        });
        if (newCount >= PREMIUM_TRIGGER_COUNT) {
          setTimeout(() => navigation.navigate('Premium'), 1200);
        }
      })
      .catch(e => setError(e.message ?? 'Optimization failed'))
      .finally(() => { setLoading(false); setLoadingAdVisible(false); });
  }, []);

  async function handleExport() {
    if (!result) return;
    setExporting(true);
    try {
      const score = calcFrontierScore(result);
      const html = generatePortfolioHTML(result, score);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share My Frontier Portfolio' });
      } else {
        Alert.alert('Export saved', `PDF saved to: ${uri}`);
      }
    } catch (e: any) {
      Alert.alert('Export failed', e.message ?? 'Could not generate PDF.');
    } finally { setExporting(false); }
  }

  if (loading) {
    return (
      <>
        <LoadingCalculation />
        <LoadingAd visible={loadingAdVisible} onClose={() => setLoadingAdVisible(false)} />
      </>
    );
  }

  if (error || !result) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMsg}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screenWrapper}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => navigation.popToTop()} style={styles.backBtn}>
            <Text style={styles.backText}>✕ Start Over</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport} disabled={exporting} activeOpacity={0.75}>
            <Text style={styles.exportBtnText}>{exporting ? '…' : '↓ PDF'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.greeting}>{result.profile.name}'s Portfolio</Text>
        <View style={styles.subheadingRow}>
          <Text style={styles.subheading}>
            {result.profile.risk_label} · {result.profile.categories.length} sector{result.profile.categories.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <PortfolioScoreCard result={result} />
        <ScoreCard result={result} />
        <RiskSwitcher selected={selectedRisk} onSelect={handleRiskChange} switching={riskSwitching} />

        <Text style={styles.sectionTitle}>📊 Your ETF Allocation</Text>
        <Text style={styles.sectionHint}>Tap any card to expand · long-press for detail</Text>
        {result.holdings.map((h, idx) => (
          <React.Fragment key={h.ticker}>
            <TouchableOpacity onLongPress={() => setDetailHolding(h)} activeOpacity={1}>
              <HoldingCard holding={h} lumpSum={result.profile.lump_sum} />
            </TouchableOpacity>
            {idx === 2 && <NativeAdCard />}
          </React.Fragment>
        ))}

        <WhatThisMeansSection result={result} />
        <AdBanner placement="banner" style={{ marginVertical: spacing.sm }} />
        <RewardedFeature holdings={result.holdings} />
        <ProjectionsSection projections={result.projections} profile={result.profile} performance={result.performance} />
        <HistoricalChart result={result} />

        {/* Share Card */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>📤 Share Your Portfolio</Text>
          <ShareCard result={result} />
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚖️ My Frontier is for educational purposes only. This is not financial advice. All investing involves risk including possible loss of principal. Dollar amounts shown are estimates only. ETF data sourced from Yahoo Finance — verify all information independently.
          </Text>
        </View>

        <TouchableOpacity style={styles.restartBtn} onPress={() => navigation.popToTop()} activeOpacity={0.8}>
          <Text style={styles.restartText}>Start a New Analysis</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.autoInvestBtn} activeOpacity={0.8} onPress={() => { Alert.alert('Saved!', 'Your portfolio has been saved.', [{ text: 'OK', onPress: () => navigation.popToTop() }]); }}>
          <Text style={styles.autoInvestText}>Save and Go Home</Text>
        </TouchableOpacity>

        <AdBanner placement="banner" style={styles.adBanner} />
        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Alex FAB — re-enabled (free on Gemini) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Advisor', { portfolio: result })}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>🤖</Text>
        <Text style={styles.fabLabel}>Ask Alex</Text>
      </TouchableOpacity>

      <View style={styles.persistentFooter}>
        <Text style={styles.persistentFooterText}>Not financial advice. For educational purposes only.</Text>
      </View>


      {/* ETF Detail Modal */}
      <ETFDetailModal holding={detailHolding} lumpSum={result.profile.lump_sum} onClose={() => setDetailHolding(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  centered: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  errorEmoji: { fontSize: 48, marginBottom: spacing.md },
  errorTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  errorMsg: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.lg },
  retryBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: 14, borderRadius: radius.md },
  retryText: { color: '#fff', fontWeight: '700' },
  backBtn: {},
  backText: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  greeting: { fontSize: 30, fontWeight: '900', color: colors.textPrimary, marginBottom: 4 },
  subheadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  subheading: { fontSize: 15, color: colors.textSecondary, flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  sectionHint: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
  sectionWrap: { marginBottom: spacing.lg },
  disclaimer: { backgroundColor: '#FFF9E6', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg, borderLeftWidth: 3, borderLeftColor: colors.warning },
  disclaimerText: { fontSize: 12, color: '#92400E', lineHeight: 18 },
  restartBtn: { borderWidth: 2, borderColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginBottom: spacing.md },
  restartText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  autoInvestBtn: { borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, paddingVertical: 13, alignItems: 'center', marginBottom: spacing.lg },
  autoInvestText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  adBanner: { marginBottom: spacing.sm },
  pageHeader: { paddingTop: 56, paddingBottom: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exportBtn: { borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5 },
  exportBtnText: { fontSize: 13, color: colors.primary, fontWeight: '700' },
  fab: {
    position: 'absolute', bottom: 72, right: spacing.lg, backgroundColor: '#7209B7',
    borderRadius: radius.xl, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs, elevation: 8,
    shadowColor: '#7209B7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8,
  },
  fabText: { fontSize: 20 },
  fabLabel: { color: '#fff', fontSize: 14, fontWeight: '700' },
  persistentFooter: { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 8, paddingHorizontal: spacing.lg, alignItems: 'center' },
  persistentFooterText: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
});

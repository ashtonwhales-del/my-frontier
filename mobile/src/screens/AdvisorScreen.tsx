/**
 * AdvisorScreen.tsx — Curated Q&A with Alex
 * No API calls. All answers hardcoded locally. Instant, free, never fails.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, OptimizeResponse } from '../types';
import { colors, spacing, radius } from '../theme';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Advisor'>;
  route: RouteProp<RootStackParamList, 'Advisor'>;
};

interface QA { q: string; a: string; cat: string }

const CATEGORIES = ['My Portfolio', 'Investing Basics', 'The Math', 'Planning', 'About My Frontier'] as const;

const QA_DATA: QA[] = [
  { cat: 'My Portfolio', q: 'What does my Frontier Score mean?', a: 'Your Frontier Score measures how efficiently your portfolio converts risk into return on a scale of 0-10. Higher is better. It uses the Sharpe ratio. A score above 7.5 means excellent risk-adjusted performance.' },
  { cat: 'My Portfolio', q: 'How can I improve my portfolio?', a: 'Add more uncorrelated assets like bonds and international ETFs. Reduce concentration by ensuring no single ETF holds more than 15%. More sectors means a better diversification score.' },
  { cat: 'My Portfolio', q: 'Why is my risk score this high?', a: 'Risk score shows expected annual volatility. Higher risk often comes with higher expected returns. To reduce it, add bonds (AGG, BND) or dividend ETFs which tend to be more stable.' },
  { cat: 'My Portfolio', q: 'What does my diversification score mean?', a: 'Diversification score (0-10) measures how uncorrelated your ETFs are. Above 7 means genuinely well-spread holdings. Low correlation means when one ETF drops, others hold steady or rise.' },
  { cat: 'My Portfolio', q: 'What is my expected return based on?', a: 'Expected return is based on historical performance of each ETF, annualized and weighted by your allocation. Past performance helps estimate trends but never guarantees future results.' },
  { cat: 'My Portfolio', q: 'How were my ETFs chosen?', a: 'The Efficient Frontier algorithm selects ETF weights that maximize the Sharpe ratio, giving you the best possible return for your chosen risk level. Core holdings like VTI, SPY, QQQ always form the foundation.' },
  { cat: 'Investing Basics', q: 'What is an ETF?', a: 'An ETF (Exchange-Traded Fund) is a basket of stocks or bonds that trades like a single stock. Instead of buying Apple individually, QQQ gives you the top 100 tech companies at once with instant diversification.' },
  { cat: 'Investing Basics', q: 'What is diversification?', a: 'Diversification means spreading investments across different assets so they do not all move together. It is the only "free lunch" in investing, reducing risk without reducing expected return.' },
  { cat: 'Investing Basics', q: 'What is the Sharpe ratio?', a: 'The Sharpe ratio measures return per unit of risk. A ratio of 1.0 means you earn 1% extra return for each 1% of volatility. Higher is always better as it shows the quality of your returns.' },
  { cat: 'Investing Basics', q: 'Why do expense ratios matter?', a: 'Expense ratios are annual fees charged by ETFs. A 0.5% difference costs tens of thousands over 30 years due to compounding. My Frontier prioritizes low-cost ETFs in every portfolio.' },
  { cat: 'Investing Basics', q: 'What is dollar cost averaging?', a: 'Investing the same amount regularly regardless of price. When prices drop you buy more shares, when prices rise you buy fewer. Over time this removes the risk of bad timing.' },
  { cat: 'Investing Basics', q: 'Should I invest during a crash?', a: 'Historically, yes. Every crash in history has recovered. Investors who kept buying during 2008 and 2020 saw massive gains in the years that followed. Time in the market beats timing.' },
  { cat: 'The Math', q: 'What is the Efficient Frontier?', a: 'A Nobel Prize-winning concept showing every portfolio that maximizes return for each level of risk. Your portfolio is optimized to sit on or near this curve for maximum efficiency.' },
  { cat: 'The Math', q: 'How does compound interest work?', a: 'Your returns earn returns. $100 at 8% becomes $1,006 in 30 years, not $340. The longer you invest, the more powerful compounding becomes. Starting early is the single biggest advantage.' },
  { cat: 'The Math', q: 'What is Modern Portfolio Theory?', a: 'Created by Harry Markowitz in 1952 (Nobel Prize 1990). The key insight: combining uncorrelated assets reduces portfolio risk below the risk of any individual asset. This is the math behind My Frontier.' },
  { cat: 'The Math', q: 'How is the Frontier Score calculated?', a: 'Frontier Score = 10 x (1 - e^(-1.8 x Sharpe)). This maps the Sharpe ratio to a 0-10 scale where 7.5+ requires genuinely excellent risk-adjusted returns with a Sharpe above 0.93.' },
  { cat: 'The Math', q: 'What does correlation mean?', a: 'Correlation (-1 to +1) measures how much two assets move together. Low correlation (below 0.5) between your ETFs means better diversification, the mathematical key to the Efficient Frontier.' },
  { cat: 'Planning', q: 'How much should I invest per week?', a: '20% of take-home pay is a solid starting point. Use the Budget tab to find your actual surplus. Even $25/week grows to over $100,000 in 30 years at 7% average return.' },
  { cat: 'Planning', q: 'Should I pay off debt or invest?', a: 'High interest debt (above 7% APR): pay it off first. The guaranteed return from eliminating that interest beats most investments. Low interest debt: invest simultaneously.' },
  { cat: 'Planning', q: 'What is the 4% retirement rule?', a: 'Withdraw 4% of your portfolio annually in retirement with very low risk of running out. A $1 million portfolio equals $40,000 per year. Work backwards from your target income to set your goal.' },
  { cat: 'About My Frontier', q: 'How does My Frontier work?', a: 'Select sectors, set your weekly contribution, and the Efficient Frontier algorithm optimizes ETF weights to maximize your Sharpe ratio. Same math used by institutional investors, free for everyone.' },
  { cat: 'About My Frontier', q: 'Is this financial advice?', a: 'No. My Frontier is an educational tool only. It uses real math and real data, but you should always consult a licensed financial advisor before making investment decisions with real money.' },
  { cat: 'About My Frontier', q: 'How often should I rebuild?', a: 'Every 90 days or after major life changes like a new job, marriage, or inheritance. Market conditions shift and reoptimizing keeps your portfolio aligned with current data.' },
];

function gradeColor(g: string) { return g === 'A' ? '#10B981' : g === 'B' ? '#3B82F6' : g === 'C' ? '#F59E0B' : '#EF4444'; }

export default function AdvisorScreen({ navigation, route }: Props) {
  const { portfolio } = route.params;
  const [activeCat, setActiveCat] = useState<string>(CATEGORIES[0]);
  const [selectedQA, setSelectedQA] = useState<QA | null>(null);
  const filtered = QA_DATA.filter(qa => qa.cat === activeCat);

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={s.title}>Ask Alex</Text>
        <Text style={{ fontSize: 24 }}>🤖</Text>
      </View>

      {portfolio && (
        <View style={s.portfolioCard}>
          <Text style={[s.grade, { color: gradeColor(portfolio.scores.grade) }]}>{portfolio.scores.grade}</Text>
          <View>
            <Text style={s.portfolioStat}>{(portfolio.performance.expected_annual_return * 100).toFixed(1)}% return</Text>
            <Text style={s.portfolioStat}>{(portfolio.performance.annual_volatility * 100).toFixed(1)}% risk</Text>
          </View>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll} contentContainerStyle={s.catRow}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat} style={[s.catChip, activeCat === cat && s.catChipActive]} onPress={() => { setActiveCat(cat); setSelectedQA(null); }}>
            <Text style={[s.catText, activeCat === cat && s.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={s.body} contentContainerStyle={s.bodyContent} showsVerticalScrollIndicator={false}>
        {selectedQA ? (
          <View style={s.answerCard}>
            <View style={s.alexRow}><View style={s.alexCircle}><Text style={{ fontSize: 20 }}>🤖</Text></View><Text style={s.alexName}>Alex</Text></View>
            <Text style={s.questionText}>{selectedQA.q}</Text>
            <Text style={s.answerText}>{selectedQA.a}</Text>
            <Text style={s.disclaimer}>For education only, not financial advice.</Text>
            <TouchableOpacity style={s.anotherBtn} onPress={() => setSelectedQA(null)}><Text style={s.anotherText}>Ask another question</Text></TouchableOpacity>
          </View>
        ) : (
          filtered.map((qa, i) => (
            <TouchableOpacity key={i} style={s.qCard} onPress={() => setSelectedQA(qa)} activeOpacity={0.8}>
              <Text style={s.qText}>{qa.q}</Text>
              <Text style={s.qArrow}>→</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  portfolioCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, margin: spacing.lg, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  grade: { fontSize: 36, fontWeight: '900' }, portfolioStat: { fontSize: 13, color: colors.textSecondary },
  catScroll: { maxHeight: 48, borderBottomWidth: 1, borderBottomColor: colors.border },
  catRow: { paddingHorizontal: spacing.lg, gap: spacing.sm, alignItems: 'center' },
  catChip: { backgroundColor: colors.card, borderRadius: radius.full, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: colors.border },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary }, catTextActive: { color: '#fff' },
  body: { flex: 1 }, bodyContent: { padding: spacing.lg, gap: spacing.sm },
  qCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  qText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.textPrimary }, qArrow: { fontSize: 18, color: colors.textMuted, marginLeft: 8 },
  answerCard: { backgroundColor: colors.card, borderRadius: radius.lg, borderLeftWidth: 4, borderLeftColor: colors.primary, padding: spacing.lg },
  alexRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  alexCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  alexName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  questionText: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  answerText: { fontSize: 15, color: colors.textSecondary, lineHeight: 24, marginBottom: spacing.md },
  disclaimer: { fontSize: 11, color: colors.textMuted, marginBottom: spacing.md },
  anotherBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center' },
  anotherText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

/**
 * LessonReaderScreen.tsx — Book-style lesson reader
 * Shows one page at a time with prev/next navigation and progress bar.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import Svg, { Polyline, Line, Text as SvgText, Rect } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { STORAGE } from '../constants';
import { Colors } from '../theme/colors';
import { Spacing, Radius } from '../theme/spacing';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'LessonReader'>;
  route: RouteProp<RootStackParamList, 'LessonReader'>;
};

const VIS: Record<string, string[]> = {
  what_is_etf: ['🍕', '📦', '🏪', '💼', '💰'],
  risk_tolerance: ['🎢', '🎠', '⚖️', '🛡️', '🎯'],
  diversification: ['🚢', '🌐', '🔀', '📊', '✅'],
  efficient_frontier: ['📈', '🏆', '🧮', '⭐', '🎓'],
  compound_interest: ['🌱', '🌳', '💎', '⏰', '🚀'],
  brokerage_account: ['🏦', '📝', '💳', '🤝', '✅'],
  read_etf: ['🔍', '📋', '💹', '🎯', '✅'],
  international: ['🌍', '🗺️', '💱', '📊', '🌐'],
  mvo_deep_dive: ['🧮', '📐', '⚖️', '🏆', '🎯'],
  survive_crash: ['📉', '😤', '💪', '🛒', '🏆'],
  financial_goals: ['🎯', '🏠', '💒', '🎓', '💰'],
  tax_efficient: ['💸', '🏦', '📊', '🌿', '✅'],
};

const CW = Dimensions.get('window').width - 80; // chart width
const CH = 140;

function CompoundChart() {
  const pts = Array.from({ length: 31 }, (_, i) => {
    const x = 10 + (i / 30) * (CW - 20);
    const compound = 10000 * Math.pow(1.08, i);
    const simple = 10000 + 800 * i;
    return { x, yc: CH - 10 - (compound / 110000) * (CH - 20), ys: CH - 10 - (simple / 110000) * (CH - 20) };
  });
  return (
    <View style={cs.chartWrap}>
      <Svg width={CW} height={CH}>
        <Line x1={10} y1={CH - 10} x2={CW - 10} y2={CH - 10} stroke="#1E2D4A" strokeWidth={1} />
        <Line x1={10} y1={10} x2={10} y2={CH - 10} stroke="#1E2D4A" strokeWidth={1} />
        <Polyline points={pts.map(p => `${p.x},${p.ys}`).join(' ')} fill="none" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="4,4" />
        <Polyline points={pts.map(p => `${p.x},${p.yc}`).join(' ')} fill="none" stroke="#3B82F6" strokeWidth={2.5} />
        <SvgText x={CW - 10} y={pts[30].yc - 6} fontSize={10} fill="#3B82F6" textAnchor="end">$100K</SvgText>
        <SvgText x={CW - 10} y={pts[30].ys - 6} fontSize={10} fill="#94A3B8" textAnchor="end">$34K</SvgText>
        <SvgText x={CW / 2} y={CH - 1} fontSize={9} fill="#475569" textAnchor="middle">Years (0-30)</SvgText>
      </Svg>
      <View style={cs.legend}><View style={[cs.dot, { backgroundColor: '#3B82F6' }]} /><Text style={cs.lt}>Compound</Text><View style={[cs.dot, { backgroundColor: '#94A3B8' }]} /><Text style={cs.lt}>Simple</Text></View>
    </View>
  );
}

function FeeChart() {
  return (
    <View style={cs.chartWrap}>
      <Svg width={CW} height={CH}>
        <Rect x={CW * 0.15} y={20} width={CW * 0.25} height={CH - 40} rx={8} fill="#F59E0B" />
        <Rect x={CW * 0.55} y={50} width={CW * 0.25} height={CH - 70} rx={8} fill="#EF4444" />
        <SvgText x={CW * 0.275} y={16} fontSize={11} fill="#F59E0B" textAnchor="middle" fontWeight="700">$100,627</SvgText>
        <SvgText x={CW * 0.675} y={46} fontSize={11} fill="#EF4444" textAnchor="middle" fontWeight="700">$76,122</SvgText>
        <SvgText x={CW * 0.275} y={CH - 6} fontSize={9} fill="#94A3B8" textAnchor="middle">0.03% fee</SvgText>
        <SvgText x={CW * 0.675} y={CH - 6} fontSize={9} fill="#94A3B8" textAnchor="middle">1.0% fee</SvgText>
      </Svg>
    </View>
  );
}

function FrontierChart() {
  const pts = Array.from({ length: 20 }, (_, i) => {
    const t = i / 19;
    const risk = 5 + t * 25;
    const ret = 3 + Math.sqrt(t) * 12;
    return { x: 20 + (risk / 30) * (CW - 40), y: CH - 15 - (ret / 16) * (CH - 30) };
  });
  return (
    <View style={cs.chartWrap}>
      <Svg width={CW} height={CH}>
        <Line x1={20} y1={CH - 15} x2={CW - 10} y2={CH - 15} stroke="#1E2D4A" strokeWidth={1} />
        <Line x1={20} y1={10} x2={20} y2={CH - 15} stroke="#1E2D4A" strokeWidth={1} />
        <Polyline points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#10B981" strokeWidth={2.5} />
        <SvgText x={CW / 2} y={CH - 2} fontSize={9} fill="#475569" textAnchor="middle">Risk (%)</SvgText>
        <SvgText x={14} y={CH / 2} fontSize={9} fill="#475569" textAnchor="middle" rotation="-90" origin={`14,${CH / 2}`}>Return</SvgText>
        <SvgText x={pts[15].x + 8} y={pts[15].y - 8} fontSize={10} fill="#10B981">Efficient Frontier</SvgText>
      </Svg>
    </View>
  );
}

function CorrelationChart() {
  const pts = Array.from({ length: 25 }, (_, i) => {
    const t = i / 24;
    const x = 10 + t * (CW - 20);
    const a = CH / 2 + Math.sin(t * Math.PI * 2) * 40;
    const b = CH / 2 - Math.sin(t * Math.PI * 2) * 35;
    return { x, a, b };
  });
  return (
    <View style={cs.chartWrap}>
      <Svg width={CW} height={CH}>
        <Polyline points={pts.map(p => `${p.x},${p.a}`).join(' ')} fill="none" stroke="#3B82F6" strokeWidth={2} />
        <Polyline points={pts.map(p => `${p.x},${p.b}`).join(' ')} fill="none" stroke="#EF4444" strokeWidth={2} />
      </Svg>
      <View style={cs.legend}><View style={[cs.dot, { backgroundColor: '#3B82F6' }]} /><Text style={cs.lt}>Asset A</Text><View style={[cs.dot, { backgroundColor: '#EF4444' }]} /><Text style={cs.lt}>Asset B</Text></View>
    </View>
  );
}

const PAGE_CHARTS: Record<string, Record<number, () => React.ReactElement>> = {
  compound_interest: { 0: CompoundChart, 2: CompoundChart },
  what_is_etf: { 2: FeeChart },
  efficient_frontier: { 0: FrontierChart },
  diversification: { 1: CorrelationChart },
};

export default function LessonReaderScreen({ route, navigation }: Props) {
  const { lessonId, title, pages, tier } = route.params;
  const [page, setPage] = useState(0);
  const total = pages.length;

  const handleComplete = async () => {
    const raw = await AsyncStorage.getItem(STORAGE.LESSONS_COMPLETE);
    const done: string[] = raw ? JSON.parse(raw) : [];
    if (!done.includes(lessonId)) {
      done.push(lessonId);
      await AsyncStorage.setItem(STORAGE.LESSONS_COMPLETE, JSON.stringify(done));
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>Back</Text>
        </TouchableOpacity>
        <Text style={s.title} numberOfLines={1}>{title}</Text>
        <Text style={s.pageNum}>Page {page + 1}/{total}</Text>
      </View>
      <View style={s.track}><View style={[s.fill, { width: `${((page + 1) / total) * 100}%` }]} /></View>
      <ScrollView style={s.body} contentContainerStyle={s.bodyPad} showsVerticalScrollIndicator={false}>
        <View style={s.contentCard}>
          {PAGE_CHARTS[lessonId]?.[page] ? (
            PAGE_CHARTS[lessonId][page]()
          ) : (
            <View style={s.emojiWrap}>
              <Text style={s.pageEmoji}>{(VIS[lessonId] || ['📚','💡','🎯','⭐','✅'])[Math.min(page, 4)]}</Text>
            </View>
          )}
          {(() => { const m = pages[page]?.match(/\$[\d,]{4,}(?:\.\d+)?|\b[1-9]\d+\.?\d*%/); return m ? <View style={s.keyStatBox}><Text style={s.keyStatNum}>{m[0]}</Text></View> : null; })()}
          <Text style={s.pageText}>{pages[page]}</Text>
          {(() => {
            const sentences = (pages[page] ?? '').split(/[.!?]/).filter(s => s.trim().length > 20);
            const key = sentences.find(s => /means|shows|because|important|key|critical/i.test(s));
            return key ? <View style={s.insightBox}><Text style={s.insightLabel}>Key Insight</Text><Text style={s.insightText}>{key.trim()}.</Text></View> : null;
          })()}
        </View>
      </ScrollView>
      <View style={s.nav}>
        <TouchableOpacity style={[s.btn, page === 0 && s.btnDim]} onPress={() => page > 0 && setPage(p => p - 1)}>
          <Text style={s.btnText}>Prev</Text>
        </TouchableOpacity>
        <View style={s.dots}>
          {pages.map((_, i) => <View key={i} style={[s.dot, i === page && s.dotActive]} />)}
        </View>
        {page < total - 1 ? (
          <TouchableOpacity style={s.btn} onPress={() => setPage(p => p + 1)}>
            <Text style={s.btnText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.btn, s.doneBtn]} onPress={handleComplete}>
            <Text style={s.doneTxt}>Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: 56, paddingBottom: Spacing.sm },
  back: { color: Colors.brandBlue, fontSize: 15, fontWeight: '600' },
  title: { flex: 1, color: Colors.textPrimary, fontSize: 16, fontWeight: '600', textAlign: 'center', marginHorizontal: Spacing.sm },
  pageNum: { color: Colors.textTertiary, fontSize: 12 },
  track: { height: 3, backgroundColor: Colors.borderSubtle, marginHorizontal: Spacing.lg },
  fill: { height: 3, backgroundColor: Colors.brandBlue, borderRadius: 2 },
  body: { flex: 1 },
  bodyPad: { padding: Spacing.lg },
  contentCard: { backgroundColor: '#0D1526', borderRadius: 16, padding: 20, borderLeftWidth: 3, borderLeftColor: '#3B82F6' },
  emojiWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1E2D4A', borderWidth: 2, borderColor: '#3B82F640', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16, marginTop: 8 },
  pageEmoji: { fontSize: 56 },
  keyStatBox: { alignSelf: 'center', backgroundColor: '#1E3A5F', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginBottom: 16, borderWidth: 1, borderColor: '#3B82F6' },
  keyStatNum: { fontSize: 28, fontWeight: '900', color: '#F59E0B', textAlign: 'center' },
  pageText: { color: '#CBD5E1', fontSize: 17, lineHeight: 28, letterSpacing: 0.2 },
  insightBox: { marginTop: 16, backgroundColor: '#1E2D4A', borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: '#F59E0B' },
  insightLabel: { fontSize: 11, fontWeight: '700', color: '#F59E0B', letterSpacing: 0.8, marginBottom: 4 },
  insightText: { fontSize: 14, color: '#94A3B8', lineHeight: 20 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, paddingBottom: 40, backgroundColor: Colors.bgCard, borderTopWidth: 1, borderTopColor: Colors.borderSubtle },
  btn: { backgroundColor: Colors.bgCardElevated, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.md },
  btnDim: { opacity: 0.4 },
  btnText: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1E2D4A' },
  dotActive: { backgroundColor: Colors.brandBlue, width: 20, height: 8, borderRadius: 4 },
  doneBtn: { backgroundColor: Colors.positive },
  doneTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

const cs = StyleSheet.create({
  chartWrap: { backgroundColor: '#0A0F1E', borderRadius: 12, padding: 8, marginBottom: 16, alignSelf: 'center' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 6, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  lt: { fontSize: 11, color: '#94A3B8' },
});

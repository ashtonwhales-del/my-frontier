/**
 * LessonReaderScreen.tsx — Book-style lesson reader
 * Shows one page at a time with prev/next navigation and progress bar.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
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

export default function LessonReaderScreen({ route, navigation }: Props) {
  const { lessonId, title, pages, tier } = route.params;
  const [page, setPage] = useState(0);
  const total = pages.length;

  const handleComplete = async () => {
    const key = 'lessonsComplete';
    const raw = await AsyncStorage.getItem(key);
    const done: string[] = raw ? JSON.parse(raw) : [];
    if (!done.includes(lessonId)) {
      done.push(lessonId);
      await AsyncStorage.setItem(key, JSON.stringify(done));
    }
    navigation.goBack();
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>Back</Text>
        </TouchableOpacity>
        <Text style={s.title} numberOfLines={1}>{title}</Text>
        <Text style={s.pageNum}>Page {page + 1}/{total}</Text>
      </View>
      <View style={s.track}><View style={[s.fill, { width: `${((page + 1) / total) * 100}%` }]} /></View>
      <ScrollView style={s.body} contentContainerStyle={s.bodyPad} showsVerticalScrollIndicator={false}>
        <View style={s.visualWrap}>
          <Text style={s.pageEmoji}>{(VIS[lessonId] || ['📚','💡','🎯','⭐','✅'])[Math.min(page, 4)]}</Text>
        </View>
        {(() => { const m = pages[page]?.match(/\$[\d,]+(?:\.\d+)?|[\d]+\.?\d*%/); return m ? <View style={s.keyStatBox}><Text style={s.keyStatNum}>{m[0]}</Text></View> : null; })()}
        <Text style={s.pageText}>{pages[page]}</Text>
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
    </View>
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
  bodyPad: { padding: Spacing.xl },
  visualWrap: { alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  pageEmoji: { fontSize: 64 },
  keyStatBox: { alignSelf: 'center', backgroundColor: '#1E3A5F', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginBottom: 16, borderWidth: 1, borderColor: '#3B82F6' },
  keyStatNum: { fontSize: 28, fontWeight: '900', color: '#F59E0B', textAlign: 'center' },
  pageText: { color: Colors.textSecondary, fontSize: 17, lineHeight: 28 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, paddingBottom: 40, backgroundColor: Colors.bgCard, borderTopWidth: 1, borderTopColor: Colors.borderSubtle },
  btn: { backgroundColor: Colors.bgCardElevated, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.md },
  btnDim: { opacity: 0.4 },
  btnText: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.borderSubtle },
  dotActive: { backgroundColor: Colors.brandBlue, width: 16 },
  doneBtn: { backgroundColor: Colors.positive },
  doneTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

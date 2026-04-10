/**
 * CommunityScreen.tsx — Feed + Chat tabs
 * Feed: mock portfolio posts with likes. Chat: local messages with mock starters.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Share, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius, shadow } from '../theme';

function gc(g: string) { return g === 'A' ? '#10B981' : g === 'B' ? '#3B82F6' : g === 'C' ? '#F59E0B' : '#EF4444'; }

const MOCK_POSTS = [
  { id: '1', user: 'FrontierExplorer42', grade: 'A', ret: '12.3', risk: '14.1', likes: 24, time: '2h ago' },
  { id: '2', user: 'WealthBuilder99', grade: 'B', ret: '9.8', risk: '11.2', likes: 18, time: '4h ago' },
  { id: '3', user: 'DiversifyQueen', grade: 'A', ret: '11.1', risk: '12.8', likes: 31, time: '6h ago' },
  { id: '4', user: 'IndexFundFan', grade: 'B', ret: '8.5', risk: '9.4', likes: 12, time: '1d ago' },
  { id: '5', user: 'RiskTaker2026', grade: 'C', ret: '15.2', risk: '22.1', likes: 9, time: '1d ago' },
  { id: '6', user: 'SteadyGrowth', grade: 'B', ret: '10.0', risk: '12.0', likes: 15, time: '2d ago' },
  { id: '7', user: 'ETFNovice', grade: 'C', ret: '7.8', risk: '10.5', likes: 6, time: '3d ago' },
  { id: '8', user: 'RetirementReady', grade: 'A', ret: '11.5', risk: '11.9', likes: 42, time: '3d ago' },
];

interface ChatMsg { user: string; text: string; isMe: boolean }

const STARTER_MSGS: ChatMsg[] = [
  { user: 'FrontierExplorer42', text: 'Anyone building aggressive growth right now?', isMe: false },
  { user: 'WealthBuilder99', text: 'Just got a B grade! 12% expected return', isMe: false },
  { user: 'DiversifyQueen', text: 'Adding international ETFs boosted my diversification score', isMe: false },
  { user: 'IndexFundFan', text: 'The stress test is wild. 31% drop in 2008 scenario', isMe: false },
  { user: 'SteadyBuilder', text: 'Should I include bonds if I am 25?', isMe: false },
];

export default function CommunityScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<'feed' | 'chat'>('feed');
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [myName, setMyName] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    AsyncStorage.getItem('communityChat').then(raw => {
      setMsgs(raw ? JSON.parse(raw) : STARTER_MSGS);
    });
    AsyncStorage.getItem('communityUsername').then(name => {
      if (name) { setMyName(name); return; }
      const gen = 'Investor' + Math.floor(1000 + Math.random() * 9000);
      setMyName(gen);
      AsyncStorage.setItem('communityUsername', gen);
    });
  }, []);

  function handleShare() {
    Share.share({ message: 'I build my investment portfolio with My Frontier. Free app, real math. myfrontierapp.com' });
  }

  async function handleSharePortfolio() {
    const raw = await AsyncStorage.getItem('savedPortfolios');
    const portfolios = raw ? JSON.parse(raw) : [];
    if (!portfolios.length) { Alert.alert('No Portfolios', 'Build a portfolio first to share it.'); return; }
    const buttons = portfolios.slice(0, 5).map((p: any) => ({
      text: `${p.name} (${p.result?.scores?.grade ?? '?'})`,
      onPress: () => {
        const grade = p.result?.scores?.grade ?? '?';
        const ret = ((p.result?.performance?.expected_annual_return ?? 0) * 100).toFixed(1);
        const chatMsg: ChatMsg = { user: myName, text: `Shared: ${p.name} | Grade ${grade} | ${ret}% return`, isMe: true };
        const next = [...msgs, chatMsg];
        setMsgs(next);
        AsyncStorage.setItem('communityChat', JSON.stringify(next));
        Alert.alert('Shared!', `${p.name} posted to feed and chat.`);
      },
    }));
    buttons.push({ text: 'Cancel', onPress: () => {} });
    Alert.alert('Share a Portfolio', 'Pick one to share:', buttons as any);
  }

  function sendMsg() {
    if (!input.trim()) return;
    const next = [...msgs, { user: myName, text: input.trim(), isMe: true }];
    setMsgs(next);
    setInput('');
    AsyncStorage.setItem('communityChat', JSON.stringify(next));
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>Community</Text>
        <TouchableOpacity onPress={handleShare}><Text style={s.shareLink}>Share</Text></TouchableOpacity>
      </View>

      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'feed' && s.tabActive]} onPress={() => setTab('feed')}>
          <Text style={[s.tabText, tab === 'feed' && s.tabTextActive]}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'chat' && s.tabActive]} onPress={() => setTab('chat')}>
          <Text style={[s.tabText, tab === 'chat' && s.tabTextActive]}>Chat</Text>
        </TouchableOpacity>
      </View>

      {tab === 'feed' ? (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={s.shareCard} onPress={handleSharePortfolio} activeOpacity={0.8}>
            <Text style={s.shareCardTitle}>Share My Portfolio</Text>
            <Text style={s.shareCardSub}>Post your portfolio to the community feed</Text>
          </TouchableOpacity>
          {MOCK_POSTS.map(p => (
            <View key={p.id} style={s.postCard}>
              <View style={s.postTop}><Text style={s.postUser}>{p.user}</Text><Text style={s.postTime}>{p.time}</Text></View>
              <View style={s.postBody}>
                <Text style={[s.postGrade, { color: gc(p.grade) }]}>{p.grade}</Text>
                <View><Text style={s.postStat}>{p.ret}% return</Text><Text style={s.postStat}>{p.risk}% risk</Text></View>
              </View>
              <TouchableOpacity onPress={() => setLikes(prev => ({ ...prev, [p.id]: (prev[p.id] ?? 0) + 1 }))} style={s.likeRow}>
                <Text style={s.likeText}>❤️ {p.likes + (likes[p.id] ?? 0)}</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={{ height: 80 }} />
        </ScrollView>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
          <ScrollView ref={scrollRef} contentContainerStyle={s.chatScroll} showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
            {msgs.map((m, i) => (
              <View key={i} style={[s.msgRow, m.isMe ? s.msgRowMe : s.msgRowOther]}>
                {!m.isMe && <Text style={s.msgUser}>{m.user}</Text>}
                <View style={[s.msgBubble, m.isMe ? s.bubbleMe : s.bubbleOther]}>
                  <Text style={[s.msgText, m.isMe && { color: '#fff' }]}>{m.text}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={s.inputBar}>
            <TextInput style={s.chatInput} value={input} onChangeText={setInput} placeholder="Say something..." placeholderTextColor={colors.textMuted} returnKeyType="send" onSubmitEditing={sendMsg} />
            <TouchableOpacity onPress={sendMsg} style={s.sendBtn}><Text style={s.sendText}>↑</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 56, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary }, shareLink: { fontSize: 14, fontWeight: '700', color: colors.primary },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 }, tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted }, tabTextActive: { color: colors.primary },
  scroll: { padding: spacing.lg, gap: spacing.md },
  shareCard: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primary, padding: spacing.lg, alignItems: 'center' },
  shareCardTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 }, shareCardSub: { fontSize: 13, color: colors.textSecondary },
  postCard: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  postTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  postUser: { fontSize: 13, fontWeight: '700', color: colors.textSecondary }, postTime: { fontSize: 12, color: colors.textMuted },
  postBody: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.sm },
  postGrade: { fontSize: 36, fontWeight: '900' }, postStat: { fontSize: 13, color: colors.textSecondary },
  likeRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  likeText: { fontSize: 13, color: colors.textSecondary },
  chatScroll: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 20 },
  msgRow: { marginBottom: 4 }, msgRowMe: { alignItems: 'flex-end' }, msgRowOther: { alignItems: 'flex-start' },
  msgUser: { fontSize: 11, color: colors.textMuted, marginBottom: 2, marginLeft: 4 },
  msgBubble: { maxWidth: '80%', borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { backgroundColor: colors.primary }, bubbleOther: { backgroundColor: '#152035' },
  msgText: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  chatInput: { flex: 1, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.textPrimary },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});

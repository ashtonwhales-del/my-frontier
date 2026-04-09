import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, OptimizeResponse, BudgetContext } from '../types';
import { colors, spacing, radius, shadow } from '../theme';
import { STORAGE, FREE_LIMITS } from '../constants';
import { callAdvisor } from '../api';
import { canSendAlexMessage, decrementAlexMessages, isPremium } from '../services/premiumService';
import { showRewardedAd } from '../components/ads/RewardedAd';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Advisor'>;
  route: RouteProp<RootStackParamList, 'Advisor'>;
};

interface ChatMessage { role: 'user' | 'assistant'; content: string; }

const PORTFOLIO_SUGGESTED = [
  'What does my Frontier Score mean?',
  'How can I improve my portfolio?',
  'What is the Efficient Frontier?',
  'Should I be worried about my risk level?',
];

const BUDGET_SUGGESTED = [
  'Am I spending too much on food?',
  'How do I find more money to invest?',
  'What is the 50/30/20 rule?',
  'Should I pay off debt or invest first?',
];

const HISTORY_KEY = (name: string) => `${STORAGE.ADVISOR_HISTORY}_${name}`;

export default function AdvisorScreen({ navigation, route }: Props) {
  const { portfolio, budgetContext } = route.params;
  const SUGGESTED = budgetContext ? BUDGET_SUGGESTED : PORTFOLIO_SUGGESTED;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number>(FREE_LIMITS.alexMessagesPerDay);
  const [premium, setPremium] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const userName = portfolio?.profile?.name ?? 'there';
  const histKey = HISTORY_KEY(userName);

  useEffect(() => {
    (async () => {
      const [prem, { remaining: rem }] = await Promise.all([isPremium(), canSendAlexMessage()]);
      setPremium(prem);
      setRemaining(prem ? 999 : rem);

      const storedHistory = await AsyncStorage.getItem(histKey);
      if (storedHistory) {
        try { setMessages(JSON.parse(storedHistory)); } catch {}
      } else {
        const greetingContent = budgetContext
          ? `Hi ${userName}! I'm Alex. I can see your budget — you have $${budgetContext.surplus.toFixed(0)} left this month as a ${budgetContext.spendingDNA}. That's $${(budgetContext.surplus / 4.33).toFixed(0)}/week you could invest. What would you like to know?`
          : portfolio
            ? `Hi ${userName}! I'm Alex, your personal portfolio guide. I can see your ${portfolio.profile.risk_label} portfolio with a ${portfolio.scores.grade} grade. What would you like to know?`
            : `Hi! I'm Alex, your personal finance guide. How can I help you today?`;
        const greeting: ChatMessage = {
          role: 'assistant',
          content: greetingContent,
        };
        setMessages([greeting]);
        await AsyncStorage.setItem(histKey, JSON.stringify([greeting]));
      }
    })();
  }, []);

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const { allowed, remaining: rem } = await canSendAlexMessage();
    if (!allowed && !premium) { setRemaining(0); return; }

    const userMsg: ChatMessage = { role: 'user', content: msg };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);

    if (!premium) {
      const newRem = await decrementAlexMessages();
      setRemaining(newRem);
    }

    try {
      const reply = await callAdvisor(updatedHistory, portfolio ?? null);
      const alexMsg: ChatMessage = { role: 'assistant', content: reply };
      const finalHistory = [...updatedHistory, alexMsg];
      setMessages(finalHistory);
      await AsyncStorage.setItem(histKey, JSON.stringify(finalHistory));
    } catch (e: any) {
      const detail = e?.message ?? '';
      const content = detail.includes('503')
        ? "Alex isn't available — add GEMINI_API_KEY or ANTHROPIC_API_KEY to the server .env."
        : detail.includes('429')
        ? "You've sent messages too quickly. Please wait a moment and try again."
        : detail.includes('No internet')
        ? "No internet connection. Please check your network."
        : `Sorry, I couldn't respond. ${detail ? `(${detail})` : 'Check the server is running.'}`;
      setMessages([...updatedHistory, { role: 'assistant', content }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  function handleUnlockAd() {
    showRewardedAd(async () => {
      const newRem = remaining + 10;
      setRemaining(newRem);
      await AsyncStorage.setItem(STORAGE.ADVISOR_MSGS_REMAINING, String(newRem));
    });
  }

  const showInput = premium || remaining > 0;
  const limitLabel = premium
    ? 'Unlimited messages'
    : `${remaining} free message${remaining !== 1 ? 's' : ''} today — upgrade for unlimited`;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerAvatar}>🤖</Text>
          <View>
            <Text style={styles.headerTitle}>Alex</Text>
            <Text style={styles.headerSub}>Portfolio Educator · Free on Gemini AI</Text>
          </View>
        </View>
        {!premium && (
          <TouchableOpacity onPress={() => navigation.navigate('Premium')} style={styles.upgradeChip}>
            <Text style={styles.upgradeChipText}>PRO</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      <ScrollView ref={scrollRef} style={styles.messageList} contentContainerStyle={styles.messageListContent} showsVerticalScrollIndicator={false} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
        {messages.map((msg, i) => (
          <View key={i} style={[styles.bubbleRow, msg.role === 'user' ? styles.bubbleRowUser : styles.bubbleRowAlex]}>
            {msg.role === 'assistant' && <View style={styles.avatarCircle}><Text style={styles.avatarEmoji}>🤖</Text></View>}
            <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAlex]}>
              <Text style={[styles.bubbleText, msg.role === 'user' && styles.bubbleTextUser]}>{msg.content}</Text>
            </View>
          </View>
        ))}
        {loading && (
          <View style={[styles.bubbleRow, styles.bubbleRowAlex]}>
            <View style={styles.avatarCircle}><Text style={styles.avatarEmoji}>🤖</Text></View>
            <View style={[styles.bubble, styles.bubbleAlex, styles.bubbleTyping]}>
              <ActivityIndicator size="small" color={colors.textMuted} />
              <Text style={styles.typingText}>Alex is thinking…</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input or unlock */}
      {showInput ? (
        <View style={styles.inputBar}>
          <Text style={styles.limitLabel}>{limitLabel}</Text>
          {/* Suggested questions (only if no conversation yet) */}
          {messages.length <= 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestRow} contentContainerStyle={styles.suggestContent}>
              {SUGGESTED.map(q => (
                <TouchableOpacity key={q} style={styles.suggestChip} onPress={() => handleSend(q)} activeOpacity={0.75}>
                  <Text style={styles.suggestText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Ask Alex anything about your portfolio…"
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={300}
              returnKeyType="send"
              blurOnSubmit
              onSubmitEditing={() => handleSend()}
            />
            <TouchableOpacity style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]} onPress={() => handleSend()} disabled={!input.trim() || loading} activeOpacity={0.8}>
              <Text style={styles.sendBtnText}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.unlockBar}>
          <Text style={styles.unlockTitle}>You've used all 5 free messages today</Text>
          <Text style={styles.unlockSub}>Resets at midnight · or unlock with a video ad</Text>
          <View style={styles.unlockBtns}>
            <TouchableOpacity style={styles.unlockAdBtn} onPress={handleUnlockAd} activeOpacity={0.8}>
              <Text style={styles.unlockAdBtnText}>▶ Watch Ad (+10 messages)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.upgradeBigBtn} onPress={() => navigation.navigate('Premium')} activeOpacity={0.8}>
              <Text style={styles.upgradeBigBtnText}>🚀 Go Premium — Unlimited</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: 56, paddingBottom: spacing.md, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
  backBtn: { padding: spacing.sm },
  backText: { fontSize: 22, color: colors.primary, fontWeight: '700' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerAvatar: { fontSize: 28 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  headerSub: { fontSize: 11, color: colors.textSecondary },
  upgradeChip: { backgroundColor: '#F59E0B', borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  upgradeChipText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  messageList: { flex: 1 },
  messageListContent: { padding: spacing.md, gap: spacing.md },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubbleRowAlex: { justifyContent: 'flex-start' },
  avatarCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarEmoji: { fontSize: 18 },
  bubble: { maxWidth: '75%', borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: 10, ...shadow.sm },
  bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleAlex: { backgroundColor: colors.card, borderBottomLeftRadius: 4 },
  bubbleTyping: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 12 },
  bubbleText: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  bubbleTextUser: { color: '#fff' },
  typingText: { fontSize: 13, color: colors.textMuted },
  inputBar: { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.md, paddingBottom: Platform.OS === 'ios' ? 32 : spacing.md },
  limitLabel: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xs },
  suggestRow: { marginBottom: spacing.sm },
  suggestContent: { gap: spacing.sm, paddingRight: spacing.sm },
  suggestChip: { backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  suggestText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 14, color: colors.textPrimary, maxHeight: 120, backgroundColor: colors.bg },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow.md },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  unlockBar: { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.lg, paddingBottom: Platform.OS === 'ios' ? 40 : spacing.lg, alignItems: 'center', gap: spacing.sm },
  unlockTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  unlockSub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  unlockBtns: { width: '100%', gap: spacing.sm, marginTop: spacing.xs },
  unlockAdBtn: { backgroundColor: '#7209B7', borderRadius: radius.md, paddingVertical: 13, alignItems: 'center', ...shadow.md },
  unlockAdBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  upgradeBigBtn: { backgroundColor: '#F59E0B', borderRadius: radius.md, paddingVertical: 13, alignItems: 'center', ...shadow.md },
  upgradeBigBtnText: { color: '#000', fontSize: 14, fontWeight: '800' },
});

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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, OptimizeResponse } from '../types';
import { colors, spacing, radius, shadow } from '../theme';
import {
  STORAGE,
  ADVISOR_FREE_MESSAGES,
  ADVISOR_AD_UNLOCK_MESSAGES,
} from '../constants';
import { callAdvisor } from '../api';
import { showRewardedAd } from '../components/ads/RewardedAd';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Advisor'>;
  route: RouteProp<RootStackParamList, 'Advisor'>;
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}


const HISTORY_KEY = (portfolioName: string) =>
  `${STORAGE.ADVISOR_HISTORY}_${portfolioName}`;

export default function AdvisorScreen({ navigation, route }: Props) {
  const { portfolio } = route.params;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [msgsRemaining, setMsgsRemaining] = useState(ADVISOR_FREE_MESSAGES);
  const scrollRef = useRef<ScrollView>(null);
  const histKey = HISTORY_KEY(portfolio.profile.name);

  // Load persisted history and message count on mount
  useEffect(() => {
    (async () => {
      const [storedHistory, storedCount] = await Promise.all([
        AsyncStorage.getItem(histKey),
        AsyncStorage.getItem(STORAGE.ADVISOR_MSGS_REMAINING),
      ]);
      if (storedHistory) {
        try { setMessages(JSON.parse(storedHistory)); } catch {}
      } else {
        // Greet the user on first open
        const greeting: ChatMessage = {
          role: 'assistant',
          content: `Hi ${portfolio.profile.name}! I'm Alex, your personal portfolio guide. I can see your ${portfolio.profile.risk_label} portfolio with a ${portfolio.scores.grade} grade. What would you like to know?`,
        };
        setMessages([greeting]);
        await AsyncStorage.setItem(histKey, JSON.stringify([greeting]));
      }
      if (storedCount !== null) setMsgsRemaining(parseInt(storedCount, 10));
    })();
  }, []);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading || msgsRemaining <= 0) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);

    const newCount = msgsRemaining - 1;
    setMsgsRemaining(newCount);
    await AsyncStorage.setItem(STORAGE.ADVISOR_MSGS_REMAINING, String(newCount));

    try {
      const reply = await callAdvisor(updatedHistory, portfolio);
      const alexMsg: ChatMessage = { role: 'assistant', content: reply };
      const finalHistory = [...updatedHistory, alexMsg];
      setMessages(finalHistory);
      await AsyncStorage.setItem(histKey, JSON.stringify(finalHistory));
    } catch (e: any) {
      console.warn('[Alex] error:', e?.message ?? e);
      const detail = e?.message ?? '';
      // Surface the actual error so it's debuggable, but keep language friendly
      const content = detail.includes('503')
        ? "Alex isn't available right now — the AI service isn't configured on the server. Please check that ANTHROPIC_API_KEY is set in the backend .env."
        : detail.includes('429')
        ? "You've sent messages too quickly. Please wait a moment and try again."
        : detail.includes('No internet')
        ? "No internet connection detected. Please check your Wi-Fi or mobile data."
        : `Sorry, I couldn't respond right now. ${detail ? `(${detail})` : 'Please check the server is running and try again.'}`;
      const errMsg: ChatMessage = {
        role: 'assistant',
        content,
      };
      setMessages([...updatedHistory, errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  function handleUnlockAd() {
    showRewardedAd(async () => {
      const newCount = msgsRemaining + ADVISOR_AD_UNLOCK_MESSAGES;
      setMsgsRemaining(newCount);
      await AsyncStorage.setItem(STORAGE.ADVISOR_MSGS_REMAINING, String(newCount));
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerAvatar}>🤖</Text>
          <View>
            <Text style={styles.headerTitle}>Alex</Text>
            <Text style={styles.headerSub}>Portfolio Educator</Text>
          </View>
        </View>
        <View style={styles.msgBadge}>
          <Text style={styles.msgBadgeText}>{msgsRemaining}</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map((msg, i) => (
          <View
            key={i}
            style={[styles.bubbleRow, msg.role === 'user' ? styles.bubbleRowUser : styles.bubbleRowAlex]}
          >
            {msg.role === 'assistant' && (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarEmoji}>🤖</Text>
              </View>
            )}
            <View
              style={[
                styles.bubble,
                msg.role === 'user' ? styles.bubbleUser : styles.bubbleAlex,
              ]}
            >
              <Text style={[styles.bubbleText, msg.role === 'user' && styles.bubbleTextUser]}>
                {msg.content}
              </Text>
            </View>
          </View>
        ))}
        {loading && (
          <View style={[styles.bubbleRow, styles.bubbleRowAlex]}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>🤖</Text>
            </View>
            <View style={[styles.bubble, styles.bubbleAlex, styles.bubbleTyping]}>
              <ActivityIndicator size="small" color={colors.textMuted} />
              <Text style={styles.typingText}>Alex is thinking…</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input area or unlock CTA */}
      {msgsRemaining > 0 ? (
        <View style={styles.inputBar}>
          <Text style={styles.msgCountLabel}>
            {msgsRemaining} message{msgsRemaining !== 1 ? 's' : ''} remaining
          </Text>
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
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || loading}
              activeOpacity={0.8}
            >
              <Text style={styles.sendBtnText}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.unlockBar}>
          <Text style={styles.unlockTitle}>You've used all your free messages</Text>
          <Text style={styles.unlockSub}>Watch a short ad to unlock {ADVISOR_AD_UNLOCK_MESSAGES} more messages</Text>
          <TouchableOpacity style={styles.unlockBtn} onPress={handleUnlockAd} activeOpacity={0.8}>
            <Text style={styles.unlockBtnText}>▶ Watch Ad to Unlock {ADVISOR_AD_UNLOCK_MESSAGES} Messages</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: 56,
    paddingBottom: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.sm },
  backText: { fontSize: 22, color: colors.primary, fontWeight: '700' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerAvatar: { fontSize: 28 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  headerSub: { fontSize: 12, color: colors.textSecondary },
  msgBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  messageList: { flex: 1 },
  messageListContent: { padding: spacing.md, gap: spacing.md },

  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubbleRowAlex: { justifyContent: 'flex-start' },

  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarEmoji: { fontSize: 18 },

  bubble: {
    maxWidth: '75%',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...shadow.sm,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAlex: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 4,
  },
  bubbleTyping: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
  },
  bubbleText: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  bubbleTextUser: { color: '#fff' },
  typingText: { fontSize: 13, color: colors.textMuted },

  inputBar: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 32 : spacing.md,
  },
  msgCountLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    maxHeight: 120,
    backgroundColor: colors.bg,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },

  unlockBar: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  unlockTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  unlockSub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  unlockBtn: {
    backgroundColor: '#7209B7',
    borderRadius: radius.md,
    paddingVertical: 13,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
    ...shadow.md,
  },
  unlockBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

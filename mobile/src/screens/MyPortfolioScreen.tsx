import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types';
import { colors, spacing, radius, shadow } from '../theme';

const STORAGE_KEY = 'myPortfolio:holdings';

interface Holding {
  ticker: string;
  shares: number;
  avgCost: number;
  dateAdded: string;
}

type Nav = StackNavigationProp<RootStackParamList>;

export default function MyPortfolioScreen() {
  const navigation = useNavigation<Nav>();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [ticker, setTicker] = useState('');
  const [sharesStr, setSharesStr] = useState('');
  const [priceStr, setPriceStr] = useState('');

  const loadHoldings = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setHoldings(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadHoldings(); }, [loadHoldings]);

  const persist = async (next: Holding[]) => {
    setHoldings(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const totalValue = holdings.reduce((s, h) => s + h.shares * h.avgCost, 0);

  const handleAdd = () => {
    const t = ticker.trim().toUpperCase();
    const shares = parseFloat(sharesStr);
    const price = parseFloat(priceStr);
    if (!t) { Alert.alert('Missing ticker'); return; }
    if (!shares || shares <= 0) { Alert.alert('Enter valid shares'); return; }
    if (!price || price <= 0) { Alert.alert('Enter valid price'); return; }
    const entry: Holding = { ticker: t, shares, avgCost: price, dateAdded: new Date().toISOString() };
    persist([...holdings, entry]);
    setTicker(''); setSharesStr(''); setPriceStr('');
    setModalVisible(false);
  };

  const handleDelete = (index: number) => {
    Alert.alert('Remove Position', `Delete ${holdings[index].ticker}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => persist(holdings.filter((_, i) => i !== index)) },
    ]);
  };

  const renderHolding = ({ item, index }: { item: Holding; index: number }) => {
    const value = item.shares * item.avgCost;
    return (
      <View style={s.holdingCard}>
        <View style={s.holdingLeft}>
          <Text style={s.tickerText}>{item.ticker}</Text>
          <Text style={s.holdingDetail}>
            {item.shares} shares at ${item.avgCost.toFixed(2)}
          </Text>
        </View>
        <View style={s.holdingRight}>
          <Text style={s.holdingValue}>${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          <Text style={s.holdingChange}>0.00%</Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(index)} style={s.deleteBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={s.deleteX}>X</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={s.empty}>
      <Text style={s.emptyEmoji}>📂</Text>
      <Text style={s.emptyTitle}>Start tracking your real portfolio</Text>
      <Text style={s.emptySub}>Add your first position to see it grow</Text>
      <TouchableOpacity style={s.emptyBtn} onPress={() => setModalVisible(true)}>
        <Text style={s.emptyBtnText}>Add Position</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>My Portfolio</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={s.addBtn}>
          <Text style={s.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Hero card */}
      <View style={s.heroCard}>
        <Text style={s.heroLabel}>PORTFOLIO VALUE</Text>
        <Text style={s.heroValue}>
          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <Text style={[s.heroChange, { color: colors.positive }]}>+$0.00 (+0.00%)</Text>
      </View>

      {/* Holdings list */}
      {holdings.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={holdings}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderHolding}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Position Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Add Position</Text>

            <Text style={s.inputLabel}>Ticker</Text>
            <TextInput
              style={s.input} value={ticker} onChangeText={setTicker}
              placeholder="e.g. AAPL" placeholderTextColor={colors.textTertiary}
              autoCapitalize="characters" autoCorrect={false}
            />

            <Text style={s.inputLabel}>Shares</Text>
            <TextInput
              style={s.input} value={sharesStr} onChangeText={setSharesStr}
              placeholder="0" placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
            />

            <Text style={s.inputLabel}>Purchase Price</Text>
            <TextInput
              style={s.input} value={priceStr} onChangeText={setPriceStr}
              placeholder="0.00" placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
            />

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleAdd}>
                <Text style={s.saveBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary, paddingHorizontal: spacing.md, paddingTop: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  headerTitle: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brandBlue, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontSize: 22, fontWeight: '600', color: '#fff', marginTop: -1 },

  heroCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.brandBlue,
    ...shadow.md,
  },
  heroLabel: { fontSize: 12, fontWeight: '600', color: colors.textTertiary, letterSpacing: 1.2, marginBottom: 4 },
  heroValue: { fontSize: 36, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  heroChange: { fontSize: 14, fontWeight: '600' },

  holdingCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.borderSubtle,
  },
  holdingLeft: { flex: 1 },
  tickerText: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  holdingDetail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  holdingRight: { alignItems: 'flex-end', marginRight: spacing.sm },
  holdingValue: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  holdingChange: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  deleteBtn: { padding: 4 },
  deleteX: { fontSize: 16, fontWeight: '700', color: colors.negative },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.lg },
  emptyBtn: { backgroundColor: colors.brandBlue, paddingHorizontal: 28, paddingVertical: 12, borderRadius: radius.xl },
  emptyBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalCard: { backgroundColor: colors.bgCard, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
  input: {
    backgroundColor: colors.bgPrimary, borderRadius: radius.md, padding: spacing.sm,
    fontSize: 16, color: colors.textPrimary, borderWidth: 1, borderColor: colors.borderSubtle,
    marginBottom: spacing.sm,
  },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.md, gap: 12 },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 10 },
  cancelText: { fontSize: 15, color: colors.textSecondary },
  saveBtn: { backgroundColor: colors.brandBlue, paddingHorizontal: 24, paddingVertical: 10, borderRadius: radius.md },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});

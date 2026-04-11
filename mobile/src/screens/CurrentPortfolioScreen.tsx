import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  Platform,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, shadow } from '../theme';

const STORAGE_KEY = 'myHoldings';

interface Holding {
  ticker: string;
  shares: number;
  avgCost: number;
  dateAdded: string;
}

const formatCurrency = (value: number): string =>
  '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const todayString = (): string => {
  const d = new Date();
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export default function CurrentPortfolioScreen() {
  const navigation = useNavigation<any>();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [tickerInput, setTickerInput] = useState('');
  const [sharesInput, setSharesInput] = useState('');
  const [priceInput, setPriceInput] = useState('');

  useEffect(() => {
    loadHoldings();
  }, []);

  const loadHoldings = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setHoldings(JSON.parse(raw) as Holding[]);
    } catch {
      // silent
    }
  };

  const persist = async (next: Holding[]) => {
    setHoldings(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const totalValue = holdings.reduce((sum, h) => sum + h.shares * h.avgCost, 0);

  const handleAdd = () => {
    const ticker = tickerInput.trim().toUpperCase();
    const shares = parseFloat(sharesInput);
    const price = parseFloat(priceInput);
    if (!ticker) { Alert.alert('Missing ticker', 'Enter a ticker symbol.'); return; }
    if (isNaN(shares) || shares <= 0) { Alert.alert('Invalid shares', 'Enter a valid number of shares.'); return; }
    if (isNaN(price) || price <= 0) { Alert.alert('Invalid price', 'Enter a valid purchase price.'); return; }
    const entry: Holding = {
      ticker,
      shares,
      avgCost: price,
      dateAdded: new Date().toISOString(),
    };
    const next = [...holdings, entry];
    persist(next);
    setTickerInput('');
    setSharesInput('');
    setPriceInput('');
    setModalVisible(false);
  };

  const handleDelete = (index: number) => {
    const h = holdings[index];
    Alert.alert(
      'Remove Position',
      `Delete ${h.ticker} (${h.shares} shares)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => persist(holdings.filter((_, i) => i !== index)) },
      ],
    );
  };

  const renderEmpty = () => (
    <View style={s.emptyWrap}>
      <Text style={s.emptyTitle}>Start tracking your real portfolio</Text>
      <Text style={s.emptyBody}>Add your first position</Text>
      <TouchableOpacity style={s.emptyBtn} onPress={() => setModalVisible(true)}>
        <Text style={s.emptyBtnText}>+ Add Position</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Welcome' as any)} style={{ paddingRight: 12 }}>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Home</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>My Portfolio</Text>
          <Text style={s.headerDate}>{todayString()}</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={s.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Link to optimizer portfolios */}
      <TouchableOpacity onPress={() => navigation.navigate('WealthTracker' as any)} style={s.optimizerLink}>
        <Text style={s.optimizerLinkText}>View Optimizer Portfolios  ›</Text>
      </TouchableOpacity>

      {holdings.length === 0 ? renderEmpty() : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Total value hero */}
          <View style={s.heroCard}>
            <Text style={s.heroLabel}>TOTAL VALUE</Text>
            <Text style={s.heroValue}>{formatCurrency(totalValue)}</Text>
            <Text style={s.heroChange}>Today: $0.00 (0.00%)</Text>
          </View>

          {/* Holdings list */}
          {holdings.map((h, idx) => {
            const value = h.shares * h.avgCost;
            return (
              <View key={`${h.ticker}-${idx}`} style={s.holdingCard}>
                <View style={s.holdingLeft}>
                  <Text style={s.holdingTicker}>{h.ticker}</Text>
                  <Text style={s.holdingSub}>
                    {h.shares} shares @ {formatCurrency(h.avgCost)}
                  </Text>
                </View>
                <View style={s.holdingRight}>
                  <Text style={s.holdingValue}>{formatCurrency(value)}</Text>
                  <View style={s.changeBadge}>
                    <Text style={s.changeBadgeText}>0.00%</Text>
                  </View>
                </View>
                <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(idx)}>
                  <Text style={s.deleteBtnText}>X</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Add Position Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Add Position</Text>

            <Text style={s.inputLabel}>Ticker Symbol</Text>
            <TextInput
              style={s.input}
              value={tickerInput}
              onChangeText={setTickerInput}
              placeholder="e.g. AAPL"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
            />

            <Text style={s.inputLabel}>Number of Shares</Text>
            <TextInput
              style={s.input}
              value={sharesInput}
              onChangeText={setSharesInput}
              placeholder="e.g. 10"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad" returnKeyType="done"
            />

            <Text style={s.inputLabel}>Purchase Price ($)</Text>
            <TextInput
              style={s.input}
              value={priceInput}
              onChangeText={setPriceInput}
              placeholder="e.g. 150.00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad" returnKeyType="done"
            />

            <TouchableOpacity style={s.modalAddBtn} onPress={handleAdd}>
              <Text style={s.modalAddBtnText}>Add Position</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.modalCancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={s.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: spacing.md,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  optimizerLink: { paddingHorizontal: spacing.lg, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  optimizerLinkText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  headerDate: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  addBtn: {
    width: 40, height: 40, borderRadius: radius.lg, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { fontSize: 24, color: '#fff', fontWeight: '600', marginTop: -2 },
  scroll: { padding: spacing.lg, paddingBottom: 100 },

  // Hero
  heroCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.primary, marginBottom: spacing.lg, ...shadow.card,
  },
  heroLabel: { fontSize: 11, fontWeight: '700', color: colors.brandGold, letterSpacing: 1.5 },
  heroValue: { fontSize: 36, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
  heroChange: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },

  // Holdings
  holdingCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  holdingLeft: { flex: 1 },
  holdingTicker: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  holdingSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  holdingRight: { alignItems: 'flex-end', marginRight: spacing.sm },
  holdingValue: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  changeBadge: {
    backgroundColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 8,
    paddingVertical: 2, marginTop: 4,
  },
  changeBadgeText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  deleteBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(239,68,68,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtnText: { fontSize: 13, fontWeight: '700', color: colors.danger },

  // Empty
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  emptyBody: { fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
  emptyBtn: {
    marginTop: 24, backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: radius.lg,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    padding: spacing.lg, paddingBottom: Platform.OS === 'ios' ? 40 : spacing.lg,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.lg },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: colors.bg, borderRadius: radius.sm, padding: 14,
    fontSize: 16, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.md,
  },
  modalAddBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16,
    alignItems: 'center', marginTop: spacing.sm,
  },
  modalAddBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  modalCancelBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  modalCancelText: { fontSize: 15, color: colors.textSecondary },
});

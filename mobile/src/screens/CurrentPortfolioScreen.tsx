import React, { useCallback, useEffect, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../theme';
import { useTheme } from '../context/ThemeContext';
import HoldingCard from '../components/portfolio/HoldingCard';

const STORAGE_KEY = 'myHoldings';
const API_BASE = 'https://my-frontier-api.onrender.com';

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
  const { palette } = useTheme();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [tickerInput, setTickerInput] = useState('');
  const [sharesInput, setSharesInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [prices, setPrices] = useState<Record<string, { price: number; change: number; changePercent: number; history: number[] }>>({});

  const fetchPrices = async (h: Holding[]) => {
    if (!h.length) return;
    try {
      const tickers = h.map(x => x.ticker).join(',');
      const res = await fetch(`${API_BASE}/prices?tickers=${tickers}`);
      const data = await res.json();
      if (data.prices) setPrices(data.prices);
    } catch { /* silent */ }
  };

  useFocusEffect(useCallback(() => { loadHoldings(); }, []));

  useEffect(() => {
    if (holdings.length === 0) return;
    fetchPrices(holdings);
    const iv = setInterval(() => fetchPrices(holdings), 60000);
    return () => clearInterval(iv);
  }, [holdings.length]);

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

  const totalValue = holdings.reduce((sum, h) => sum + h.shares * (prices[h.ticker]?.price ?? h.avgCost), 0);
  const totalDayChange = holdings.reduce((sum, h) => sum + (prices[h.ticker]?.change ?? 0) * h.shares, 0);

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
      <Text style={[s.emptyTitle, { color: palette.textPrimary }]}>Start tracking your real portfolio</Text>
      <Text style={[s.emptyBody, { color: palette.textSecondary }]}>Add your first position</Text>
      <TouchableOpacity style={[s.emptyBtn, { backgroundColor: palette.brandBlue }]} onPress={() => setModalVisible(true)}>
        <Text style={s.emptyBtnText}>+ Add Position</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[s.root, { backgroundColor: palette.bgPrimary }]} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Welcome' as any)} style={{ paddingRight: 12 }}>
          <Ionicons name="chevron-back" size={24} color={palette.brandBlue} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: palette.textPrimary }]}>My Portfolio</Text>
          <Text style={[s.headerDate, { color: palette.textSecondary }]}>{todayString()}</Text>
        </View>
        <TouchableOpacity style={[s.addBtn, { backgroundColor: palette.brandBlue }]} onPress={() => setModalVisible(true)}>
          <Text style={s.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('WealthTracker' as any)} style={[s.optimizerLink, { borderBottomColor: palette.borderSubtle }]}>
        <Text style={[s.optimizerLinkText, { color: palette.brandBlue }]}>View Optimizer Portfolios  ›</Text>
      </TouchableOpacity>

      {holdings.length === 0 ? renderEmpty() : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={[s.heroCard, { backgroundColor: palette.bgElevated, borderColor: palette.brandBlue }]}>
            <Text style={[s.heroLabel, { color: palette.signalAmber }]}>TOTAL VALUE</Text>
            <Text style={[s.heroValue, { color: palette.textPrimary }]}>{formatCurrency(totalValue)}</Text>
            <Text style={[s.heroChange, { color: Object.keys(prices).length > 0 ? (totalDayChange >= 0 ? '#10B981' : '#EF4444') : palette.textTertiary }]}>
              {Object.keys(prices).length > 0 ? `Today: ${totalDayChange >= 0 ? '+' : ''}${formatCurrency(totalDayChange)}` : 'Loading prices...'}
            </Text>
          </View>

          {holdings.map((h, idx) => (
            <HoldingCard key={`${h.ticker}-${idx}`} holding={h} priceData={prices[h.ticker]} index={idx} totalValue={totalValue} onDelete={() => handleDelete(idx)} />
          ))}
        </ScrollView>
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: palette.bgElevated }]}>
            <Text style={[s.modalTitle, { color: palette.textPrimary }]}>Add Position</Text>

            <Text style={[s.inputLabel, { color: palette.textSecondary }]}>Ticker Symbol</Text>
            <TextInput
              style={[s.input, { backgroundColor: palette.bgPrimary, color: palette.textPrimary, borderColor: palette.borderSubtle }]}
              value={tickerInput}
              onChangeText={setTickerInput}
              placeholder="e.g. AAPL"
              placeholderTextColor={palette.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8, maxHeight: 34 }} contentContainerStyle={{ gap: 6 }}>
              {['VTI','SPY','QQQ','NVDA','AAPL','MSFT','AMZN','GOOGL','META','TSLA','AGG','VWO','GLD'].map(t => (
                <TouchableOpacity key={t} onPress={() => setTickerInput(t)} style={{ backgroundColor: palette.borderSubtle, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: palette.textSecondary }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[s.inputLabel, { color: palette.textSecondary }]}>Number of Shares</Text>
            <TextInput
              style={[s.input, { backgroundColor: palette.bgPrimary, color: palette.textPrimary, borderColor: palette.borderSubtle }]}
              value={sharesInput}
              onChangeText={setSharesInput}
              placeholder="e.g. 10"
              placeholderTextColor={palette.textSecondary}
              keyboardType="number-pad"
              returnKeyType="done"
            />

            <Text style={[s.inputLabel, { color: palette.textSecondary }]}>Purchase Price ($)</Text>
            <TextInput
              style={[s.input, { backgroundColor: palette.bgPrimary, color: palette.textPrimary, borderColor: palette.borderSubtle }]}
              value={priceInput}
              onChangeText={setPriceInput}
              placeholder="e.g. 150.00"
              placeholderTextColor={palette.textSecondary}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />

            <TouchableOpacity style={[s.modalAddBtn, { backgroundColor: palette.brandBlue }]} onPress={handleAdd}>
              <Text style={s.modalAddBtnText}>Add Position</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.modalCancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={[s.modalCancelText, { color: palette.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  optimizerLink: { paddingHorizontal: spacing.lg, paddingVertical: 8, borderBottomWidth: 1 },
  optimizerLinkText: { fontSize: 13, fontWeight: '600' },
  headerDate: { fontSize: 13, marginTop: 2 },
  addBtn: {
    width: 40, height: 40, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { fontSize: 24, color: '#fff', fontWeight: '600', marginTop: -2 },
  scroll: { padding: spacing.lg, paddingBottom: 100 },
  heroCard: {
    borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, marginBottom: spacing.lg, ...shadow.card,
  },
  heroLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  heroValue: { fontSize: 36, fontWeight: '800', marginTop: 4 },
  heroChange: { fontSize: 13, marginTop: 4 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  emptyBody: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  emptyBtn: {
    marginTop: 24, paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: radius.lg,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    padding: spacing.lg, paddingBottom: Platform.OS === 'ios' ? 40 : spacing.lg,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: spacing.lg },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    borderRadius: radius.sm, padding: 14,
    fontSize: 16, borderWidth: 1,
    marginBottom: spacing.md,
  },
  modalAddBtn: {
    borderRadius: radius.lg, paddingVertical: 16,
    alignItems: 'center', marginTop: spacing.sm,
  },
  modalAddBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  modalCancelBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  modalCancelText: { fontSize: 15 },
});

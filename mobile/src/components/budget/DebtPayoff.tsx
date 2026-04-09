/**
 * DebtPayoff.tsx — Premium feature
 * Debt Avalanche vs Snowball calculator with payoff date and bridge CTA.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../theme/colors';
import { NumberScale, HeadingScale, BodyScale, LabelStyle } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import Card from '../ui/Card';
import StatBadge from '../ui/StatBadge';
import GradientButton from '../ui/GradientButton';

// ---------- types & helpers ----------
interface Debt { id: string; name: string; balance: number; rate: number; minPayment: number }

// Simplified simulation: minimum payments only, cap at 360 months
const simulate = (debts: Debt[]): { months: number; totalInterest: number } => {
  if (!debts.length) return { months: 0, totalInterest: 0 };
  let balances = debts.map(d => ({ balance: d.balance, rate: d.rate / 100 / 12, min: d.minPayment }));
  let totalInterest = 0;
  let months = 0;
  while (balances.some(b => b.balance > 0.01) && months < 360) {
    balances = balances.map(b => {
      if (b.balance <= 0) return b;
      const interest = b.balance * b.rate;
      totalInterest += interest;
      const payment = Math.min(b.min, b.balance + interest);
      return { ...b, balance: b.balance + interest - payment };
    });
    months++;
  }
  return { months, totalInterest };
};

const fv20 = (monthly: number): number => {
  const fvFactor = (Math.pow(1.07, 20) - 1) / 0.07;
  return monthly * 12 * fvFactor;
};

const monthsToDate = (months: number): string => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const fmt = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

// ---------- component ----------
interface Props { isPremium: boolean; navigation?: any }

export default function DebtPayoff({ isPremium, navigation }: Props) {
  const [debts, setDebts]     = useState<Debt[]>([]);
  const [adding, setAdding]   = useState(false);
  const [draft, setDraft]     = useState({ name: '', balance: '', rate: '', minPayment: '' });

  useEffect(() => {
    AsyncStorage.getItem('debtPayoffData').then(raw => {
      if (raw) setDebts(JSON.parse(raw));
    });
  }, []);

  const save = async (updated: Debt[]) => {
    setDebts(updated);
    await AsyncStorage.setItem('debtPayoffData', JSON.stringify(updated));
  };

  const addDebt = () => {
    const b = parseFloat(draft.balance);
    const r = parseFloat(draft.rate);
    const m = parseFloat(draft.minPayment);
    if (!draft.name || isNaN(b) || isNaN(r) || isNaN(m)) {
      Alert.alert('Please fill all fields'); return;
    }
    save([...debts, { id: Date.now().toString(), name: draft.name, balance: b, rate: r, minPayment: m }]);
    setDraft({ name: '', balance: '', rate: '', minPayment: '' });
    setAdding(false);
  };

  const avalanche = simulate([...debts].sort((a, b) => b.rate - a.rate));
  const snowball  = simulate([...debts].sort((a, b) => a.balance - b.balance));
  const totalMin  = debts.reduce((s, d) => s + d.minPayment, 0);

  return (
    <View>
      {/* Debt rows */}
      {debts.map((d, i) => (
        <View key={d.id} style={styles.debtRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.debtName}>{d.name}</Text>
            <Text style={styles.debtMeta}>{fmt(d.balance)} · {d.rate}% APR · {fmt(d.minPayment)}/mo</Text>
          </View>
          <TouchableOpacity onPress={() => save(debts.filter((_, j) => j !== i))}>
            <Text style={styles.removeBtn}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Add form */}
      {adding ? (
        <View style={styles.addForm}>
          {(['name','balance','rate','minPayment'] as const).map(field => (
            <TextInput
              key={field}
              style={styles.input}
              placeholder={field === 'name' ? 'Debt name' : field === 'balance' ? 'Balance ($)' : field === 'rate' ? 'APR (%)' : 'Min payment ($)'}
              placeholderTextColor={Colors.textTertiary}
              value={draft[field]}
              onChangeText={v => setDraft(p => ({ ...p, [field]: v }))}
              keyboardType={field === 'name' ? 'default' : 'numeric'}
            />
          ))}
          <GradientButton label="Add Debt" onPress={addDebt} style={styles.addBtn} />
        </View>
      ) : (
        <TouchableOpacity style={styles.addRowBtn} onPress={() => setAdding(true)}>
          <Text style={styles.addRowText}>+ Add Debt</Text>
        </TouchableOpacity>
      )}

      {/* Results */}
      {debts.length > 0 && (
        <>
          <View style={styles.cardRow}>
            {[
              { label: '⚡ Avalanche', res: avalanche, desc: 'Highest rate first' },
              { label: '❄️ Snowball',  res: snowball,  desc: 'Lowest balance first' },
            ].map(({ label, res, desc }) => (
              <Card key={label} style={styles.halfCard}>
                <Text style={styles.stratLabel}>{label}</Text>
                <Text style={styles.stratDesc}>{desc}</Text>
                <Text style={styles.freeDate}>{monthsToDate(res.months)}</Text>
                <StatBadge
                  value={`${fmt(res.totalInterest)} interest`}
                  color="negative"
                />
              </Card>
            ))}
          </View>

          <View style={styles.debtFreeRow}>
            <Text style={styles.debtFreeLabel}>Debt-Free (Avalanche):</Text>
            <Text style={[HeadingScale.lg, { color: Colors.brandGold }]}>
              {monthsToDate(avalanche.months)}
            </Text>
          </View>

          <View style={styles.bridgeCard}>
            <Text style={styles.bridgeText}>
              Once debt-free, redirect{' '}
              <Text style={styles.bridgeHighlight}>{fmt(totalMin)}/mo</Text>
              {' → '}My Frontier.{'\n'}
              20yr projection:{' '}
              <Text style={styles.bridgeHighlight}>{fmt(fv20(totalMin))}</Text>
            </Text>
          </View>
        </>
      )}

      {/* Lock overlay */}
      {!isPremium && (
        <View style={styles.overlay}>
          <Text style={styles.lockEmoji}>🔒</Text>
          <Text style={styles.lockTitle}>Premium Feature</Text>
          <GradientButton
            label="Unlock Pro"
            variant="gold"
            onPress={() => navigation?.navigate('Premium')}
            style={styles.unlockBtn}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  debtRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  debtName:   { ...BodyScale.md, color: Colors.textPrimary },
  debtMeta:   { ...BodyScale.sm, color: Colors.textSecondary, marginTop: 2 },
  removeBtn:  { color: Colors.negative, fontSize: 18, paddingHorizontal: Spacing.sm },

  addForm:    { paddingVertical: Spacing.sm, gap: Spacing.sm },
  input:      { backgroundColor: Colors.bgCardElevated, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderSubtle, color: Colors.textPrimary, padding: Spacing.md, ...BodyScale.md },
  addBtn:     { marginTop: Spacing.sm },

  addRowBtn:  { paddingVertical: Spacing.md, alignItems: 'center' },
  addRowText: { ...BodyScale.md, color: Colors.brandBlue, fontWeight: '600' },

  cardRow:    { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  halfCard:   { flex: 1, gap: Spacing.sm },
  stratLabel: { ...BodyScale.md, color: Colors.textPrimary, fontWeight: '700' },
  stratDesc:  { ...BodyScale.sm, color: Colors.textSecondary },
  freeDate:   { ...BodyScale.sm, color: Colors.textGold },

  debtFreeRow: { marginTop: Spacing.lg, alignItems: 'center', gap: Spacing.sm },
  debtFreeLabel: { ...LabelStyle, color: Colors.textSecondary },

  bridgeCard:      { marginTop: Spacing.lg, backgroundColor: Colors.bgCardElevated, borderRadius: Radius.md, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.borderSubtle },
  bridgeText:      { ...BodyScale.md, color: Colors.textSecondary, lineHeight: 22 },
  bridgeHighlight: { color: Colors.positive, fontWeight: '700' },

  overlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,15,30,0.88)', borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  lockEmoji: { fontSize: 32 },
  lockTitle: { ...LabelStyle, color: Colors.textSecondary, marginBottom: Spacing.sm },
  unlockBtn: { width: 180 },
});

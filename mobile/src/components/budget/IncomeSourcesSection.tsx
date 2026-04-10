/**
 * IncomeSourcesSection.tsx — Additional income streams for Budget screen
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Modal, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import { BodyScale } from '../../theme/typography';

export interface IncomeSource {
  id: string; name: string;
  type: 'salary' | 'freelance' | 'rental' | 'dividends' | 'side_business' | 'other';
  amount: number; frequency: 'weekly' | 'biweekly' | 'monthly' | 'annually';
}

const TYPE_EMOJI: Record<string, string> = { salary: '💼', freelance: '💻', rental: '🏠', dividends: '📈', side_business: '🏪', other: '💰' };
const FREQ_LABELS = ['weekly', 'biweekly', 'monthly', 'annually'] as const;

export function toMonthly(amount: number, freq: string): number {
  if (freq === 'weekly') return amount * 4.33;
  if (freq === 'biweekly') return amount * 2.17;
  if (freq === 'monthly') return amount;
  if (freq === 'annually') return amount / 12;
  return amount;
}

interface Props { onTotalChange: (monthlyTotal: number) => void }

export default function IncomeSourcesSection({ onTotalChange }: Props) {
  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<IncomeSource['type']>('freelance');
  const [amount, setAmount] = useState('');
  const [freq, setFreq] = useState<IncomeSource['frequency']>('monthly');

  useEffect(() => {
    AsyncStorage.getItem('incomeSources').then(raw => {
      if (raw) try { const s = JSON.parse(raw); setSources(s); notifyTotal(s); } catch {}
    });
  }, []);

  const notifyTotal = (s: IncomeSource[]) => {
    onTotalChange(s.reduce((sum, src) => sum + toMonthly(src.amount, src.frequency), 0));
  };

  const persist = (next: IncomeSource[]) => {
    setSources(next);
    AsyncStorage.setItem('incomeSources', JSON.stringify(next));
    notifyTotal(next);
  };

  const addSource = () => {
    const a = parseFloat(amount);
    if (!name.trim() || isNaN(a) || a <= 0) { Alert.alert('Fill in all fields'); return; }
    persist([...sources, { id: Date.now().toString(), name: name.trim(), type, amount: a, frequency: freq }]);
    setName(''); setAmount(''); setModal(false);
  };

  const removeSource = (id: string) => persist(sources.filter(s => s.id !== id));

  const fmt = (n: number) => '$' + Math.round(n).toLocaleString();

  if (sources.length === 0 && !expanded) {
    return (
      <TouchableOpacity style={st.addRow} onPress={() => setModal(true)}>
        <Text style={st.addText}>+ Add additional income source</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={st.container}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} style={st.header}>
        <Text style={st.headerText}>Additional Income ({sources.length})</Text>
        <Text style={st.toggle}>{expanded ? '▾' : '▸'}</Text>
      </TouchableOpacity>
      {expanded && (
        <>
          {sources.map(s => (
            <View key={s.id} style={st.sourceRow}>
              <Text style={st.emoji}>{TYPE_EMOJI[s.type] ?? '💰'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={st.sourceName}>{s.name}</Text>
                <Text style={st.sourceMeta}>{fmt(s.amount)}/{s.frequency} = {fmt(toMonthly(s.amount, s.frequency))}/mo</Text>
              </View>
              <TouchableOpacity onPress={() => removeSource(s.id)}><Text style={st.deleteX}>X</Text></TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={st.addRow} onPress={() => setModal(true)}>
            <Text style={st.addText}>+ Add source</Text>
          </TouchableOpacity>
        </>
      )}

      <Modal visible={modal} transparent animationType="slide">
        <View style={st.modalOverlay}>
          <View style={st.modalContent}>
            <Text style={st.modalTitle}>Add Income Source</Text>
            <TextInput style={st.input} placeholder="Name (e.g. Freelance Design)" placeholderTextColor={Colors.textTertiary} value={name} onChangeText={setName} />
            <View style={st.typeRow}>{Object.entries(TYPE_EMOJI).map(([k, e]) => (
              <TouchableOpacity key={k} style={[st.typeBtn, type === k && st.typeBtnSel]} onPress={() => setType(k as IncomeSource['type'])}><Text>{e}</Text></TouchableOpacity>
            ))}</View>
            <TextInput style={st.input} placeholder="Amount ($)" placeholderTextColor={Colors.textTertiary} value={amount} onChangeText={setAmount} keyboardType="number-pad" />
            <View style={st.freqRow}>{FREQ_LABELS.map(f => (
              <TouchableOpacity key={f} style={[st.freqBtn, freq === f && st.freqBtnSel]} onPress={() => setFreq(f)}>
                <Text style={[st.freqTxt, freq === f && st.freqTxtSel]}>{f}</Text>
              </TouchableOpacity>
            ))}</View>
            <TouchableOpacity style={st.saveBtn} onPress={addSource}><Text style={st.saveTxt}>Save</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setModal(false)} style={{ marginTop: Spacing.sm }}><Text style={{ color: Colors.textTertiary, textAlign: 'center' }}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  headerText: { ...BodyScale.sm, color: Colors.textSecondary, fontWeight: '600' },
  toggle: { color: Colors.textTertiary, fontSize: 14 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  emoji: { fontSize: 18 },
  sourceName: { ...BodyScale.sm, color: Colors.textPrimary, fontWeight: '600' },
  sourceMeta: { fontSize: 11, color: Colors.textTertiary },
  deleteX: { color: '#EF4444', fontSize: 14, fontWeight: '700', padding: 4 },
  addRow: { paddingVertical: Spacing.sm },
  addText: { ...BodyScale.sm, color: Colors.brandBlue, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: Spacing.lg },
  modalContent: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.xl },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.lg },
  input: { backgroundColor: Colors.bgPrimary, borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: Radius.md, padding: 12, fontSize: 15, color: Colors.textPrimary, marginBottom: Spacing.sm },
  typeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, justifyContent: 'center' },
  typeBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.borderSubtle, alignItems: 'center', justifyContent: 'center' },
  typeBtnSel: { borderColor: Colors.brandBlue, backgroundColor: '#3B82F622' },
  freqRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md },
  freqBtn: { flex: 1, backgroundColor: Colors.bgPrimary, borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: Radius.md, paddingVertical: 8, alignItems: 'center' },
  freqBtnSel: { borderColor: Colors.brandBlue, backgroundColor: '#3B82F622' },
  freqTxt: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, textTransform: 'capitalize' },
  freqTxtSel: { color: Colors.brandBlue },
  saveBtn: { backgroundColor: Colors.brandBlue, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center' },
  saveTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

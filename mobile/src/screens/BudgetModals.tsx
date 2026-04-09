/**
 * BudgetModals.tsx
 * Income entry modal and category amount modal for BudgetScreen.
 */
import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors } from '../theme/colors';
import { HeadingScale, BodyScale } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import GradientButton from '../components/ui/GradientButton';

// ---------- Income Modal ----------
interface IncomeModalProps {
  visible: boolean;
  current: number;
  onClose: () => void;
  onSave: (amount: number) => void;
}

export function IncomeModal({ visible, current, onClose, onSave }: IncomeModalProps) {
  const [value, setValue] = useState(current > 0 ? String(current) : '');

  const handleSave = () => {
    const n = parseFloat(value.replace(/,/g, ''));
    if (!isNaN(n) && n >= 0) onSave(n);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Monthly Income</Text>
          <Text style={styles.subtitle}>Enter your total take-home pay per month</Text>
          <View style={styles.inputRow}>
            <Text style={styles.dollar}>$</Text>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={setValue}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.textTertiary}
              autoFocus
            />
          </View>
          <GradientButton label="Save" onPress={handleSave} />
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------- Category Modal ----------
interface CategoryModalProps {
  visible: boolean;
  categoryName: string;
  emoji: string;
  current: number;
  onClose: () => void;
  onSave: (amount: number) => void;
}

export function CategoryModal({ visible, categoryName, emoji, current, onClose, onSave }: CategoryModalProps) {
  const [value, setValue] = useState(current > 0 ? String(current) : '');

  const handleSave = () => {
    const n = parseFloat(value.replace(/,/g, ''));
    if (!isNaN(n) && n >= 0) onSave(n);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.titleEmoji}>{emoji}</Text>
          <Text style={styles.title}>{categoryName}</Text>
          <Text style={styles.subtitle}>How much do you spend here per month?</Text>
          <View style={styles.inputRow}>
            <Text style={styles.dollar}>$</Text>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={setValue}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.textTertiary}
              autoFocus
            />
          </View>
          <GradientButton label="Save" onPress={handleSave} />
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
  },
  titleEmoji: { fontSize: 36, textAlign: 'center', marginBottom: Spacing.sm },
  title:    { ...HeadingScale.lg, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { ...BodyScale.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCardElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  dollar: { ...HeadingScale.lg, color: Colors.textSecondary, marginRight: Spacing.sm },
  input:  { flex: 1, ...HeadingScale.lg, color: Colors.textPrimary, paddingVertical: Spacing.lg },
  cancelBtn: { marginTop: Spacing.md, alignItems: 'center' },
  cancelText: { ...BodyScale.md, color: Colors.textSecondary },
});

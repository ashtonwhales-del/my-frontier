/**
 * SubscriptionAudit.tsx — Premium feature
 * Lists subscriptions with keep/cut toggles and shows 30yr savings impact.
 */
import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { BodyScale, LabelStyle } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import GradientButton from '../ui/GradientButton';

export interface Subscription {
  name: string;
  monthlyCost: number;
  keep: boolean;
}

interface Props {
  subscriptions: Subscription[];
  onUpdate: (subs: Subscription[]) => void;
  isPremium: boolean;
  navigation?: any;
}

function fv30(monthly: number): number {
  // FV = PMT × ((1.07^30 - 1) / 0.07)  annualised then converted from annual to monthly
  const annualRate = 0.07;
  const periods = 30;
  const fvFactor = (Math.pow(1 + annualRate, periods) - 1) / annualRate;
  return monthly * 12 * fvFactor;
}

export default function SubscriptionAudit({ subscriptions, onUpdate, isPremium, navigation }: Props) {
  const toggle = (idx: number) => {
    const updated = subscriptions.map((s, i) => i === idx ? { ...s, keep: !s.keep } : s);
    onUpdate(updated);
  };

  const monthlyTotal   = subscriptions.reduce((s, x) => s + x.monthlyCost, 0);
  const annualTotal    = monthlyTotal * 12;
  const cuttable       = subscriptions.filter(s => !s.keep).reduce((s, x) => s + x.monthlyCost, 0);
  const savings30yr    = fv30(cuttable);

  return (
    <View>
      {/* Subscription rows */}
      {subscriptions.map((sub, idx) => (
        <View key={idx} style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.subName}>{sub.name}</Text>
            <Text style={styles.subCost}>
              ${sub.monthlyCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
            </Text>
          </View>
          <Switch
            value={sub.keep}
            onValueChange={() => toggle(idx)}
            trackColor={{ false: Colors.negativeSubtle, true: Colors.positiveSubtle }}
            thumbColor={sub.keep ? Colors.positive : Colors.negative}
          />
        </View>
      ))}

      {/* Totals */}
      <View style={styles.totals}>
        <Text style={styles.totalText}>
          Monthly:{' '}
          <Text style={styles.totalValue}>
            ${monthlyTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Text>
          {'  '}Annual:{' '}
          <Text style={styles.totalValue}>
            ${annualTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Text>
        </Text>
      </View>

      {/* Impact */}
      {cuttable > 0 && (
        <Text style={styles.impact}>
          Cutting cancelled subs saves{' '}
          <Text style={styles.impactHighlight}>
            ${cuttable.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
          </Text>
          {' → '}
          <Text style={styles.impactHighlight}>
            ${savings30yr.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Text>
          {' '}extra in your 30yr portfolio
        </Text>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  rowInfo:   { flex: 1 },
  subName:   { ...BodyScale.md, color: Colors.textPrimary },
  subCost:   { ...BodyScale.sm, color: Colors.textSecondary, marginTop: 2 },

  totals: {
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    marginTop: Spacing.sm,
  },
  totalText:  { ...BodyScale.md, color: Colors.textSecondary },
  totalValue: { color: Colors.textPrimary, fontWeight: '600' },

  impact: {
    ...BodyScale.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  impactHighlight: { color: Colors.positive, fontWeight: '600' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,15,30,0.88)',
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  lockEmoji: { fontSize: 32 },
  lockTitle: { ...LabelStyle, color: Colors.textSecondary, marginBottom: Spacing.sm },
  unlockBtn: { width: 180 },
});

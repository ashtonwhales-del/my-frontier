import React from 'react';
import { useNavigation } from '@react-navigation/native';
import HubScreen from '../components/HubScreen';

const SECTIONS = [
  { title: 'Foundation', items: [
    { icon: '💰', label: 'Budget & Expenses', sub: 'Track where your money goes', screen: 'Budget' },
    { icon: '💳', label: 'Debt Repayment', sub: 'Pay off debt faster', screen: 'DebtPlanner' },
  ]},
  { title: 'Optimize', items: [
    { icon: '💡', label: 'Bill Negotiator', sub: 'Find where you overpay', screen: 'BillNegotiation' },
    { icon: '📊', label: 'Income Streams', sub: 'Track all income sources', screen: 'Budget' },
  ]},
  { title: 'Plan', items: [
    { icon: '🎯', label: 'My Goals', sub: 'Save toward milestones', screen: 'GoalBuckets' },
    { icon: '🏠', label: 'Housing Tool', sub: 'Rent smarter or plan to buy', screen: 'Housing' },
  ]},
];

export default function FinanceHubScreen() {
  const navigation = useNavigation<any>();
  return <HubScreen title="My Finances" sections={SECTIONS} activeTab="Finance" navigation={navigation} />;
}

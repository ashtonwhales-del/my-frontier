import React from 'react';
import { useNavigation } from '@react-navigation/native';
import HubScreen from '../components/HubScreen';

const SECTIONS = [
  { title: 'Build', items: [
    { icon: '📊', label: 'Build Portfolio', sub: 'Use Efficient Frontier math', screen: 'Categories', params: { name: 'Investor' } },
    { icon: '💼', label: 'My Portfolios', sub: 'View and compare saved portfolios', screen: 'WealthTracker' },
  ]},
  { title: 'Track', items: [
    { icon: '📈', label: 'Real Holdings', sub: 'Track stocks you actually own', screen: 'CurrentPortfolio' },
    { icon: '🗓️', label: 'Net Worth Timeline', sub: 'See your wealth from now to 80', screen: 'NetWorthTimeline' },
  ]},
  { title: 'Analyze', items: [
    { icon: '⚖️', label: 'Compare Portfolios', sub: 'Side-by-side analysis', screen: 'Compare' },
    { icon: '🎓', label: 'Ask Alex', sub: 'Get portfolio guidance', screen: 'Advisor' },
  ]},
];

export default function InvestHubScreen() {
  const navigation = useNavigation<any>();
  return <HubScreen title="My Investments" sections={SECTIONS} activeTab="Invest" navigation={navigation} />;
}

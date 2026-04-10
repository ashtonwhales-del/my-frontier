import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE } from '../constants';

export interface Badge {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  premium?: boolean;
}

export const BADGES: Record<string, Badge> = {
  FIRST_PORTFOLIO:        { id: 'first_portfolio',        emoji: '🎯', name: 'First Portfolio',         desc: 'Built your very first portfolio' },
  MARKET_BEATER:          { id: 'market_beater',          emoji: '📈', name: 'Market Beater',            desc: 'Expected return above 12%' },
  DIVERSIFICATION_MASTER: { id: 'diversification_master', emoji: '🌍', name: 'Diversification Expert',   desc: 'Diversification score 8+' },
  STRESS_SURVIVOR:        { id: 'stress_survivor',        emoji: '💪', name: 'Stress Test Survivor',     desc: 'Ran a stress test on your portfolio' },
  LEARNING_CHAMPION:      { id: 'learning_champion',      emoji: '📚', name: 'Learning Champion',        desc: 'Completed all beginner lessons' },
  FRONTIER_EXPLORER:      { id: 'frontier_explorer',      emoji: '🏆', name: 'Top Performer',            desc: 'Achieved an A grade portfolio' },
  CONSISTENT_INVESTOR:    { id: 'consistent_investor',    emoji: '⏰', name: 'Consistent Investor',      desc: 'Built 5 portfolios' },
  COMPARISON_PRO:         { id: 'comparison_pro',         emoji: '⚖️', name: 'Comparison Pro',          desc: 'Compared 2 portfolios side by side' },
  HIGH_GROWTH:            { id: 'high_growth',            emoji: '🚀', name: 'High Growth Seeker',       desc: 'Expected return above 15%' },
  CONSERVATIVE:           { id: 'conservative',           emoji: '🛡️', name: 'Conservative Investor',   desc: 'Risk below 8%' },
  BALANCED_PRO:           { id: 'balanced_pro',           emoji: '⚖️', name: 'Balanced Pro',            desc: 'Grade B with balanced risk and return' },
  SHARPE_MASTER:          { id: 'sharpe_master',          emoji: '🔬', name: 'Sharpe Master',            desc: 'Sharpe ratio above 1.0' },
  CENTURY_CLUB:           { id: 'century_club',           emoji: '💯', name: 'Century Club',             desc: 'Smart Score of 9+' },
  GLOBAL_THINKER:         { id: 'global_thinker',         emoji: '🌐', name: 'Global Thinker',           desc: 'Selected 5+ categories' },
  RISK_WIZARD:            { id: 'risk_wizard',            emoji: '🧙', name: 'Risk Wizard',              desc: 'Under 8% volatility with A grade' },
};

export async function getEarnedBadges(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(STORAGE.BADGES_EARNED);
  return raw ? JSON.parse(raw) : [];
}

export async function awardBadge(badgeId: string): Promise<boolean> {
  const earned = await getEarnedBadges();
  if (earned.includes(badgeId)) return false;
  earned.push(badgeId);
  await AsyncStorage.setItem(STORAGE.BADGES_EARNED, JSON.stringify(earned));
  return true; // true = newly earned (caller can show toast)
}

export async function checkAndAwardBadges(params: {
  portfolioCount?: number;
  grade?: string;
  smartScore?: number;
  divScore?: number;
  expectedReturn?: number;
  volatility?: number;
  sharpe?: number;
  categoriesCount?: number;
}): Promise<Badge[]> {
  const newBadges: Badge[] = [];

  const maybe = async (condition: boolean, badgeId: string) => {
    if (condition) {
      const isNew = await awardBadge(badgeId);
      if (isNew) newBadges.push(BADGES[badgeId]);
    }
  };

  // First Portfolio: only if this is literally the first save (count was 0 before)
  await maybe((params.portfolioCount ?? 0) === 1, 'FIRST_PORTFOLIO');
  await maybe((params.portfolioCount ?? 0) >= 5, 'CONSISTENT_INVESTOR');
  await maybe(params.grade === 'A', 'FRONTIER_EXPLORER');
  await maybe((params.expectedReturn ?? 0) > 0.12, 'MARKET_BEATER');
  await maybe((params.expectedReturn ?? 0) > 0.15, 'HIGH_GROWTH');
  await maybe((params.divScore ?? 0) >= 8, 'DIVERSIFICATION_MASTER');
  await maybe((params.volatility ?? 1) < 0.08, 'CONSERVATIVE');
  await maybe(params.grade === 'B' && (params.volatility ?? 0) < 0.12, 'BALANCED_PRO');
  await maybe((params.smartScore ?? 0) >= 9, 'CENTURY_CLUB');
  await maybe((params.sharpe ?? 0) >= 1.0, 'SHARPE_MASTER');
  await maybe((params.volatility ?? 1) < 0.08 && params.grade === 'A', 'RISK_WIZARD');
  await maybe((params.categoriesCount ?? 0) >= 5, 'GLOBAL_THINKER');

  return newBadges;
}

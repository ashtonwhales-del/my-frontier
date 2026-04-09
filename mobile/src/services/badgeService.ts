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
  FIRST_PORTFOLIO:        { id: 'first_portfolio',        emoji: '🎯', name: 'First Portfolio',         desc: 'Built your first portfolio' },
  MARKET_BEATER:          { id: 'market_beater',          emoji: '📈', name: 'Market Beater',            desc: 'Built a portfolio with >10% expected return' },
  DIVERSIFICATION_MASTER: { id: 'diversification_master', emoji: '🌍', name: 'Diversification Master',   desc: 'Achieved a diversification score of 8+' },
  STRESS_SURVIVOR:        { id: 'stress_survivor',        emoji: '💪', name: 'Stress Test Survivor',     desc: 'Ran a stress test on your portfolio' },
  LEARNING_CHAMPION:      { id: 'learning_champion',      emoji: '📚', name: 'Learning Champion',        desc: 'Completed all beginner lessons' },
  FRONTIER_EXPLORER:      { id: 'frontier_explorer',      emoji: '🏔️', name: 'Frontier Explorer',       desc: 'Achieved an A grade portfolio' },
  CONSISTENT_INVESTOR:    { id: 'consistent_investor',    emoji: '⏰', name: 'Consistent Investor',      desc: 'Built 5 portfolios' },
  COMPARISON_PRO:         { id: 'comparison_pro',         emoji: '⚖️', name: 'Comparison Pro',          desc: 'Compared 2 portfolios side by side' },
  // Premium-only badges
  SHARPE_MASTER:          { id: 'sharpe_master',          emoji: '🔬', name: 'Sharpe Master',            desc: 'Achieved a Sharpe ratio above 1.0', premium: true },
  CENTURY_CLUB:           { id: 'century_club',           emoji: '💯', name: 'Century Club',             desc: 'Reached a Smart Score of 9+', premium: true },
  GLOBAL_THINKER:         { id: 'global_thinker',         emoji: '🌐', name: 'Global Thinker',           desc: 'Selected 5+ international categories', premium: true },
  RISK_WIZARD:            { id: 'risk_wizard',            emoji: '🧙', name: 'Risk Wizard',              desc: 'Built a portfolio with <8% volatility and A grade', premium: true },
  HISTORY_BUFF:           { id: 'history_buff',           emoji: '📜', name: 'History Buff',             desc: 'Viewed the 10-year historical chart', premium: true },
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

  await maybe((params.portfolioCount ?? 0) >= 1, 'FIRST_PORTFOLIO');
  await maybe((params.portfolioCount ?? 0) >= 5, 'CONSISTENT_INVESTOR');
  await maybe(params.grade === 'A', 'FRONTIER_EXPLORER');
  await maybe((params.expectedReturn ?? 0) > 0.10, 'MARKET_BEATER');
  await maybe((params.divScore ?? 0) >= 8, 'DIVERSIFICATION_MASTER');
  await maybe((params.smartScore ?? 0) >= 9, 'CENTURY_CLUB');
  await maybe((params.sharpe ?? 0) >= 1.0, 'SHARPE_MASTER');
  await maybe((params.volatility ?? 1) < 0.08 && params.grade === 'A', 'RISK_WIZARD');
  await maybe((params.categoriesCount ?? 0) >= 5, 'GLOBAL_THINKER');

  return newBadges;
}

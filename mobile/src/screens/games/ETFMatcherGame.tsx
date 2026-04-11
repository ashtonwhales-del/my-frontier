import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors as Colors, spacing as Spacing, radius as Radius } from '../../theme';

const PAIRS = [
  { ticker: 'VTI', description: 'Total US Market' },
  { ticker: 'SPY', description: 'S&P 500' },
  { ticker: 'QQQ', description: 'Top 100 Tech' },
  { ticker: 'AGG', description: 'US Bonds' },
  { ticker: 'GLD', description: 'Gold' },
  { ticker: 'VWO', description: 'Emerging Markets' },
  { ticker: 'VNQ', description: 'Real Estate' },
  { ticker: 'ARKK', description: 'Innovation' },
];

interface Card {
  id: number;
  pairIndex: number;
  text: string;
  type: 'ticker' | 'description';
}

function buildShuffledCards(): Card[] {
  const cards: Card[] = [];
  PAIRS.forEach((pair, i) => {
    cards.push({ id: i * 2, pairIndex: i, text: pair.ticker, type: 'ticker' });
    cards.push({ id: i * 2 + 1, pairIndex: i, text: pair.description, type: 'description' });
  });
  for (let j = cards.length - 1; j > 0; j--) {
    const k = Math.floor(Math.random() * (j + 1));
    [cards[j], cards[k]] = [cards[k], cards[j]];
  }
  return cards;
}

export default function ETFMatcherGame() {
  const navigation = useNavigation();
  const [cards, setCards] = useState<Card[]>(buildShuffledCards);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<number[]>([]);
  const lockRef = useRef(false);

  const matchCount = matched.size / 2;
  const won = matchCount === PAIRS.length;

  const handleTap = useCallback((index: number) => {
    if (lockRef.current) return;
    if (flipped.has(index) || matched.has(index)) return;

    const next = [...selected, index];
    setFlipped((prev) => new Set([...prev, index]));
    setSelected(next);

    if (next.length === 2) {
      const [a, b] = next;
      const cardA = cards[a];
      const cardB = cards[b];

      if (cardA.pairIndex === cardB.pairIndex && cardA.type !== cardB.type) {
        setMatched((prev) => new Set([...prev, a, b]));
        setSelected([]);
      } else {
        lockRef.current = true;
        setTimeout(() => {
          setFlipped((prev) => {
            const copy = new Set(prev);
            copy.delete(a);
            copy.delete(b);
            return copy;
          });
          setSelected([]);
          lockRef.current = false;
        }, 800);
      }
    }
  }, [selected, cards, flipped, matched]);

  const playAgain = () => {
    setCards(buildShuffledCards());
    setFlipped(new Set());
    setMatched(new Set());
    setSelected([]);
    lockRef.current = false;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Learning' as never)} style={styles.backBtn}>
          <Text style={styles.backArrow}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>ETF Matcher</Text>
        <Text style={styles.score}>{matchCount}/8</Text>
      </View>

      {won ? (
        <View style={styles.winContainer}>
          <Text style={styles.winText}>You matched all 8!</Text>
          <TouchableOpacity style={styles.playAgainBtn} onPress={playAgain}>
            <Text style={styles.playAgainText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.grid}>
          {cards.map((card, index) => {
            const isVisible = flipped.has(index) || matched.has(index);
            const isMatched = matched.has(index);
            return (
              <TouchableOpacity
                key={card.id}
                style={[
                  styles.card,
                  isMatched && styles.cardMatched,
                  isVisible && !isMatched && styles.cardFlipped,
                ]}
                onPress={() => handleTap(index)}
                activeOpacity={0.7}
              >
                <Text style={[styles.cardText, isMatched && styles.cardTextMatched]}>
                  {isVisible ? card.text : '?'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    paddingTop: 56,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  title: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  score: { color: Colors.brandGold, fontSize: 16, fontWeight: '700', width: 36, textAlign: 'right' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '23%',
    aspectRatio: 0.75,
    backgroundColor: Colors.bgCardElevated,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  cardFlipped: {
    backgroundColor: Colors.bgInput,
    borderColor: Colors.brandBlue,
  },
  cardMatched: {
    backgroundColor: Colors.positiveSubtle,
    borderColor: Colors.positive,
  },
  cardText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  cardTextMatched: { color: Colors.positive },
  winContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  winText: {
    color: Colors.brandGold,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: Spacing.xl,
  },
  playAgainBtn: {
    backgroundColor: Colors.brandBlue,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.xl,
  },
  playAgainText: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
});

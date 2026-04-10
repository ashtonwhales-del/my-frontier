import { LESSON_CONTENT } from './LessonContent';

export interface Lesson {
  id: string;
  emoji: string;
  title: string;
  tier: 'beginner' | 'intermediate' | 'advanced';
  premium: boolean;
  content: string; // multi-paragraph plain text — pages split on \n\n
}

export const LESSONS: Lesson[] = [
  // ── Beginner (free) ───────────────────────────────────────────────────────
  {
    id: 'what_is_etf',
    emoji: '📦',
    title: 'What is an ETF?',
    tier: 'beginner',
    premium: false,
    content: `Think of an ETF like a pizza.\n\nInstead of buying individual ingredients (buying single stocks), you buy one slice that contains everything — cheese, sauce, pepperoni, and vegetables all at once.\n\nAn ETF (Exchange-Traded Fund) is a basket of stocks you can buy in one click. When you buy VTI (a popular ETF), you instantly own a tiny piece of thousands of US companies.\n\nWhy is that great? Because if one company goes bankrupt, it barely hurts you — you own hundreds of others. That's diversification.\n\nETFs also tend to have very low fees. The S&P 500 ETF (SPY) charges about 0.09% per year. That's $9 on every $10,000 invested — almost nothing.`,
  },
  {
    id: 'risk_tolerance',
    emoji: '⚖️',
    title: 'What is risk tolerance?',
    tier: 'beginner',
    premium: false,
    content: `Imagine you're at an amusement park.\n\nSome people love the gentle carousel — slow, predictable, and comfortable. Others want the biggest roller coaster — thrilling highs and terrifying drops, but ultimately a wild ride.\n\nInvesting is the same. "Risk tolerance" describes how comfortable you are with your portfolio going up and down.\n\n• Low risk (1-2): You prefer steady growth, even if it's slower. You'd lose sleep if your portfolio dropped 20%.\n• Medium risk (3): You can handle some bumps but don't want a wild ride.\n• High risk (4-5): You're in it for the long haul. You know markets recover and you won't panic-sell during a crash.\n\nYour time horizon matters too. If you're 25 and won't touch this money until 60, you can afford to take on more risk — you have decades for markets to recover.`,
  },
  {
    id: 'diversification',
    emoji: '🎯',
    title: 'What is diversification?',
    tier: 'beginner',
    premium: false,
    content: `Don't put all your eggs in one basket.\n\nYou've heard that saying. In investing, it's one of the most important rules.\n\nImagine you put all your money in one tech company. If that company has a bad quarter, you lose big. But if you spread your money across 500 companies in different industries — tech, healthcare, energy, retail — one bad quarter at one company barely moves the needle.\n\nMy Frontier builds portfolios across multiple sectors automatically. Your Diversification Score measures how spread out your risk is (higher = better).\n\nThe math behind diversification was discovered by Harry Markowitz in 1952. He won the Nobel Prize for it. The core insight: combining assets that don't move together reduces overall risk without reducing returns. That's the Efficient Frontier.`,
  },
  // ── Intermediate (premium) ────────────────────────────────────────────────
  {
    id: 'efficient_frontier',
    emoji: '📈',
    title: 'The Efficient Frontier explained',
    tier: 'intermediate',
    premium: true,
    content: `The "Efficient Frontier" is the mathematical sweet spot where a portfolio delivers the maximum possible return for a given level of risk.\n\nHarry Markowitz figured this out in 1952 using mean-variance optimization — the same math My Frontier uses.\n\nHere's the idea: if you plot every possible portfolio on a graph (risk on x-axis, return on y-axis), the "frontier" is the curve of portfolios that give you the best return for each risk level. Any portfolio below the frontier is inefficient — you could get higher returns for the same risk.\n\nMy Frontier tries to find portfolios on (or near) this frontier by optimizing for the Sharpe ratio — the ratio of excess return to risk. Higher Sharpe = better risk-adjusted return.`,
  },
  {
    id: 'compound_interest',
    emoji: '💰',
    title: 'How compound interest really works',
    tier: 'intermediate',
    premium: true,
    content: `Einstein allegedly called compound interest "the eighth wonder of the world." Whether or not he said it, the math is remarkable.\n\nCompound interest means you earn returns on your returns. If you invest $1,000 at 10% per year:\n\n• Year 1: $1,100\n• Year 2: $1,210 (not $1,200 — the extra $10 came from earning on your year 1 gains)\n• Year 10: $2,594\n• Year 30: $17,449\n\nThe key insight: time is your most powerful asset. Starting at 25 vs 35 can literally double your final balance.\n\nWeekly contributions turbocharge this effect. Even $50/week invested at 8% annually becomes $160,000+ over 20 years.`,
  },
  {
    id: 'brokerage_account',
    emoji: '🏦',
    title: 'Opening your first brokerage account',
    tier: 'intermediate',
    premium: true,
    content: `To actually invest in ETFs, you need a brokerage account. Think of it as a bank account specifically for investing.\n\nTop beginner-friendly brokerages:\n• Fidelity — no minimums, excellent educational resources\n• Charles Schwab — great for beginners\n• Vanguard — best for index fund investing\n• Robinhood — simple UI, good for small amounts\n\nSteps to open an account:\n1. Choose a brokerage\n2. Provide your name, address, SSN (for taxes), and employment info\n3. Link your bank account\n4. Fund your account (start with whatever you can — even $50 counts)\n5. Search for the ETF tickers My Frontier recommended\n6. Buy fractional shares if you can't afford a full share\n\nMost accounts are free to open and charge $0 commission per trade. The ETF's expense ratio is the only ongoing cost.`,
  },
  {
    id: 'read_etf',
    emoji: '📊',
    title: 'How to read an ETF',
    tier: 'intermediate',
    premium: true,
    content: `When you look up an ETF like VTI, here's what the numbers mean:\n\n• Expense Ratio (ER): The annual fee, expressed as a percentage. VTI is 0.03% — incredibly cheap. Avoid anything over 1%.\n• AUM (Assets Under Management): How much money is in the fund. Larger = more liquid = easier to trade. Prefer ETFs with $1B+ AUM.\n• 52-week range: The price high and low over the past year. Ignore this for long-term investing.\n• Yield: Dividends paid as a percentage of price. Some ETFs pay quarterly dividends.\n• P/E Ratio: Price-to-earnings ratio of the underlying stocks. Higher means stocks are more expensive relative to earnings.\n\nFor beginners: ignore all these except the expense ratio. Low ER + large AUM = safe choice.`,
  },
  {
    id: 'international',
    emoji: '🌍',
    title: 'Why international exposure matters',
    tier: 'intermediate',
    premium: true,
    content: `The US stock market is huge, but it's only about 60% of global market cap. The other 40% is in Europe, Asia, emerging markets, and beyond.\n\nWhy hold international ETFs?\n\n• Diversification: US and international markets don't always move together. When US stocks fall, international stocks sometimes hold steady — or even rise.\n• Growth: Emerging markets (China, India, Brazil) are growing faster than the US. You get exposure to that growth.\n• Currency diversification: Owning international assets protects you if the dollar weakens.\n\nRecommended international ETFs:\n• VEA — Developed markets (Europe, Japan, Australia)\n• VWO — Emerging markets (China, India, Brazil)\n• VXUS — Everything outside the US in one fund\n\nA classic allocation: 60% US (VTI) + 30% international (VXUS) + 10% bonds (BND).`,
  },
  // ── Advanced (premium) ────────────────────────────────────────────────────
  {
    id: 'mvo_deep_dive',
    emoji: '🔬',
    title: 'Mean-variance optimization deep dive',
    tier: 'advanced',
    premium: true,
    content: `My Frontier uses Riskfolio-Lib, a Python library implementing Harry Markowitz's mean-variance optimization (MVO).\n\nThe math:\n\n1. Calculate expected returns (μ): the historical average annual return for each ETF\n2. Calculate the covariance matrix (Σ): how ETFs move relative to each other\n3. Find weights (w) that maximize the Sharpe ratio: (w·μ - rf) / √(wᵀΣw)\n\nKey constraints My Frontier applies:\n• No single ETF can exceed 10% weight (prevents concentration)\n• Broad-market ETFs (VTI, SPY, QQQ) must total at least 30%\n• Minimum 10 ETFs in every portfolio (ensures diversification)\n• Risk-free rate: 4.5% (current T-bill yield)\n\nThe algorithm solves a convex optimization problem — it always finds the global optimum, not a local one. This is what makes it powerful.`,
  },
  {
    id: 'survive_crash',
    emoji: '📉',
    title: 'Surviving a market crash',
    tier: 'advanced',
    premium: true,
    content: `Every major market crash in history has recovered. Every single one.\n\n• 1929 Crash: -89% → recovered in 25 years\n• 1987 Black Monday: -23% in one day → recovered in 2 years\n• 2000 Dot-com Bust: -49% → recovered in 7 years\n• 2008 Financial Crisis: -56% → recovered in 4 years\n• 2020 COVID Crash: -34% in 33 days → recovered in 5 months\n\nHow to survive a crash:\n1. Do nothing. Don't sell. Panic selling locks in losses.\n2. Keep contributing. Buying during crashes is buying on sale.\n3. Rebalance. If stocks fall and bonds hold, buy more stocks.\n4. Think in decades, not days.\n\nThe average bear market lasts 9 months. The average bull market lasts 2.7 years. Time in the market always beats timing the market.`,
  },
  {
    id: 'financial_goals',
    emoji: '🎯',
    title: 'Setting real financial goals',
    tier: 'advanced',
    premium: true,
    content: `Without a goal, investing is aimless. With a goal, every contribution has meaning.\n\nStep 1: Name your goal\n"Retirement at 60", "House down payment in 5 years", "Kid's college fund"\n\nStep 2: Quantify it\n"I need $800,000 by age 60" or "$60,000 in 5 years"\n\nStep 3: Work backwards\nUse My Frontier's projection tool. Input your goal amount and target age to see what weekly contribution gets you there.\n\nStep 4: Build the portfolio for that goal\n• Short-term goals (<5 years): Lower risk, more bonds\n• Medium-term (5-15 years): Balanced portfolio\n• Long-term (15+ years): Higher risk, all equities\n\nStep 5: Automate\nSet up automatic weekly investments so you never have to think about it. Consistency beats timing.`,
  },
  {
    id: 'tax_efficient',
    emoji: '⚡',
    title: 'Tax-efficient investing basics',
    tier: 'advanced',
    premium: true,
    content: `The government taxes investment gains. But you can legally minimize how much you pay.\n\nKey accounts:\n• 401(k): Pre-tax contributions reduce your taxable income now. Gains grow tax-deferred. Pay taxes on withdrawal at retirement.\n• Roth IRA: Post-tax contributions. Gains grow tax-FREE. No taxes on withdrawal. Limit: $7,000/year (2024).\n• Regular brokerage: Taxable, but capital gains tax is lower than income tax if you hold >1 year.\n\nOrder of priority:\n1. Max your 401(k) match (free money from employer)\n2. Max your Roth IRA ($7,000/year)\n3. Max your 401(k) ($23,000/year)\n4. Regular brokerage for everything else\n\nTax-loss harvesting: If an ETF loses value, you can sell it, claim the loss to offset gains, and immediately buy a similar ETF. My Frontier doesn't implement this yet, but it's worth knowing.`,
  },
];

export interface Game {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  premium: boolean;
}

// Override lesson content with rich multi-page versions from LessonContent.ts
LESSONS.forEach(lesson => {
  if (LESSON_CONTENT[lesson.id]) {
    lesson.content = LESSON_CONTENT[lesson.id];
  }
});

export const GAMES: Game[] = [
  { id: 'risk_quiz',    emoji: '🎮', title: 'Risk Quiz',         desc: '5 questions to discover your real risk tolerance', premium: true },
  { id: 'etf_matcher',  emoji: '🃏', title: 'ETF Matcher',       desc: 'Flip cards to match tickers to descriptions',       premium: true },
  { id: 'bull_bear',    emoji: '📰', title: 'Bull or Bear?',     desc: 'Read the headline — is it good or bad for markets?', premium: true },
  { id: 'frontier_challenge', emoji: '🏆', title: 'Frontier Challenge', desc: 'Build a portfolio that beats a target Sharpe ratio', premium: true },
];

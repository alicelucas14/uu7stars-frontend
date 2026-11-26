// Guide groups for the blog page ("Guides" section) and the "Related guides" box at the end of each guide.
// English titles/notes are the supplied copy; Hindi titles come from the Hindi blog posts themselves.

export interface Guide {
  /** Blog post slug (also the key of the related-guides map). */
  slug: string;
  /** Page the link goes to, as an English path. Defaults to /blog/<slug>/. */
  path?: string;
  /** English title shown in the "Guides" section. */
  title: string;
  /** English one-line note shown after the title. */
  note: string;
  /** Short name used in the "Related guides" box. */
  short: string;
}

export interface GuideGroup {
  key: 'gettingStarted' | 'cardGames' | 'slots' | 'liveGames';
  heading: string;
  guides: Guide[];
}

export const GUIDE_GROUPS: GuideGroup[] = [
  {
    key: 'gettingStarted',
    heading: 'Getting started',
    guides: [
      { slug: 'safe-online-gaming', title: "Safe Online Gaming: A Beginner's Guide", note: 'how to choose a safe app, key terms and myths to ignore', short: 'Safe Online Gaming' },
      // The old APK guide post now redirects to the Download page, so link straight to it.
      { slug: 'uu7-game-apk-for-android-step-by-step-download-for-players', path: '/download/', title: 'Starsuu7 APK Download (Official Latest Version)', note: 'download and install the official app', short: 'APK Download' },
      { slug: 'why-security-updates-should-not-be-ignored', title: 'Gaming Account Security: Passwords & Privacy', note: 'keep your account and money safe', short: 'Account Security' },
      { slug: 'digital-payment-safety-tips-for-online-players', title: 'Gaming Payments & Wallets: A Safety Guide', note: 'deposits, withdrawals and payment safety', short: 'Payments & Wallets' },
      { slug: 'how-to-plan-a-more-controlled-gaming-session', title: 'Responsible Gaming: Budgets, Breaks & Limits', note: 'keep gaming fun and under control', short: 'Responsible Gaming' },
      { slug: 'how-gaming-referral-programs-typically-work', title: 'Gaming Rewards, Loyalty & Referrals Explained', note: 'bonuses, cashback and how to read the terms', short: 'Rewards & Referrals' },
    ],
  },
  {
    key: 'cardGames',
    heading: 'Card games',
    guides: [
      { slug: 'teen-patti-master', title: 'Teen Patti Rules, Hand Rankings & Tips', note: 'full rules, blind and seen betting, hand rankings', short: 'Teen Patti Rules' },
      { slug: 'the-core-principles-behind-card-game-design', title: 'Card Game Strategy & Probability Basics', note: 'odds, outs and smarter decisions', short: 'Card Game Strategy' },
    ],
  },
  {
    key: 'slots',
    heading: 'Slots',
    guides: [
      { slug: 'rtp-in-slots', title: 'Slot RTP & Volatility Explained', note: 'what RTP and volatility mean for your budget', short: 'Slot RTP & Volatility' },
      { slug: 'wild-vs-scatter-symbols-explained', title: 'Wild vs Scatter Symbols in Slots Explained', note: 'how special symbols work', short: 'Wild & Scatter' },
      { slug: 'megaways-slots-explained-guide', title: 'Slot Paylines, Megaways & Ways to Win', note: 'how slots decide a win', short: 'Paylines & Megaways' },
      { slug: 'free-spins-explained', title: 'Free Spins in Slots Explained', note: 'triggers, multipliers and free-spin offers', short: 'Free Spins' },
      { slug: 'slot-testing-certification-explained', title: 'Slot RNG & Fairness Testing Explained', note: 'how random results are made and tested', short: 'RNG & Fairness' },
    ],
  },
  {
    key: 'liveGames',
    heading: 'Live games',
    guides: [
      { slug: 'indias-guide-to-crazy-time-scores-monopoly-big-baller-results', title: 'Crazy Time Results & Stats Explained', note: 'how the wheel works and how to read results', short: 'Crazy Time Results' },
    ],
  },
];

export const GUIDES: Guide[] = GUIDE_GROUPS.flatMap((g) => g.guides);
export const guideBySlug = (slug: string): Guide | undefined => GUIDES.find((g) => g.slug === slug);

// slug of a guide -> slugs of the 3 guides shown in its "Related guides" box.
const S = {
  safe: 'safe-online-gaming',
  apk: 'uu7-game-apk-for-android-step-by-step-download-for-players',
  security: 'why-security-updates-should-not-be-ignored',
  payments: 'digital-payment-safety-tips-for-online-players',
  responsible: 'how-to-plan-a-more-controlled-gaming-session',
  rewards: 'how-gaming-referral-programs-typically-work',
  teenPatti: 'teen-patti-master',
  cardStrategy: 'the-core-principles-behind-card-game-design',
  rtp: 'rtp-in-slots',
  wild: 'wild-vs-scatter-symbols-explained',
  paylines: 'megaways-slots-explained-guide',
  spins: 'free-spins-explained',
  rng: 'slot-testing-certification-explained',
  crazy: 'indias-guide-to-crazy-time-scores-monopoly-big-baller-results',
} as const;

export const RELATED_GUIDES: Record<string, string[]> = {
  [S.safe]: [S.apk, S.security, S.responsible],
  [S.security]: [S.payments, S.apk, S.safe],
  [S.payments]: [S.security, S.rewards, S.responsible],
  [S.responsible]: [S.payments, S.rewards, S.safe],
  [S.rewards]: [S.payments, S.spins, S.responsible],
  [S.teenPatti]: [S.cardStrategy, S.safe, S.responsible],
  [S.cardStrategy]: [S.teenPatti, S.rng, S.responsible],
  [S.rtp]: [S.wild, S.paylines, S.spins],
  [S.wild]: [S.spins, S.paylines, S.rtp],
  [S.paylines]: [S.wild, S.rtp, S.spins],
  [S.spins]: [S.wild, S.rewards, S.rtp],
  [S.rng]: [S.rtp, S.cardStrategy, S.paylines],
  [S.crazy]: [S.rtp, S.cardStrategy, S.responsible],
};

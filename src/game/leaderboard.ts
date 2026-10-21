import { LeaderboardEntry, DifficultyLevel, PlayerStats } from '../types/game';

const LEADERBOARD_STORAGE_KEY = 'street_hoops_leaderboard_v1';

export const INITIAL_GLOBAL_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'rank_1',
    rank: 1,
    playerName: 'CyberCurry_30',
    avatar: '🏀',
    country: '美国',
    countryCode: 'US',
    difficulty: 'legend',
    score: 11,
    fgPercentage: 88,
    threePointPercentage: 83,
    winStreak: 24,
    mvpRating: 2840,
    date: '2026-10-20',
  },
  {
    id: 'rank_2',
    rank: 2,
    playerName: '北京街球王_大鹏',
    avatar: '⚡',
    country: '中国',
    countryCode: 'CN',
    difficulty: 'legend',
    score: 11,
    fgPercentage: 83,
    threePointPercentage: 75,
    winStreak: 19,
    mvpRating: 2620,
    date: '2026-10-20',
  },
  {
    id: 'rank_3',
    rank: 3,
    playerName: 'Kyrie_Handles',
    avatar: '🔥',
    country: '澳大利亚',
    countryCode: 'AU',
    difficulty: 'legend',
    score: 11,
    fgPercentage: 81,
    threePointPercentage: 71,
    winStreak: 16,
    mvpRating: 2490,
    date: '2026-10-19',
  },
  {
    id: 'rank_4',
    rank: 4,
    playerName: 'Tokyo_Samurai99',
    avatar: '🎯',
    country: '日本',
    countryCode: 'JP',
    difficulty: 'allstar',
    score: 11,
    fgPercentage: 77,
    threePointPercentage: 66,
    winStreak: 14,
    mvpRating: 2310,
    date: '2026-10-20',
  },
  {
    id: 'rank_5',
    rank: 5,
    playerName: 'Paris_Hooper',
    avatar: '✨',
    country: '法国',
    countryCode: 'FR',
    difficulty: 'allstar',
    score: 11,
    fgPercentage: 75,
    threePointPercentage: 62,
    winStreak: 12,
    mvpRating: 2180,
    date: '2026-10-18',
  },
  {
    id: 'rank_6',
    rank: 6,
    playerName: '上海闪电_Leo',
    avatar: '👑',
    country: '中国',
    countryCode: 'CN',
    difficulty: 'allstar',
    score: 11,
    fgPercentage: 73,
    threePointPercentage: 60,
    winStreak: 11,
    mvpRating: 2050,
    date: '2026-10-20',
  },
  {
    id: 'rank_7',
    rank: 7,
    playerName: 'Berlin_Wall_D',
    avatar: '🛡️',
    country: '德国',
    countryCode: 'DE',
    difficulty: 'pro',
    score: 11,
    fgPercentage: 70,
    threePointPercentage: 54,
    winStreak: 9,
    mvpRating: 1890,
    date: '2026-10-17',
  },
  {
    id: 'rank_8',
    rank: 8,
    playerName: 'Samba_Dunk_BR',
    avatar: '🌴',
    country: '巴西',
    countryCode: 'BR',
    difficulty: 'pro',
    score: 11,
    fgPercentage: 68,
    threePointPercentage: 50,
    winStreak: 8,
    mvpRating: 1740,
    date: '2026-10-19',
  },
];

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to read leaderboard from storage:', err);
  }
  return INITIAL_GLOBAL_LEADERBOARD;
}

/**
 * Calculates MVP rating based on game performance
 */
export function calculateMvpRating(
  stats: PlayerStats,
  difficulty: DifficultyLevel,
  isWin: boolean,
  currentStreak: number
): number {
  const fgPct = stats.fgAttempts > 0 ? (stats.fgMade / stats.fgAttempts) * 100 : 0;
  const threePct = stats.threeAttempts > 0 ? (stats.threeMade / stats.threeAttempts) * 100 : 0;

  let multiplier = 1.0;
  if (difficulty === 'legend') multiplier = 1.6;
  else if (difficulty === 'allstar') multiplier = 1.3;
  else if (difficulty === 'pro') multiplier = 1.0;
  else multiplier = 0.8;

  const base =
    stats.points * 80 +
    fgPct * 4 +
    stats.threeMade * 50 +
    stats.ankleBreakers * 60 +
    (isWin ? 500 : 100) +
    currentStreak * 80;

  return Math.round(base * multiplier);
}

/**
 * Submits player match score to the global online leaderboard
 */
export function submitPlayerScore(
  playerName: string,
  stats: PlayerStats,
  difficulty: DifficultyLevel,
  isWin: boolean,
  streak: number
): { entry: LeaderboardEntry; rank: number } {
  const currentBoard = getLeaderboard();
  const mvp = calculateMvpRating(stats, difficulty, isWin, streak);
  const fgPct = stats.fgAttempts > 0 ? Math.round((stats.fgMade / stats.fgAttempts) * 100) : 0;
  const threePct = stats.threeAttempts > 0 ? Math.round((stats.threeMade / stats.threeAttempts) * 100) : 0;

  const newEntry: LeaderboardEntry = {
    id: 'user_' + Date.now(),
    rank: 0,
    playerName: playerName || '中国街球手',
    avatar: '🌟',
    country: '中国',
    countryCode: 'CN',
    difficulty,
    score: stats.points,
    fgPercentage: fgPct,
    threePointPercentage: threePct,
    winStreak: streak,
    mvpRating: mvp,
    date: new Date().toISOString().split('T')[0],
    isUser: true,
  };

  // Combine and sort by MVP rating descending
  const allEntries = [...currentBoard.filter((e) => !e.isUser), newEntry];
  allEntries.sort((a, b) => b.mvpRating - a.mvpRating);

  // Re-assign ranks
  allEntries.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  const userRank = allEntries.findIndex((e) => e.id === newEntry.id) + 1;

  try {
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(allEntries.slice(0, 50)));
  } catch (err) {
    console.warn('Failed to save updated leaderboard:', err);
  }

  return { entry: newEntry, rank: userRank };
}

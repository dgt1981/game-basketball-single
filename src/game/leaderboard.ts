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

  // Attempt to sync to remote PHP backend if available
  submitRemoteScore({
    playerName: newEntry.playerName,
    avatar: newEntry.avatar,
    country: newEntry.country,
    countryCode: newEntry.countryCode,
    difficulty: newEntry.difficulty,
    score: newEntry.score,
    fgPercentage: newEntry.fgPercentage,
    threePointPercentage: newEntry.threePointPercentage,
    winStreak: newEntry.winStreak,
    mvpRating: newEntry.mvpRating,
  }).catch(() => {});

  return { entry: newEntry, rank: userRank };
}

/**
 * Backend API URL for PHP server integration.
 * Resolves relative to current page location to support root (/) or any subfolder (/single-ball/) deployment.
 */
export function getLeaderboardApiUrl(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LEADERBOARD_API) {
    return import.meta.env.VITE_LEADERBOARD_API;
  }
  if (typeof window !== 'undefined' && window.location) {
    try {
      return new URL('backend/leaderboard.php', window.location.href).href;
    } catch {
      return './backend/leaderboard.php';
    }
  }
  return './backend/leaderboard.php';
}

/**
 * Universal normalizer: converts any backend JSON row (snake_case from MySQL or camelCase) into LeaderboardEntry
 */
export function normalizeLeaderboardRow(raw: any, index: number): LeaderboardEntry {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `item_${index}`,
      rank: index + 1,
      playerName: '街球选手',
      avatar: '🏀',
      country: '中国',
      countryCode: 'CN',
      difficulty: 'allstar',
      score: 11,
      fgPercentage: 0,
      threePointPercentage: 0,
      winStreak: 0,
      mvpRating: 0,
      date: new Date().toISOString().split('T')[0],
    };
  }

  const rawDiff = String(raw.difficulty || raw.Difficulty || 'allstar').toLowerCase();
  const validDiff: DifficultyLevel =
    rawDiff === 'rookie' || rawDiff === 'pro' || rawDiff === 'allstar' || rawDiff === 'legend'
      ? rawDiff
      : 'allstar';

  return {
    id: String(raw.id || raw.ID || `db_${index}`),
    rank: Number(raw.rank || raw.Rank || index + 1),
    playerName: String(
      raw.playerName || raw.player_name || raw.name || raw.username || '街球选手'
    ),
    avatar: String(raw.avatar || raw.Avatar || '🏀'),
    country: String(raw.country || raw.Country || '中国'),
    countryCode: String(raw.countryCode || raw.country_code || 'CN'),
    difficulty: validDiff,
    score: Number(raw.score ?? raw.Score ?? 11),
    fgPercentage: Number(raw.fgPercentage ?? raw.fg_percentage ?? raw.fgPct ?? raw.fg ?? 0),
    threePointPercentage: Number(
      raw.threePointPercentage ?? raw.three_point_percentage ?? raw.threePct ?? raw.three ?? 0
    ),
    winStreak: Number(raw.winStreak ?? raw.win_streak ?? raw.streak ?? 0),
    mvpRating: Number(raw.mvpRating ?? raw.mvp_rating ?? raw.mvp ?? raw.score ?? 0),
    date: String(
      raw.date || raw.created_at || raw.createdAt || new Date().toISOString().split('T')[0]
    ).slice(0, 10),
    isUser: Boolean(raw.isUser ?? raw.is_user ?? false),
  };
}

/**
 * Fetch leaderboard from PHP backend with fallback to localStorage.
 * Handles all JSON formats: raw array [...], { data: [...] }, { rows: [...] }, { list: [...] }.
 */
export async function fetchRemoteLeaderboard(
  difficulty: string = 'all',
  sort: string = 'mvp'
): Promise<LeaderboardEntry[] | null> {
  const url = getLeaderboardApiUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const separator = url.includes('?') ? '&' : '?';
    const queryUrl = `${url}${separator}difficulty=${encodeURIComponent(
      difficulty
    )}&sort=${encodeURIComponent(sort)}&limit=50`;

    const res = await fetch(queryUrl, {
      signal: controller.signal,
      cache: 'no-cache',
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[Leaderboard API] HTTP error ${res.status}`);
      return null;
    }

    const json = await res.json();

    // Extract list from various server JSON formats
    let rawList: any[] | null = null;
    if (Array.isArray(json)) {
      rawList = json;
    } else if (Array.isArray(json?.data)) {
      rawList = json.data;
    } else if (Array.isArray(json?.rows)) {
      rawList = json.rows;
    } else if (Array.isArray(json?.list)) {
      rawList = json.list;
    } else if (Array.isArray(json?.result)) {
      rawList = json.result;
    }

    if (rawList && rawList.length > 0) {
      const normalized = rawList.map((row, idx) => normalizeLeaderboardRow(row, idx));
      return normalized;
    }
  } catch (err) {
    console.warn('[Leaderboard API] Request failed:', err);
  }
  return null;
}

/**
 * Submit score to remote PHP backend
 */
export async function submitRemoteScore(
  payload: Record<string, unknown>
): Promise<{ entry: LeaderboardEntry; rank: number } | null> {
  const url = getLeaderboardApiUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const json = await res.json();
    const rawData = json?.data || json;
    if (rawData && typeof rawData === 'object') {
      const normalized = normalizeLeaderboardRow(rawData, 0);
      return { entry: normalized, rank: normalized.rank };
    }
  } catch {
    // Fall back to local
  }
  return null;
}

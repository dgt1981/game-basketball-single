/**
 * Game Types and Interfaces for Street Hoops 3D (街头狂飙 1v1)
 */

export type DifficultyLevel = 'rookie' | 'pro' | 'allstar' | 'legend';

export interface DifficultyConfig {
  id: DifficultyLevel;
  name: string;
  nameEn: string;
  badgeColor: string;
  reactionTime: number; // seconds
  contestDiscipline: number; // 0 to 1
  jumpBlockProbability: number;
  stealAggressiveness: number;
  speedMultiplier: number;
  description: string;
}

export type ShotRating = 'PERFECT' | 'EXCELLENT' | 'GOOD' | 'EARLY' | 'LATE' | 'VERY_EARLY' | 'VERY_LATE' | 'BLOCKED';

export interface ShotResult {
  rating: ShotRating;
  timingOffset: number; // ms from sweet spot
  contestPercent: number; // 0 - 100%
  isThreePointer: boolean;
  isMade: boolean;
  scoreAwarded: number;
  shotDistance: number; // in meters
  releaseSpeed: number;
  description: string;
}

export interface PlayerStats {
  points: number;
  fgMade: number;
  fgAttempts: number;
  threeMade: number;
  threeAttempts: number;
  blocks: number;
  steals: number;
  ankleBreakers: number;
}

export type GamePhase = 'TITLE' | 'PLAYING' | 'SHOT_IN_FLIGHT' | 'SCORED_CELEBRATION' | 'REPLAY' | 'MATCH_OVER' | 'PAUSED';

export interface ReplayKeyframe {
  timestamp: number;
  playerPos: [number, number, number];
  playerRot: number;
  playerPose: 'idle' | 'dribble' | 'run' | 'gather' | 'jump_shoot' | 'layup' | 'crossover' | 'celebrate';
  aiPos: [number, number, number];
  aiRot: number;
  aiPose: 'stance' | 'slide' | 'contest' | 'block_jump' | 'stumble' | 'rebound';
  ballPos: [number, number, number];
  ballRot: [number, number, number];
  ballState: 'held' | 'dribbling' | 'in_air' | 'net_swish' | 'rebound';
}

export interface ReplayClip {
  id: string;
  title: string;
  playerName: string;
  points: number;
  isThree: boolean;
  shotDistance: number;
  contestPercent: number;
  rating: ShotRating;
  difficulty: DifficultyLevel;
  date: string;
  duration: number; // seconds
  frames: ReplayKeyframe[];
  isHighlight?: boolean;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  playerName: string;
  avatar: string;
  country: string;
  countryCode: string;
  difficulty: DifficultyLevel;
  score: number;
  fgPercentage: number;
  threePointPercentage: number;
  winStreak: number;
  mvpRating: number;
  date: string;
  isUser?: boolean;
}

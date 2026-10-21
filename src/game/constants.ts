import { DifficultyConfig, DifficultyLevel } from '../types/game';

// Court Dimensions (Standard Half-court meters)
// Origin (0, 0, 0) is the center point on the ground right under the basket rim!
export const COURT = {
  WIDTH: 15.0, // X axis: -7.5 to +7.5
  LENGTH: 14.0, // Z axis: -2.0 (behind backboard) to +12.0 (half-court line)
  BACKBOARD_Z: -1.2,
  HOOP_X: 0,
  HOOP_Y: 3.05, // Standard 10 feet rim height
  HOOP_Z: -0.8, // Rim center projection
  RIM_RADIUS: 0.23, // ~45cm diameter
  BACKBOARD_WIDTH: 1.8,
  BACKBOARD_HEIGHT: 1.05,
  THREE_PT_RADIUS: 6.75, // FIBA / Olympic standard 6.75m from hoop
  KEY_WIDTH: 4.9,
  FREE_THROW_DIST: 5.8, // 5.8m from baseline
  BALL_RADIUS: 0.12, // Standard size 7 basketball radius
  GRAVITY: -9.81,
};

export const DIFFICULTIES: Record<DifficultyLevel, DifficultyConfig> = {
  rookie: {
    id: 'rookie',
    name: '菜鸟新秀 (Rookie)',
    nameEn: 'Rookie',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    reactionTime: 0.45,
    contestDiscipline: 0.35,
    jumpBlockProbability: 0.25,
    stealAggressiveness: 0.15,
    speedMultiplier: 0.85,
    description: '老黄此时防守反应较慢，容易被假动作晃飞，适合练习投篮手感与运球突破。',
  },
  pro: {
    id: 'pro',
    name: '职业高手 (Pro)',
    nameEn: 'Pro',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    reactionTime: 0.28,
    contestDiscipline: 0.65,
    jumpBlockProbability: 0.55,
    stealAggressiveness: 0.4,
    speedMultiplier: 1.0,
    description: '老黄进入常规对抗强度，紧贴防守，具有良好的干扰意识与封盖时机。',
  },
  allstar: {
    id: 'allstar',
    name: '全明星 (All-Star)',
    nameEn: 'All-Star',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    reactionTime: 0.18,
    contestDiscipline: 0.85,
    jumpBlockProbability: 0.78,
    stealAggressiveness: 0.65,
    speedMultiplier: 1.12,
    description: '老黄横向滑步极快，极难摆脱，出手稍有犹豫就会面临严密遮眼封盖。',
  },
  legend: {
    id: 'legend',
    name: '传奇殿堂 (Hall of Fame)',
    nameEn: 'Hall of Fame',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    reactionTime: 0.1,
    contestDiscipline: 0.96,
    jumpBlockProbability: 0.92,
    stealAggressiveness: 0.85,
    speedMultiplier: 1.25,
    description: '传奇防守大闸老黄！预判后撤步与变向，无情抓帽，失误即遭抢断。',
  },
};

// Target score for 1v1 match
export const WINNING_SCORE = 11;
export const SHOT_CLOCK_DURATION = 16; // 16s shot clock

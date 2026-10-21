import { ReplayClip, ReplayKeyframe, ShotResult, DifficultyLevel } from '../types/game';

const REPLAY_STORAGE_KEY = 'street_hoops_replays_v1';

export class ReplayRecorder {
  private buffer: ReplayKeyframe[] = [];
  private maxFrames: number = 240; // 4-5 seconds at 60fps or 8 seconds at 30fps

  public recordFrame(frame: ReplayKeyframe) {
    this.buffer.push(frame);
    if (this.buffer.length > this.maxFrames) {
      this.buffer.shift();
    }
  }

  public getSnapshot(): ReplayKeyframe[] {
    return [...this.buffer];
  }

  public clear() {
    this.buffer = [];
  }

  public createClipFromBuffer(
    shot: ShotResult,
    playerName: string,
    difficulty: DifficultyLevel,
    title?: string
  ): ReplayClip {
    const frames = this.getSnapshot();
    const clipTitle =
      title ||
      (shot.isThreePointer
        ? `🔥 ${shot.shotDistance.toFixed(1)}米 致命三分 (${shot.rating})`
        : `⚡ ${shot.shotDistance.toFixed(1)}米 精彩进球 (${shot.rating})`);

    const clip: ReplayClip = {
      id: 'clip_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: clipTitle,
      playerName: playerName || '街球风暴',
      points: shot.isThreePointer ? 3 : 2,
      isThree: shot.isThreePointer,
      shotDistance: shot.shotDistance,
      contestPercent: shot.contestPercent,
      rating: shot.rating,
      difficulty,
      date: new Date().toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      duration: frames.length > 0 ? (frames[frames.length - 1].timestamp - frames[0].timestamp) / 1000 : 3.5,
      frames,
      isHighlight: shot.rating === 'PERFECT' || shot.contestPercent > 45 || shot.isThreePointer,
    };

    saveReplayToStorage(clip);
    return clip;
  }
}

/**
 * Persists replay clips to localStorage
 */
export function saveReplayToStorage(clip: ReplayClip) {
  try {
    const saved = getStoredReplays();
    // Keep max 15 local replays
    const updated = [clip, ...saved.filter((c) => c.id !== clip.id)].slice(0, 15);
    localStorage.setItem(REPLAY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save replay to storage:', err);
  }
}

export function getStoredReplays(): ReplayClip[] {
  try {
    const raw = localStorage.getItem(REPLAY_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to load replays from storage:', err);
  }
  return SEEDED_COMMUNITY_REPLAYS;
}

/**
 * Compact encoder to share replay via URL hash or text code
 */
export function encodeReplayForSharing(clip: ReplayClip): string {
  // Downsample frames to 20fps for compact share link
  const sampleRate = Math.max(1, Math.floor(clip.frames.length / 70));
  const sampledFrames = clip.frames
    .filter((_, idx) => idx % sampleRate === 0)
    .map((f) => ({
      t: Math.round(f.timestamp),
      p: f.playerPos.map((n) => Math.round(n * 100) / 100),
      pr: Math.round(f.playerRot * 100) / 100,
      pp: f.playerPose,
      a: f.aiPos.map((n) => Math.round(n * 100) / 100),
      ar: Math.round(f.aiRot * 100) / 100,
      ap: f.aiPose,
      b: f.ballPos.map((n) => Math.round(n * 100) / 100),
      bs: f.ballState,
    }));

  const payload = {
    t: clip.title,
    n: clip.playerName,
    pts: clip.points,
    d: clip.shotDistance,
    c: clip.contestPercent,
    r: clip.rating,
    dif: clip.difficulty,
    dur: clip.duration,
    f: sampledFrames,
  };

  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  } catch (e) {
    console.error('Error encoding replay:', e);
    return '';
  }
}

/**
 * Decode shared replay string back into a playable ReplayClip
 */
export function decodeReplayFromShare(shareCode: string): ReplayClip | null {
  try {
    const jsonStr = decodeURIComponent(escape(atob(shareCode.trim())));
    const payload = JSON.parse(jsonStr);

    const frames: ReplayKeyframe[] = (payload.f || []).map((sf: any) => ({
      timestamp: sf.t,
      playerPos: sf.p as [number, number, number],
      playerRot: sf.pr,
      playerPose: sf.pp,
      aiPos: sf.a as [number, number, number],
      aiRot: sf.ar,
      aiPose: sf.ap,
      ballPos: sf.b as [number, number, number],
      ballRot: [0, 0, 0],
      ballState: sf.bs,
    }));

    return {
      id: 'shared_' + Date.now(),
      title: payload.t,
      playerName: payload.n,
      points: payload.pts,
      isThree: payload.pts === 3,
      shotDistance: payload.d,
      contestPercent: payload.c,
      rating: payload.r,
      difficulty: payload.dif || 'allstar',
      date: '社区分享',
      duration: payload.dur || 3.5,
      frames,
      isHighlight: true,
    };
  } catch (e) {
    console.error('Failed to decode shared replay:', e);
    return null;
  }
}

// Generate realistic keyframes for community sample replays
function generateSampleClipFrames(
  startPlayer: [number, number, number],
  endPlayer: [number, number, number],
  ballReleaseTime: number,
  isSwish: boolean
): ReplayKeyframe[] {
  const frames: ReplayKeyframe[] = [];
  const totalFrames = 80;
  const dt = 0.04; // 25fps

  for (let i = 0; i < totalFrames; i++) {
    const progress = i / totalFrames;
    const time = i * dt;

    // Player position
    const px = startPlayer[0] + (endPlayer[0] - startPlayer[0]) * Math.min(progress * 1.5, 1);
    const pz = startPlayer[1] + (endPlayer[1] - startPlayer[1]) * Math.min(progress * 1.5, 1);
    const py = progress > 0.4 && progress < 0.7 ? Math.sin((progress - 0.4) / 0.3 * Math.PI) * 0.75 : 0;

    // AI Defender
    const ax = px * 0.6;
    const az = pz - 1.2;
    const ay = progress > 0.45 && progress < 0.75 ? Math.sin((progress - 0.45) / 0.3 * Math.PI) * 0.6 : 0;

    // Ball
    let bx = px;
    let by = py + 0.8;
    let bz = pz;
    let bState: ReplayKeyframe['ballState'] = 'dribbling';

    if (progress < 0.35) {
      bState = 'dribbling';
      by = 0.15 + Math.abs(Math.sin(time * 12)) * 0.65;
    } else if (progress < 0.5) {
      bState = 'held';
      by = py + 1.2;
    } else {
      bState = 'in_air';
      // Flight to hoop (0, 3.05, -0.8)
      const flightProg = (progress - 0.5) / 0.45;
      if (flightProg <= 1.0) {
        bx = px + (0 - px) * flightProg;
        bz = pz + (-0.8 - pz) * flightProg;
        // Parabolic arc
        by = 2.2 + Math.sin(flightProg * Math.PI) * 2.8 + (3.05 - 2.2) * flightProg;
      } else {
        bState = 'net_swish';
        bx = 0;
        bz = -0.8;
        by = Math.max(0.2, 3.05 - (flightProg - 1.0) * 8);
      }
    }

    frames.push({
      timestamp: time * 1000,
      playerPos: [px, py, pz],
      playerRot: Math.atan2(-px, -pz),
      playerPose: progress < 0.35 ? 'dribble' : progress < 0.5 ? 'gather' : progress < 0.7 ? 'jump_shoot' : 'celebrate',
      aiPos: [ax, ay, az],
      aiRot: Math.atan2(px - ax, pz - az),
      aiPose: progress < 0.4 ? 'stance' : progress < 0.7 ? 'block_jump' : 'rebound',
      ballPos: [bx, by, bz],
      ballRot: [time * 8, 0, 0],
      ballState: bState,
    });
  }
  return frames;
}

export const SEEDED_COMMUNITY_REPLAYS: ReplayClip[] = [
  {
    id: 'seed_curry_3',
    title: '🔥 7.8米 极速拔起后撤步绝杀三分 (GREEN)',
    playerName: 'CurryChef_30',
    points: 3,
    isThree: true,
    shotDistance: 7.8,
    contestPercent: 58,
    rating: 'PERFECT',
    difficulty: 'legend',
    date: '10月20日 18:24',
    duration: 3.2,
    frames: generateSampleClipFrames([2.5, 7.8, 0], [1.2, 7.6, 0], 1.6, true),
    isHighlight: true,
  },
  {
    id: 'seed_ankle_breaker',
    title: '⚡ 晃倒防守者！急停中投空心入网',
    playerName: 'KyrieUncleDrew',
    points: 2,
    isThree: false,
    shotDistance: 5.4,
    contestPercent: 12,
    rating: 'PERFECT',
    difficulty: 'allstar',
    date: '10月20日 17:50',
    duration: 3.2,
    frames: generateSampleClipFrames([-2.8, 6.2, 0], [-0.5, 5.4, 0], 1.6, true),
    isHighlight: true,
  },
  {
    id: 'seed_clutch_buzzer',
    title: '⏱️ 压哨漂移后仰三分 极限绝平！',
    playerName: 'MambaMentality',
    points: 3,
    isThree: true,
    shotDistance: 7.2,
    contestPercent: 74,
    rating: 'EXCELLENT',
    difficulty: 'legend',
    date: '10月20日 16:15',
    duration: 3.2,
    frames: generateSampleClipFrames([3.2, 7.0, 0], [2.1, 7.2, 0], 1.6, true),
    isHighlight: true,
  },
];

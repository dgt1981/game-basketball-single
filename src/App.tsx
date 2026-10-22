/**
 * Street Hoops 3D (街头狂飙 1v1: 3D真实篮球对抗赛)
 * Realistic Physics & Fluid Shooting Feel & Smart AI Defender & Online Leaderboard & Replay Sharing
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/gameEngine';
import { HUD } from './components/HUD';
import { TitleScreen } from './components/TitleScreen';
import { ReplayModal } from './components/ReplayModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { MatchEndModal } from './components/MatchEndModal';
import {
  DifficultyLevel,
  GamePhase,
  PlayerStats,
  ShotRating,
  ShotResult,
  ReplayClip,
} from './types/game';
import { decodeReplayFromShare } from './game/replay';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // UI States
  const [phase, setPhase] = useState<GamePhase>('TITLE');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('allstar');
  const [playerName, setPlayerName] = useState<string>('街球风暴');

  // Match Tracking
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [aiScore, setAiScore] = useState<number>(0);
  const [shotClock, setShotClock] = useState<number>(16);

  // Shot Meter
  const [shotMeterValue, setShotMeterValue] = useState<number>(0);
  const [isGreen, setIsGreen] = useState<boolean>(false);
  const [shotRating, setShotRating] = useState<ShotRating | null>(null);
  const [contestPercent, setContestPercent] = useState<number>(0);

  // Dynamic In-Game Feedback Toasts
  const [feedbackToast, setFeedbackToast] = useState<{
    message: string;
    type: 'green' | 'score' | 'ankle' | 'contest' | 'miss';
  } | null>(null);

  // Match Statistics
  const [stats, setStats] = useState<PlayerStats>({
    points: 0,
    fgMade: 0,
    fgAttempts: 0,
    threeMade: 0,
    threeAttempts: 0,
    blocks: 0,
    steals: 0,
    ankleBreakers: 0,
  });
  const [lastHighlightClip, setLastHighlightClip] = useState<ReplayClip | null>(null);
  const [activeReplayClip, setActiveReplayClip] = useState<ReplayClip | null>(null);

  // Modal Overlays
  const [showReplayModal, setShowReplayModal] = useState<boolean>(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);

  const [playerScreenPos, setPlayerScreenPos] = useState<{ x: number; y: number } | null>(null);

  // Mutable callbacks container for GameEngine to avoid recreating canvas
  const callbacksRef = useRef({
    onPhaseChange: (newPhase: GamePhase) => {
      setPhase(newPhase);
    },
    onScoreUpdate: (pScore: number, aScore: number) => {
      setPlayerScore(pScore);
      setAiScore(aScore);
    },
    onShotClockUpdate: (secs: number) => {
      setShotClock(secs);
    },
    onShotMeterUpdate: (
      val: number,
      green: boolean,
      rating: ShotRating | null,
      contest: number,
      pos?: { x: number; y: number }
    ) => {
      setShotMeterValue(val);
      setIsGreen(green);
      setShotRating(rating);
      setContestPercent(contest);
      if (pos) setPlayerScreenPos(pos);
    },
    onShotResult: (result: ShotResult) => {
      // Handled in engine
    },
    onMatchFinished: (playerWon: boolean, finalStats: PlayerStats) => {
      setStats(finalStats);
    },
    onHighlightReady: (clip: ReplayClip) => {
      setLastHighlightClip(clip);
    },
    onFeedbackToast: (
      msg: string,
      type: 'green' | 'score' | 'ankle' | 'contest' | 'miss'
    ) => {
      setFeedbackToast({ message: msg, type });
      setTimeout(() => {
        setFeedbackToast((prev) => (prev?.message === msg ? null : prev));
      }, 2000);
    },
  });

  // Initialize Three.js Engine once on mount
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(canvasMountRef.current, {
      onPhaseChange: (p) => callbacksRef.current.onPhaseChange(p),
      onScoreUpdate: (p, a) => callbacksRef.current.onScoreUpdate(p, a),
      onShotClockUpdate: (s) => callbacksRef.current.onShotClockUpdate(s),
      onShotMeterUpdate: (v, g, r, c, pos) => callbacksRef.current.onShotMeterUpdate(v, g, r, c, pos),
      onShotResult: (r) => callbacksRef.current.onShotResult(r),
      onMatchFinished: (w, st) => callbacksRef.current.onMatchFinished(w, st),
      onHighlightReady: (clip) => callbacksRef.current.onHighlightReady(clip),
      onFeedbackToast: (m, t) => callbacksRef.current.onFeedbackToast(m, t),
    });

    engineRef.current = engine;
    engine.setDifficulty(difficulty);
    engine.setPlayerName(playerName);

    // Check if URL has a shared replay hash: #replay=...
    if (window.location.hash.startsWith('#replay=')) {
      const shareCode = window.location.hash.replace('#replay=', '');
      const sharedClip = decodeReplayFromShare(shareCode);
      if (sharedClip) {
        setActiveReplayClip(sharedClip);
        setShowReplayModal(true);
        engine.playReplay(sharedClip);
      }
    }

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Update difficulty and name in engine
  const handleSelectDifficulty = useCallback((lvl: DifficultyLevel) => {
    setDifficulty(lvl);
    engineRef.current?.setDifficulty(lvl);
  }, []);

  const handleChangePlayerName = useCallback((name: string) => {
    setPlayerName(name);
    engineRef.current?.setPlayerName(name);
  }, []);

  const handleStartGame = useCallback(() => {
    engineRef.current?.startMatch();
  }, []);

  const handlePauseToggle = useCallback(() => {
    engineRef.current?.pauseMatch();
  }, []);

  const handleReturnTitle = useCallback(() => {
    engineRef.current?.returnToTitle();
  }, []);

  const handlePlayClip = useCallback((clip: ReplayClip) => {
    setActiveReplayClip(clip);
    engineRef.current?.playReplay(clip);
  }, []);

  const handleCloseReplay = useCallback(() => {
    setShowReplayModal(false);
    setActiveReplayClip(null);
    engineRef.current?.stopReplay();
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Isolated Three.js WebGL Canvas Mount Container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full z-0 pointer-events-auto"
      />

      {/* Title Screen View */}
      {phase === 'TITLE' && (
        <TitleScreen
          currentDifficulty={difficulty}
          onSelectDifficulty={handleSelectDifficulty}
          playerName={playerName}
          onChangePlayerName={handleChangePlayerName}
          onStartGame={handleStartGame}
          onOpenLeaderboard={() => setShowLeaderboardModal(true)}
          onOpenReplays={() => setShowReplayModal(true)}
        />
      )}

      {/* In-Game HUD (During active match) */}
      {(phase === 'PLAYING' || phase === 'SHOT_IN_FLIGHT' || phase === 'SCORED_CELEBRATION') && (
        <HUD
          playerScore={playerScore}
          aiScore={aiScore}
          shotClock={shotClock}
          difficulty={difficulty}
          shotMeterValue={shotMeterValue}
          isGreen={isGreen}
          playerScreenPos={playerScreenPos}
          shotRating={shotRating}
          contestPercent={contestPercent}
          feedbackToast={feedbackToast}
          onOpenLeaderboard={() => setShowLeaderboardModal(true)}
          onOpenReplays={() => setShowReplayModal(true)}
          onPauseToggle={handlePauseToggle}
          onTouchDirection={(dir, sprint) => engineRef.current?.onTouchDirection(dir, sprint)}
          onTouchShootPress={() => engineRef.current?.onTouchShootPress()}
          onTouchShootRelease={() => engineRef.current?.onTouchShootRelease()}
          onTriggerStepback={() => {
            // Send synthetic keydown 'KeyX' to engine
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyX' }));
          }}
          onTriggerCrossover={() => {
            // Send synthetic keydown 'KeyC' to engine
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyC' }));
          }}
          onTriggerDunk={() => {
            engineRef.current?.onTouchDunk();
          }}
        />
      )}

      {/* Match Over Modal */}
      {phase === 'MATCH_OVER' && (
        <MatchEndModal
          playerWon={playerScore >= 11}
          playerScore={playerScore}
          aiScore={aiScore}
          stats={stats}
          difficulty={difficulty}
          playerName={playerName}
          lastHighlightClip={lastHighlightClip}
          onPlayHighlight={(clip) => {
            setShowReplayModal(true);
            handlePlayClip(clip);
          }}
          onRematch={handleStartGame}
          onReturnTitle={handleReturnTitle}
          onOpenLeaderboard={() => setShowLeaderboardModal(true)}
        />
      )}

      {/* Replay Sharing & Highlight Modal */}
      {showReplayModal && (
        <ReplayModal
          onClose={handleCloseReplay}
          onPlayClip={handlePlayClip}
          currentPlayingClip={activeReplayClip}
          onSetSpeed={(spd) => engineRef.current?.setReplaySpeed(spd)}
          onSetCameraAngle={(angle) => engineRef.current?.setReplayCameraAngle(angle)}
        />
      )}

      {/* Global Leaderboard Modal */}
      {showLeaderboardModal && (
        <LeaderboardModal onClose={() => setShowLeaderboardModal(false)} />
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Volume2, VolumeX, Eye, HelpCircle, Trophy, Film, ChevronDown, ChevronUp } from 'lucide-react';
import { DifficultyLevel, ShotRating } from '../types/game';
import { DIFFICULTIES } from '../game/constants';
import { sounds } from '../game/audio';

interface HUDProps {
  playerScore: number;
  aiScore: number;
  shotClock: number;
  difficulty: DifficultyLevel;
  shotMeterValue: number;
  isGreen: boolean;
  shotRating: ShotRating | null;
  contestPercent: number;
  feedbackToast: { message: string; type: string } | null;
  onOpenLeaderboard: () => void;
  onOpenReplays: () => void;
  onPauseToggle: () => void;
  onTouchDirection: (dir: { x: number; z: number }) => void;
  onTouchShootPress: () => void;
  onTouchShootRelease: () => void;
  onTriggerStepback: () => void;
  onTriggerCrossover: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  playerScore,
  aiScore,
  shotClock,
  difficulty,
  shotMeterValue,
  isGreen,
  shotRating,
  contestPercent,
  feedbackToast,
  onOpenLeaderboard,
  onOpenReplays,
  onPauseToggle,
  onTouchShootPress,
  onTouchShootRelease,
  onTriggerStepback,
  onTriggerCrossover,
}) => {
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const diffInfo = DIFFICULTIES[difficulty];

  const handleMuteToggle = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-between p-4 sm:p-6 z-10 font-sans">
      {/* Top Header Cluster: Scoreboard, Shot Clock, Difficulty */}
      <header className="flex items-start justify-between w-full max-w-6xl mx-auto pointer-events-auto">
        {/* Left: Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-amber-400 hover:bg-slate-800 text-xs font-semibold tracking-wider transition-colors shadow-md active:scale-95 cursor-pointer"
            title="全球排行榜"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>排行榜</span>
          </button>
          <button
            onClick={onOpenReplays}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-cyan-400 hover:bg-slate-800 text-xs font-semibold tracking-wider transition-colors shadow-md active:scale-95 cursor-pointer"
            title="精彩录像库"
          >
            <Film className="w-3.5 h-3.5 text-cyan-400" />
            <span>进球录像</span>
          </button>
          <button
            onClick={handleMuteToggle}
            className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:bg-slate-800 transition-colors shadow-md active:scale-95 cursor-pointer"
            title={isMuted ? '取消静音' : '静音'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>

        {/* Center: NBA-Style Scoreboard */}
        <div className="flex items-center bg-slate-950/90 border border-slate-700/90 rounded-xl px-5 py-2 shadow-2xl gap-6">
          {/* Player Score */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold tracking-widest text-red-400">PLAYER</div>
              <div className="text-xs font-medium text-slate-300">我方</div>
            </div>
            <div className="text-3xl font-extrabold text-white tabular-nums tracking-tight min-w-[36px] text-center">
              {playerScore}
            </div>
          </div>

          {/* Shot Clock Divider */}
          <div className="flex flex-col items-center border-x border-slate-800 px-4 py-0.5">
            <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400">进攻限时</div>
            <div
              className={`text-2xl font-black tabular-nums tracking-tighter ${
                shotClock <= 5 ? 'text-rose-500 animate-pulse' : 'text-amber-400'
              }`}
            >
              {shotClock.toString().padStart(2, '0')}
            </div>
          </div>

          {/* AI Score */}
          <div className="flex items-center gap-3">
            <div className="text-3xl font-extrabold text-white tabular-nums tracking-tight min-w-[36px] text-center">
              {aiScore}
            </div>
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold tracking-widest text-blue-400">DEFENDER</div>
              <div className="text-xs font-bold text-slate-200">老黄</div>
            </div>
          </div>
        </div>

        {/* Right: Difficulty & Target */}
        <div className="flex items-center gap-2">
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${diffInfo.badgeColor}`}
          >
            <span>{diffInfo.nameEn}</span>
          </div>
          <div className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-[11px] text-slate-300 font-medium">
            先达 11 分获胜
          </div>
        </div>
      </header>

      {/* Middle Center: Shot Meter & Action Feedback */}
      <div className="flex flex-col items-center justify-center my-auto pointer-events-none">
        {/* 2K Shot Meter Bar */}
        {shotMeterValue > 0 && (
          <div className="flex flex-col items-center gap-1.5 mb-4">
            <div className="text-xs font-bold tracking-widest uppercase text-slate-200 bg-slate-900/90 px-3 py-0.5 rounded-full border border-slate-700">
              {isGreen ? '🟢 完美时机释放!' : shotMeterValue > 85 ? '出手蓄力中...' : '起跳投篮'}
            </div>
            <div className="w-48 sm:w-56 h-3 bg-slate-900/90 rounded-full border-2 border-slate-600 p-0.5 relative overflow-hidden shadow-xl">
              {/* Green Target Zone indicator */}
              <div className="absolute right-[22%] top-0 bottom-0 w-4 bg-emerald-400/50 rounded-sm z-0" />
              {/* Fill Bar */}
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  isGreen
                    ? 'bg-gradient-to-r from-emerald-400 to-green-300 shadow-[0_0_12px_#34d399]'
                    : 'bg-gradient-to-r from-amber-400 to-orange-500'
                }`}
                style={{ width: `${shotMeterValue}%` }}
              />
            </div>
          </div>
        )}

        {/* Dynamic Feedback Toast */}
        {feedbackToast && (
          <div
            className={`px-4 py-2 rounded-xl text-sm sm:text-base font-extrabold tracking-wide shadow-2xl transition-all transform scale-100 border ${
              feedbackToast.type === 'green'
                ? 'bg-emerald-950/95 border-emerald-500 text-emerald-300 shadow-emerald-500/30'
                : feedbackToast.type === 'score'
                ? 'bg-amber-950/95 border-amber-500 text-amber-300 shadow-amber-500/30'
                : feedbackToast.type === 'ankle'
                ? 'bg-purple-950/95 border-purple-500 text-purple-300 shadow-purple-500/30'
                : feedbackToast.type === 'contest'
                ? 'bg-blue-950/95 border-blue-500 text-blue-300 shadow-blue-500/30'
                : 'bg-rose-950/95 border-rose-500 text-rose-300 shadow-rose-500/30'
            }`}
          >
            {feedbackToast.message}
          </div>
        )}

        {/* Defender Contest Badge */}
        {contestPercent > 15 && (
          <div className="mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300">
            老黄防守干扰: <span className="font-bold text-amber-400">{contestPercent}%</span>
          </div>
        )}
      </div>

      {/* Bottom Dock: Ergonomic Collapsible Controls (Zero Viewport Occlusion) */}
      <footer className="w-full max-w-4xl mx-auto flex flex-col items-center pointer-events-auto">
        {/* Toggle Tab */}
        <button
          onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/80 rounded-t-lg text-xs transition-colors cursor-pointer"
        >
          {isControlsCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{isControlsCollapsed ? '展开操作面板' : '折叠面板 (H)'}</span>
        </button>

        {!isControlsCollapsed && (
          <div className="w-full bg-slate-950/90 border border-slate-800 rounded-b-xl rounded-t-none sm:rounded-xl p-3 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
            {/* Keyboard Shortcuts Guide */}
            <div className="hidden sm:flex items-center flex-wrap gap-4 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono text-white">
                  WASD
                </span>
                <span>移动</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono text-white">
                  Shift
                </span>
                <span>加速运球</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono text-amber-300 font-bold">
                  空格键
                </span>
                <span>蓄力投篮 / 点按假动作</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono text-white">
                  X
                </span>
                <span>后撤步</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono text-white">
                  C
                </span>
                <span>变向晃人</span>
              </div>
            </div>

            {/* Touch Action Buttons for Mobile / Quick Click */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={onTriggerCrossover}
                className="flex-1 sm:flex-none px-3 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
              >
                变向 (C)
              </button>
              <button
                onClick={onTriggerStepback}
                className="flex-1 sm:flex-none px-3 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
              >
                后撤步 (X)
              </button>
              <button
                onMouseDown={onTouchShootPress}
                onMouseUp={onTouchShootRelease}
                onTouchStart={onTouchShootPress}
                onTouchEnd={onTouchShootRelease}
                className="flex-1 sm:flex-none px-5 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 active:scale-95 text-white font-bold rounded-lg shadow-lg border border-red-500/50 transition cursor-pointer"
              >
                投篮 / 假投
              </button>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};

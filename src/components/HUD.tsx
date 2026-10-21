import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Trophy, Film, ChevronDown, ChevronUp, Smartphone, HelpCircle, X, Flame } from 'lucide-react';
import { DifficultyLevel, ShotRating } from '../types/game';
import { DIFFICULTIES } from '../game/constants';
import { sounds } from '../game/audio';
import { VirtualJoystick } from './VirtualJoystick';

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
  onTouchDirection: (dir: { x: number; z: number }, sprint?: boolean) => void;
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
  onTouchDirection,
  onTouchShootPress,
  onTouchShootRelease,
  onTriggerStepback,
  onTriggerCrossover,
}) => {
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [showMobileHelp, setShowMobileHelp] = useState(false);

  // Auto-detect mobile / touch device
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [forceShowTouchControls, setForceShowTouchControls] = useState(true);

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
  }, []);

  const diffInfo = DIFFICULTIES[difficulty];

  const handleMuteToggle = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-between p-3 sm:p-6 z-10 font-sans">
      {/* Top Header Cluster: Scoreboard, Shot Clock, Difficulty */}
      <header className="flex items-start justify-between w-full max-w-6xl mx-auto pointer-events-auto">
        {/* Left: Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-amber-400 hover:bg-slate-800 text-[11px] sm:text-xs font-semibold tracking-wider transition-colors shadow-md active:scale-95 cursor-pointer"
            title="全球排行榜"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">排行榜</span>
          </button>
          <button
            onClick={onOpenReplays}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-cyan-400 hover:bg-slate-800 text-xs font-semibold tracking-wider transition-colors shadow-md active:scale-95 cursor-pointer"
            title="精彩录像库"
          >
            <Film className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">录像</span>
          </button>
          <button
            onClick={handleMuteToggle}
            className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:bg-slate-800 transition-colors shadow-md active:scale-95 cursor-pointer"
            title={isMuted ? '取消静音' : '静音'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={() => setShowMobileHelp(!showMobileHelp)}
            className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-orange-400 hover:bg-slate-800 transition-colors shadow-md active:scale-95 cursor-pointer"
            title="手机触屏控制指南"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Center: NBA-Style Scoreboard */}
        <div className="flex items-center bg-slate-950/90 border border-slate-700/90 rounded-xl px-3 sm:px-5 py-1.5 sm:py-2 shadow-2xl gap-3 sm:gap-6">
          {/* Player Score */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right">
              <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-red-400">YOU</div>
              <div className="text-[11px] sm:text-xs font-bold text-slate-300">我方</div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums tracking-tight min-w-[28px] sm:min-w-[36px] text-center">
              {playerScore}
            </div>
          </div>

          {/* Shot Clock Divider */}
          <div className="flex flex-col items-center border-x border-slate-800 px-2 sm:px-4 py-0.5">
            <div className="text-[8px] sm:text-[9px] uppercase font-bold tracking-wider text-slate-400">进攻限时</div>
            <div
              className={`text-xl sm:text-2xl font-black tabular-nums tracking-tighter ${
                shotClock <= 5 ? 'text-rose-500 animate-pulse' : 'text-amber-400'
              }`}
            >
              {shotClock.toString().padStart(2, '0')}
            </div>
          </div>

          {/* AI Score */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums tracking-tight min-w-[28px] sm:min-w-[36px] text-center">
              {aiScore}
            </div>
            <div className="text-left">
              <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-blue-400">DEFENDER</div>
              <div className="text-[11px] sm:text-xs font-bold text-slate-200">老黄</div>
            </div>
          </div>
        </div>

        {/* Right: Difficulty & Target */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div
            className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border text-[10px] sm:text-xs font-bold ${diffInfo.badgeColor}`}
          >
            <span>{diffInfo.nameEn}</span>
          </div>
        </div>
      </header>

      {/* Mobile Help Modal */}
      {showMobileHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 pointer-events-auto">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2 text-orange-400 font-bold text-sm">
                <Smartphone className="w-4 h-4" />
                <span>手机触屏操作指南</span>
              </div>
              <button
                onClick={() => setShowMobileHelp(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold shrink-0">
                  左手
                </span>
                <div>
                  <strong className="text-white">虚拟摇杆移动：</strong>
                  在左下角拖动圆盘 360° 移动，推到外圈自动<strong>加速奔跑</strong>！
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold shrink-0">
                  右手
                </span>
                <div>
                  <strong className="text-white">按住投篮：</strong>
                  按住大号投篮键起跳蓄力，在上方投篮条进入<strong>绿色高光区域</strong>时松手即可空心入网！
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold shrink-0">
                  假投
                </span>
                <div>
                  <strong className="text-white">点按假动作：</strong>
                  快速轻点投篮键（&lt;0.2秒）做出拜佛假动作，晃起防守者老黄！
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold shrink-0">
                  突破
                </span>
                <div>
                  <strong className="text-white">变向 (C) & 后撤步 (X)：</strong>
                  点击专属技能按钮，瞬间急停后撤拉开 3 分空间或晃倒老黄！
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowMobileHelp(false)}
              className="mt-4 w-full py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow transition"
            >
              我知道了，开始对抗
            </button>
          </div>
        </div>
      )}

      {/* Middle Center: Shot Meter & Action Feedback */}
      <div className="flex flex-col items-center justify-center my-auto pointer-events-none">
        {/* 2K Shot Meter Bar */}
        {shotMeterValue > 0 && (
          <div className="flex flex-col items-center gap-1.5 mb-4">
            <div className="text-xs font-bold tracking-widest uppercase text-slate-200 bg-slate-900/90 px-3 py-0.5 rounded-full border border-slate-700">
              {isGreen ? '🟢 完美时机释放!' : shotMeterValue > 85 ? '出手蓄力中...' : '起跳投篮'}
            </div>
            <div className="w-48 sm:w-56 h-3.5 bg-slate-900/90 rounded-full border-2 border-slate-600 p-0.5 relative overflow-hidden shadow-xl">
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

      {/* Dedicated Dual-Thumb Touch Controls for Mobile Screens */}
      <div className="w-full max-w-6xl mx-auto flex items-end justify-between px-1 pb-1 sm:pb-3 pointer-events-none">
        {/* Left Hand: Virtual Joystick */}
        <div className="pointer-events-auto">
          <VirtualJoystick
            onMove={(dir, isSprint) => onTouchDirection(dir, isSprint)}
            onStop={() => onTouchDirection({ x: 0, z: 0 }, false)}
          />
        </div>

        {/* Right Hand: Ergonomic Basketball Action Cluster */}
        <div className="pointer-events-auto flex flex-col items-end gap-2.5">
          {/* Secondary Skill Buttons Row */}
          <div className="flex items-center gap-2">
            <button
              onClick={onTriggerCrossover}
              style={{ touchAction: 'none' }}
              className="w-12 h-12 rounded-full bg-slate-900/85 border border-purple-500/60 text-purple-300 hover:text-white active:scale-90 shadow-xl flex flex-col items-center justify-center font-bold text-[10px] leading-tight transition cursor-pointer"
            >
              <span>变向</span>
              <span className="text-[8px] opacity-75">C</span>
            </button>

            <button
              onClick={onTriggerStepback}
              style={{ touchAction: 'none' }}
              className="w-12 h-12 rounded-full bg-slate-900/85 border border-cyan-500/60 text-cyan-300 hover:text-white active:scale-90 shadow-xl flex flex-col items-center justify-center font-bold text-[10px] leading-tight transition cursor-pointer"
            >
              <span>后撤步</span>
              <span className="text-[8px] opacity-75">X</span>
            </button>
          </div>

          {/* Primary Action: Big Shoot Button */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              onTouchShootPress();
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              onTouchShootRelease();
            }}
            onPointerCancel={(e) => {
              e.preventDefault();
              onTouchShootRelease();
            }}
            style={{ touchAction: 'none' }}
            className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-tr from-orange-600 via-red-600 to-amber-500 active:scale-95 text-white font-black shadow-[0_0_25px_rgba(234,88,12,0.5)] border-2 border-orange-300/60 flex flex-col items-center justify-center gap-0.5 transition-transform cursor-pointer"
          >
            <span className="text-base sm:text-lg">🏀</span>
            <span className="text-xs sm:text-sm tracking-wider uppercase drop-shadow">投篮</span>
            <span className="text-[9px] text-amber-200 opacity-90 font-medium">按住/轻点</span>
          </button>
        </div>
      </div>

      {/* Bottom Collapsible Guide Bar (Desktop / Reference) */}
      <footer className="w-full max-w-4xl mx-auto flex flex-col items-center pointer-events-auto">
        <button
          onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
          className="flex items-center gap-1.5 px-3 py-0.5 bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/80 rounded-t-lg text-[10px] sm:text-xs transition-colors cursor-pointer"
        >
          {isControlsCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{isControlsCollapsed ? '展开键盘说明' : '折叠键位说明 (H)'}</span>
        </button>

        {!isControlsCollapsed && (
          <div className="w-full bg-slate-950/90 border border-slate-800 rounded-b-xl p-2 sm:p-2.5 shadow-2xl flex items-center justify-center gap-4 text-[10px] sm:text-xs text-slate-400">
            <span className="hidden sm:inline">💻 电脑按键：</span>
            <span><strong className="text-white">WASD</strong> 移动</span>
            <span><strong className="text-white">Shift</strong> 加速</span>
            <span><strong className="text-amber-400">空格</strong> 投篮/假投</span>
            <span><strong className="text-white">X</strong> 后撤步</span>
            <span><strong className="text-white">C</strong> 变向晃人</span>
          </div>
        )}
      </footer>
    </div>
  );
};

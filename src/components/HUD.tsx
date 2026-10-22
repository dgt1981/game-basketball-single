import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Trophy, Film, ChevronDown, ChevronUp, Smartphone, HelpCircle, X, Zap } from 'lucide-react';
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
  playerScreenPos?: { x: number; y: number } | null;
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
  onTriggerDunk: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  playerScore,
  aiScore,
  shotClock,
  difficulty,
  shotMeterValue,
  isGreen,
  playerScreenPos,
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
  onTriggerDunk,
}) => {
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [showMobileHelp, setShowMobileHelp] = useState(false);

  const diffInfo = DIFFICULTIES[difficulty];

  const handleMuteToggle = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-between p-3 sm:p-6 z-10 font-sans">
      {/* Green Flash Vignette on Screen Edge */}
      {isGreen && (
        <div className="fixed inset-0 pointer-events-none z-20 border-[8px] sm:border-[12px] border-emerald-400/80 shadow-[inset_0_0_60px_rgba(16,185,129,0.5)] animate-pulse" />
      )}

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

      {/* 1. Dynamic 3D Overhead Shot Meter (紧随球员头顶上方) */}
      {shotMeterValue > 0 && playerScreenPos && (
        <div
          className="fixed pointer-events-none z-30 flex flex-col items-center -translate-x-1/2 -translate-y-full transition-none"
          style={{
            left: `${playerScreenPos.x}%`,
            top: `${playerScreenPos.y}%`,
          }}
        >
          {/* Status Floating Pill */}
          <div
            className={`px-3 py-0.5 rounded-full font-black text-xs tracking-wider uppercase mb-1 shadow-2xl transition-transform ${
              isGreen
                ? 'bg-emerald-400 text-slate-950 scale-125 shadow-[0_0_25px_#34d399] border-2 border-white animate-bounce'
                : shotMeterValue > 85
                ? 'bg-rose-500 text-white scale-105'
                : shotMeterValue > 65
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-950/90 text-slate-200 border border-slate-600'
            }`}
          >
            {isGreen ? '🟢 PERFECT! 立即松手!' : shotMeterValue > 85 ? '⚠️ 蓄力过饱' : '起跳蓄力中'}
          </div>

          {/* 3D Overhead Curved Arcade Meter */}
          <div
            className={`relative w-32 sm:w-36 h-5 sm:h-6 bg-slate-950/95 rounded-full border-2 p-0.5 shadow-[0_10px_30px_rgba(0,0,0,0.8)] overflow-hidden ${
              isGreen
                ? 'border-emerald-300 ring-4 ring-emerald-400/50 shadow-[0_0_30px_#10b981]'
                : 'border-slate-500'
            }`}
          >
            {/* Target Green Window (74% to 86%) */}
            <div className="absolute left-[74%] right-[14%] top-0 bottom-0 bg-emerald-400/80 rounded-sm z-10 border-x-2 border-emerald-200 shadow-[0_0_12px_#34d399]" />
            {/* Target Centerline Marker */}
            <div className="absolute left-[80%] top-0 bottom-0 w-1 bg-white z-20 shadow-[0_0_6px_#fff]" />

            {/* Instant 60FPS Fill Bar (Zero CSS transition delay) */}
            <div
              className={`h-full rounded-full transition-none ${
                isGreen
                  ? 'bg-gradient-to-r from-emerald-400 via-green-300 to-white shadow-[0_0_20px_#34d399]'
                  : shotMeterValue > 86
                  ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                  : 'bg-gradient-to-r from-amber-400 to-orange-500'
              }`}
              style={{ width: `${shotMeterValue}%` }}
            />
          </div>
        </div>
      )}

      {/* 2. Top-Center High-Contrast Broadcast Shot Meter (全屏高能蓄力显示) */}
      <div className="flex flex-col items-center justify-center my-auto pointer-events-none">
        {shotMeterValue > 0 && (
          <div className="flex flex-col items-center gap-2 mb-4 animate-in fade-in zoom-in-95 duration-100">
            {/* Status Heading & Instructions */}
            <div
              className={`flex items-center gap-2 px-4 py-1 rounded-full font-black text-xs sm:text-sm tracking-widest uppercase shadow-2xl transition-all ${
                isGreen
                  ? 'bg-emerald-500 text-slate-950 scale-110 shadow-[0_0_30px_#10b981] border-2 border-white'
                  : shotMeterValue > 86
                  ? 'bg-rose-600 text-white border border-rose-400'
                  : shotMeterValue > 65
                  ? 'bg-amber-400 text-slate-950 border border-amber-300'
                  : 'bg-slate-900/95 text-slate-200 border border-slate-700'
              }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>
                {isGreen
                  ? '🟢 完美时机！立即松开按键！ (GREEN)'
                  : shotMeterValue > 86
                  ? '⚠️ 稍晚 (LATE) - 已超过最佳时机'
                  : shotMeterValue > 65
                  ? '⚡ 正在进入甜点区，准备松手！'
                  : '起跳蓄力中 (按住空格/投篮键)'}
              </span>
            </div>

            {/* High-Visibility 2K Deluxe Gauge */}
            <div className="flex flex-col items-center relative">
              {/* Sweet-Spot Target Indicator Top Arrow */}
              <div className="absolute -top-3 left-[80%] -translate-x-1/2 flex flex-col items-center z-30 pointer-events-none">
                <span className="text-[10px] font-black text-emerald-400 tracking-tighter uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  甜点区
                </span>
                <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-emerald-400 drop-shadow" />
              </div>

              {/* The Heavy Bezel Bar */}
              <div
                className={`w-64 sm:w-80 h-6 sm:h-7 bg-slate-950/95 rounded-full border-2 p-1 relative overflow-hidden shadow-2xl transition-all ${
                  isGreen
                    ? 'border-emerald-300 ring-4 ring-emerald-500/50 shadow-[0_0_30px_#10b981]'
                    : 'border-slate-500 shadow-xl'
                }`}
              >
                {/* Green Sweet Spot Zone (74% to 86%) */}
                <div className="absolute left-[74%] right-[14%] top-0 bottom-0 bg-emerald-400/90 rounded-sm z-10 border-x-2 border-emerald-200 shadow-[0_0_15px_#34d399]" />
                {/* Target Sweet Spot White Centerline */}
                <div className="absolute left-[80%] top-0 bottom-0 w-1 bg-white z-20 shadow-[0_0_8px_#ffffff]" />

                {/* Instant 60FPS Reactive Fill Bar */}
                <div
                  className={`h-full rounded-full transition-none ${
                    isGreen
                      ? 'bg-gradient-to-r from-emerald-400 via-green-300 to-white shadow-[0_0_20px_#34d399]'
                      : shotMeterValue > 86
                      ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-600'
                      : 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300'
                  }`}
                  style={{ width: `${shotMeterValue}%` }}
                />
              </div>

              {/* Timing Scale Ticks */}
              <div className="w-full flex justify-between text-[9px] font-mono text-slate-500 px-2 mt-1">
                <span>0% 起跳</span>
                <span>50%</span>
                <span className="text-emerald-400 font-bold">80% 完美释放</span>
                <span>100% 极晚</span>
              </div>
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
                  <strong className="text-white">按住投篮蓄力：</strong>
                  按住大号投篮键起跳，在蓄力条到达<strong>绿色区间</strong>时松手，空心入网！
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
              <div className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold shrink-0">
                  暴扣
                </span>
                <div>
                  <strong className="text-white">战斧暴扣 (V)：</strong>
                  需冲刺切入禁区(3.8米内)起跳！若老黄正面拦截有被大帽或扣飞风险；可先用变向(C)晃倒老黄，或在起跳至最高点瞬间再次按键(V)触发完美抓扣强碾封盖！
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
              onClick={onTriggerDunk}
              style={{ touchAction: 'none' }}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 via-rose-600 to-red-600 border-2 border-amber-400/90 text-white active:scale-90 shadow-xl flex flex-col items-center justify-center font-black text-[10px] leading-tight transition cursor-pointer"
              title="战斧暴扣 (V)"
            >
              <span className="text-[12px]">🔥</span>
              <span>暴扣</span>
              <span className="text-[7px] opacity-90 font-mono -mt-0.5">V</span>
            </button>

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
            className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full font-black shadow-[0_0_25px_rgba(234,88,12,0.5)] border-2 flex flex-col items-center justify-center gap-0.5 transition-transform cursor-pointer ${
              isGreen
                ? 'bg-gradient-to-tr from-emerald-500 via-green-400 to-emerald-200 border-white scale-105 shadow-[0_0_30px_#10b981]'
                : 'bg-gradient-to-tr from-orange-600 via-red-600 to-amber-500 border-orange-300/60 active:scale-95'
            }`}
          >
            <span className="text-base sm:text-lg">{isGreen ? '🟢' : '🏀'}</span>
            <span className="text-xs sm:text-sm tracking-wider uppercase drop-shadow">
              {isGreen ? '松开出手!' : '投篮'}
            </span>
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
          <div className="w-full bg-slate-950/90 border border-slate-800 rounded-b-xl p-2 sm:p-2.5 shadow-2xl flex items-center justify-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-slate-400 flex-wrap">
            <span className="hidden sm:inline">💻 电脑按键：</span>
            <span><strong className="text-white">WASD</strong> 移动</span>
            <span><strong className="text-white">Shift</strong> 加速</span>
            <span><strong className="text-amber-400">空格</strong> 投篮/假投</span>
            <span><strong className="text-rose-400 font-bold">V</strong> 战斧暴扣 (需冲刺禁区/二段抓筐)</span>
            <span><strong className="text-purple-400">C</strong> 变向晃人</span>
            <span><strong className="text-cyan-400">X</strong> 后撤步</span>
          </div>
        )}
      </footer>
    </div>
  );
};

import React, { useState } from 'react';
import { Trophy, Film, Play, Flame, Shield, Sparkles } from 'lucide-react';
import { DifficultyLevel } from '../types/game';
import { DIFFICULTIES } from '../game/constants';

interface TitleScreenProps {
  currentDifficulty: DifficultyLevel;
  onSelectDifficulty: (level: DifficultyLevel) => void;
  playerName: string;
  onChangePlayerName: (name: string) => void;
  onStartGame: () => void;
  onOpenLeaderboard: () => void;
  onOpenReplays: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  currentDifficulty,
  onSelectDifficulty,
  playerName,
  onChangePlayerName,
  onStartGame,
  onOpenLeaderboard,
  onOpenReplays,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 sm:p-12 text-white pointer-events-auto">
      {/* Top Header / Branding */}
      <div className="flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-orange-400 font-bold">挑战老黄 3D</span>
            <div className="text-xs text-slate-400">真实物理单人1v1单挑赛</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-amber-400 text-xs font-bold transition shadow-lg cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>全球排行榜</span>
          </button>
          <button
            onClick={onOpenReplays}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-cyan-400 text-xs font-bold transition shadow-lg cursor-pointer"
          >
            <Film className="w-4 h-4 text-cyan-400" />
            <span>进球录像分享</span>
          </button>
        </div>
      </div>

      {/* Hero Center Lockup: Bespoke SVG Title & 35% Negative Space */}
      <div className="flex flex-col items-center justify-center max-w-3xl mx-auto my-auto text-center px-4">
        {/* Inline SVG Title Lockup */}
        <div className="w-full max-w-lg mb-4 drop-shadow-[0_10px_25px_rgba(249,115,22,0.3)]">
          <svg viewBox="0 0 540 120" className="w-full h-auto select-none">
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffedd5" />
                <stop offset="30%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
              <linearGradient id="subGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>
            <text
              x="50%"
              y="58"
              textAnchor="middle"
              className="font-black italic tracking-tighter"
              fontSize="68"
              fill="url(#titleGrad)"
              stroke="#0f172a"
              strokeWidth="4"
              paintOrder="stroke fill"
            >
              挑战老黄
            </text>
            <text
              x="50%"
              y="98"
              textAnchor="middle"
              className="font-bold tracking-widest uppercase"
              fontSize="16"
              fill="url(#subGrad)"
            >
              VS OLD HUANG &middot; 3D BASKETBALL SHOWDOWN
            </text>
          </svg>
        </div>

        <p className="text-sm sm:text-base text-slate-300 max-w-lg mb-8 drop-shadow-md leading-relaxed">
          单人1v1单挑赛！迎战防守大闸『老黄』，体验真实物理反弹、绿色时机投篮与智能AI对抗。
        </p>

        {/* Player Name Tag */}
        <div className="flex items-center gap-2 mb-6 bg-slate-950/80 border border-slate-800 rounded-full px-4 py-1.5 shadow-md">
          <span className="text-xs text-slate-400">参赛者昵称:</span>
          {isEditingName ? (
            <input
              type="text"
              value={playerName}
              onChange={(e) => onChangePlayerName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
              autoFocus
              className="bg-slate-800 text-amber-400 text-xs px-2 py-0.5 rounded outline-none border border-slate-600 font-bold"
              maxLength={12}
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="text-amber-400 font-bold text-xs hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{playerName || '中国街球手'}</span>
              <span className="text-[10px] text-slate-500">(修改)</span>
            </button>
          )}
        </div>

        {/* Difficulty Level Selector */}
        <div className="flex flex-col items-center gap-2 mb-8 w-full max-w-md">
          <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>选择老黄防守强度:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
            {(Object.keys(DIFFICULTIES) as DifficultyLevel[]).map((lvl) => {
              const d = DIFFICULTIES[lvl];
              const isSelected = currentDifficulty === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => onSelectDifficulty(lvl)}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                    isSelected
                      ? `${d.badgeColor} ring-2 ring-orange-500/70 shadow-lg scale-105`
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  <span>{d.nameEn}</span>
                  <span className="text-[10px] opacity-75 font-normal">{lvl === 'rookie' ? '新秀老黄' : lvl === 'pro' ? '职业老黄' : lvl === 'allstar' ? '全明星老黄' : '传奇老黄'}</span>
                </button>
              );
            })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 max-w-sm text-center">
            {DIFFICULTIES[currentDifficulty].description}
          </div>
        </div>

        {/* Primary Start CTA Button */}
        <button
          onClick={onStartGame}
          className="group relative inline-flex items-center justify-center gap-3 px-10 py-4 font-black tracking-wider text-base uppercase rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-rose-600 text-white shadow-[0_10px_35px_rgba(239,68,68,0.4)] hover:shadow-[0_15px_45px_rgba(239,68,68,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>挑战老黄 (ENTER / SPACE)</span>
        </button>

        {/* Single Flat Control-Hint Line */}
        <div className="mt-6 flex flex-col items-center gap-1.5 text-xs text-slate-400 tracking-wide font-medium">
          <div>电脑端：WASD 移动 · 空格 投篮/假投 · V 战斧暴扣 · C 变向晃人 · X 后撤步</div>
          <div className="text-amber-400 font-semibold text-[11px]">📱 手机触屏：左下角虚拟摇杆 360° 移动，右下角专属按键投篮/暴扣/突破</div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 max-w-6xl w-full mx-auto">
        <span>挑战老黄 3D &bull; WebGL PBR Engine</span>
        <span>先得 11 分胜出 &bull; 真实命中判定</span>
      </div>
    </div>
  );
};

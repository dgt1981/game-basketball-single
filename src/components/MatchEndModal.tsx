import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Film, RotateCcw, Home, Award, Flame, Check } from 'lucide-react';
import { PlayerStats, DifficultyLevel, ReplayClip } from '../types/game';
import { calculateMvpRating, submitPlayerScore } from '../game/leaderboard';

interface MatchEndModalProps {
  playerWon: boolean;
  playerScore: number;
  aiScore: number;
  stats: PlayerStats;
  difficulty: DifficultyLevel;
  playerName: string;
  lastHighlightClip: ReplayClip | null;
  onPlayHighlight: (clip: ReplayClip) => void;
  onRematch: () => void;
  onReturnTitle: () => void;
  onOpenLeaderboard: () => void;
}

export const MatchEndModal: React.FC<MatchEndModalProps> = ({
  playerWon,
  playerScore,
  aiScore,
  stats,
  difficulty,
  playerName,
  lastHighlightClip,
  onPlayHighlight,
  onRematch,
  onReturnTitle,
  onOpenLeaderboard,
}) => {
  const [hasSubmitted, setHasSubmitted] = React.useState(false);
  const [submittedRank, setSubmittedRank] = React.useState<number | null>(null);

  useEffect(() => {
    if (playerWon) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#eab308', '#38bdf8', '#ef4444'],
      });
    }
  }, [playerWon]);

  const mvp = calculateMvpRating(stats, difficulty, playerWon, playerWon ? 1 : 0);
  const fgPct = stats.fgAttempts > 0 ? Math.round((stats.fgMade / stats.fgAttempts) * 100) : 0;
  const threePct = stats.threeAttempts > 0 ? Math.round((stats.threeMade / stats.threeAttempts) * 100) : 0;

  const handleSubmitScore = () => {
    if (hasSubmitted) return;
    const { rank } = submitPlayerScore(playerName, stats, difficulty, playerWon, playerWon ? 1 : 0);
    setHasSubmitted(true);
    setSubmittedRank(rank);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 pointer-events-auto text-white">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center">
        {/* Victory / Defeat Badge */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-xl border ${
            playerWon
              ? 'bg-gradient-to-tr from-amber-500 to-orange-400 border-amber-300 text-slate-950'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}
        >
          {playerWon ? <Trophy className="w-8 h-8 fill-current" /> : <Flame className="w-8 h-8" />}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">
          {playerWon ? '🎉 单挑获胜 (VICTORY)!' : '遗憾落败 (DEFEAT)'}
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          {playerWon
            ? '漂亮的终结！你成功击溃了防守大闸老黄！'
            : '老黄防守强度极高，调整投篮节奏与突破时机再战！'}
        </p>

        {/* Final Score Banner */}
        <div className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl py-3 px-6 mb-6 flex items-center justify-around">
          <div>
            <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider">我方得分</div>
            <div className="text-3xl font-black text-white">{playerScore}</div>
          </div>
          <div className="text-slate-600 font-bold text-lg">:</div>
          <div>
            <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">老黄得分</div>
            <div className="text-3xl font-black text-white">{aiScore}</div>
          </div>
        </div>

        {/* Match Statistics Grid */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl">
            <div className="text-[10px] text-slate-400 font-medium">总得分 (PTS)</div>
            <div className="text-lg font-bold text-white">{stats.points}</div>
          </div>
          <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl">
            <div className="text-[10px] text-slate-400 font-medium">投篮命中率</div>
            <div className="text-lg font-bold text-amber-400">{fgPct}% ({stats.fgMade}/{stats.fgAttempts})</div>
          </div>
          <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl">
            <div className="text-[10px] text-slate-400 font-medium">三分命中率</div>
            <div className="text-lg font-bold text-cyan-400">{threePct}% ({stats.threeMade}/{stats.threeAttempts})</div>
          </div>
          <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl">
            <div className="text-[10px] text-slate-400 font-medium">晃倒防守</div>
            <div className="text-lg font-bold text-purple-400">{stats.ankleBreakers}次</div>
          </div>
        </div>

        {/* Calculated MVP Rating */}
        <div className="w-full bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-left">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-xs font-bold text-amber-300">本场比赛 MVP 战力值</div>
              <div className="text-[11px] text-slate-400">综合难度、投篮效率与终结表现评定</div>
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400">{mvp}</div>
        </div>

        {/* Submit to Leaderboard Button */}
        {!hasSubmitted ? (
          <button
            onClick={handleSubmitScore}
            className="w-full mb-3 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trophy className="w-4 h-4 fill-current" />
            <span>提交战绩至全球排行榜</span>
          </button>
        ) : (
          <div className="w-full mb-3 py-3 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            <span>已成功记录！当前全球排名: 第 #{submittedRank} 名</span>
            <button
              onClick={onOpenLeaderboard}
              className="underline text-amber-400 hover:text-amber-300 ml-2 cursor-pointer"
            >
              查看榜单
            </button>
          </div>
        )}

        {/* Highlight Replay Button (If scored during game) */}
        {lastHighlightClip && (
          <button
            onClick={() => onPlayHighlight(lastHighlightClip)}
            className="w-full mb-3 py-3 rounded-xl bg-cyan-900/40 hover:bg-cyan-800/50 border border-cyan-500/50 text-cyan-300 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Film className="w-4 h-4 text-cyan-400" />
            <span>观看赛点精彩进球 3D 慢动作回放</span>
          </button>
        )}

        {/* Primary Action Buttons */}
        <div className="w-full flex items-center gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={onReturnTitle}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>主菜单</span>
          </button>
          <button
            onClick={onRematch}
            className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black tracking-wider uppercase transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>再战一局</span>
          </button>
        </div>
      </div>
    </div>
  );
};

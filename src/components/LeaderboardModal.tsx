import React, { useState, useEffect } from 'react';
import { X, Trophy, Medal, Flame, Target, Award, Filter } from 'lucide-react';
import { LeaderboardEntry, DifficultyLevel } from '../types/game';
import { getLeaderboard, fetchRemoteLeaderboard } from '../game/leaderboard';

interface LeaderboardModalProps {
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(getLeaderboard());
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'mvp' | 'streak' | 'fg'>('mvp');

  useEffect(() => {
    let active = true;
    fetchRemoteLeaderboard(filterDifficulty, sortBy).then((remote) => {
      if (active && remote && remote.length > 0) {
        setEntries(remote);
      }
    });
    return () => {
      active = false;
    };
  }, [filterDifficulty, sortBy]);

  // Filter & Sort
  const filtered = entries
    .filter((e) => (filterDifficulty === 'all' ? true : e.difficulty === filterDifficulty))
    .sort((a, b) => {
      if (sortBy === 'mvp') return b.mvpRating - a.mvpRating;
      if (sortBy === 'streak') return b.winStreak - a.winStreak;
      return b.fgPercentage - a.fgPercentage;
    });

  const userEntry = entries.find((e) => e.isUser);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-none pointer-events-auto text-white">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>全球街球天梯榜 (Global Hall of Fame)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold uppercase">
                  Season 1 Live
                </span>
              </h2>
              <p className="text-xs text-slate-400">实时同步全球玩家MVP战力值与连胜纪录</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Rank Highlight Bar (if played) */}
        {userEntry && (
          <div className="px-6 py-2.5 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-amber-950/40 border-b border-amber-700/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-slate-200">我的实时排位:</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/30 text-amber-300 font-black">
                第 #{userEntry.rank} 名
              </span>
              <span className="text-slate-400">({userEntry.playerName})</span>
            </div>
            <div className="flex items-center gap-4 text-slate-300">
              <span>MVP战力: <strong className="text-amber-400">{userEntry.mvpRating}</strong></span>
              <span>最高连胜: <strong className="text-emerald-400">{userEntry.winStreak}</strong></span>
              <span>命中率: <strong className="text-cyan-400">{userEntry.fgPercentage}%</strong></span>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Difficulty Tabs */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">难度分类:</span>
            {[
              { id: 'all', label: '全部段位' },
              { id: 'legend', label: '传奇殿堂' },
              { id: 'allstar', label: '全明星' },
              { id: 'pro', label: '职业组' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterDifficulty(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
                  filterDifficulty === tab.id
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">排序:</span>
            <button
              onClick={() => setSortBy('mvp')}
              className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition ${
                sortBy === 'mvp' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              MVP战力
            </button>
            <button
              onClick={() => setSortBy('streak')}
              className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition ${
                sortBy === 'streak' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              连胜场次
            </button>
            <button
              onClick={() => setSortBy('fg')}
              className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition ${
                sortBy === 'fg' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              命中率
            </button>
          </div>
        </div>

        {/* Table List */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 w-16 text-center">排名</th>
                <th className="py-2.5 px-4">球手昵称 / 国家地区</th>
                <th className="py-2.5 px-4 text-center">段位难度</th>
                <th className="py-2.5 px-4 text-right">投篮命中率</th>
                <th className="py-2.5 px-4 text-right">三分命中率</th>
                <th className="py-2.5 px-4 text-right">连胜</th>
                <th className="py-2.5 px-4 text-right font-bold text-amber-400">MVP战力值</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((item, index) => {
                const rankNumber = index + 1;
                const isTop3 = rankNumber <= 3;
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      item.isUser ? 'bg-amber-950/30 border-l-4 border-amber-500 font-bold' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center font-black">
                      {rankNumber === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black">
                          1
                        </span>
                      ) : rankNumber === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black">
                          2
                        </span>
                      ) : rankNumber === 3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white font-black">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">#{rankNumber}</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{item.avatar}</span>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{item.playerName}</span>
                            {item.isUser && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                                你
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">{item.country}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          item.difficulty === 'legend'
                            ? 'bg-purple-500/20 text-purple-300'
                            : item.difficulty === 'allstar'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {item.difficulty}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums font-semibold text-slate-200">
                      {item.fgPercentage}%
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-300">
                      {item.threePointPercentage}%
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums font-bold text-emerald-400">
                      {item.winStreak} 连胜
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums font-black text-amber-400 text-sm">
                      {item.mvpRating}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <span>完成比赛后将自动评估你的比赛MVP战力并计入天梯榜</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer transition"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Play, RotateCcw, Share2, Copy, Check, Video, Camera, Sparkles, Download, Upload } from 'lucide-react';
import { ReplayClip } from '../types/game';
import {
  getStoredReplays,
  encodeReplayForSharing,
  decodeReplayFromShare,
  saveReplayToStorage,
} from '../game/replay';

interface ReplayModalProps {
  onClose: () => void;
  onPlayClip: (clip: ReplayClip) => void;
  currentPlayingClip: ReplayClip | null;
  onSetSpeed: (speed: number) => void;
  onSetCameraAngle: (angle: 'broadcast' | 'rim' | 'follow') => void;
}

export const ReplayModal: React.FC<ReplayModalProps> = ({
  onClose,
  onPlayClip,
  currentPlayingClip,
  onSetSpeed,
  onSetCameraAngle,
}) => {
  const [replays, setReplays] = useState<ReplayClip[]>(getStoredReplays());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedSpeed, setSelectedSpeed] = useState<number>(0.5);
  const [activeCam, setActiveCam] = useState<'broadcast' | 'rim' | 'follow'>('broadcast');
  const [importCode, setImportCode] = useState<string>('');
  const [showImport, setShowImport] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleCopyShareLink = (clip: ReplayClip) => {
    const encoded = encodeReplayForSharing(clip);
    const url = `${window.location.origin}${window.location.pathname}#replay=${encoded}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedId(clip.id);
        showToast('🔗 录像专属分享链接已复制到剪贴板！');
        setTimeout(() => setCopiedId(null), 2000);
      });
    }
  };

  const handleImportReplay = () => {
    if (!importCode.trim()) return;
    const clip = decodeReplayFromShare(importCode);
    if (clip) {
      saveReplayToStorage(clip);
      setReplays(getStoredReplays());
      onPlayClip(clip);
      setShowImport(false);
      setImportCode('');
      showToast('🎉 成功导入并播放玩家录像！');
    } else {
      showToast('❌ 录像代码无效或已损坏');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-none pointer-events-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>精彩进球录像中心</span>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                  3D Multi-Angle Replay
                </span>
              </h2>
              <p className="text-xs text-slate-400">支持多机位慢动作回放、高光集锦与在线分享</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImport(!showImport)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-600 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>导入录像</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast alert */}
        {toastMsg && (
          <div className="bg-cyan-950 border-b border-cyan-800 px-6 py-2 text-xs font-bold text-cyan-300 text-center animate-fadeIn">
            {toastMsg}
          </div>
        )}

        {/* Import Code Input Area */}
        {showImport && (
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-300">粘贴录像分享代码 / 链接:</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="粘贴别人分享的录像代码..."
                value={importCode}
                onChange={(e) => setImportCode(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleImportReplay}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 font-bold text-xs rounded-lg transition cursor-pointer"
              >
                导入并播放
              </button>
            </div>
          </div>
        )}

        {/* Live Active Replay Control Bar (If currently playing a clip) */}
        {currentPlayingClip && (
          <div className="px-6 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400">正在回放:</span>
              <span className="text-xs font-medium text-slate-200">{currentPlayingClip.title}</span>
            </div>

            {/* Camera Angles */}
            <div className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] text-slate-400">机位:</span>
              <button
                onClick={() => {
                  setActiveCam('broadcast');
                  onSetCameraAngle('broadcast');
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition ${
                  activeCam === 'broadcast'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                侧面转播
              </button>
              <button
                onClick={() => {
                  setActiveCam('rim');
                  onSetCameraAngle('rim');
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition ${
                  activeCam === 'rim'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                篮筐俯瞰
              </button>
              <button
                onClick={() => {
                  setActiveCam('follow');
                  onSetCameraAngle('follow');
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition ${
                  activeCam === 'follow'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                跟拍视角
              </button>
            </div>

            {/* Slow Motion Speeds */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">回放速度:</span>
              {[0.25, 0.5, 1.0].map((spd) => (
                <button
                  key={spd}
                  onClick={() => {
                    setSelectedSpeed(spd);
                    onSetSpeed(spd);
                  }}
                  className={`px-2 py-0.5 rounded text-xs font-bold cursor-pointer transition ${
                    selectedSpeed === spd
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Replays Grid List */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {replays.map((clip) => {
            const isPlaying = currentPlayingClip?.id === clip.id;
            return (
              <div
                key={clip.id}
                className={`relative rounded-xl border p-4 flex flex-col justify-between transition-all shadow-md ${
                  isPlaying
                    ? 'bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-white leading-snug">{clip.title}</h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase shrink-0 ${
                        clip.points === 3
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {clip.points}分命中
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-3">
                    <span>投篮距离: <strong className="text-slate-200">{clip.shotDistance.toFixed(1)}米</strong></span>
                    <span>干扰度: <strong className="text-amber-400">{clip.contestPercent}%</strong></span>
                    <span>评级: <strong className="text-emerald-400">{clip.rating}</strong></span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-2 mb-3">
                    <span>选手: {clip.playerName}</span>
                    <span>{clip.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      onPlayClip(clip);
                      onSetCameraAngle(activeCam);
                      onSetSpeed(selectedSpeed);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-xs transition cursor-pointer ${
                      isPlaying
                        ? 'bg-cyan-600 text-white shadow-lg'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isPlaying ? '重播该镜头' : '在3D中播放'}</span>
                  </button>

                  <button
                    onClick={() => handleCopyShareLink(clip)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition cursor-pointer"
                    title="复制分享链接"
                  >
                    {copiedId === clip.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span>{copiedId === clip.id ? '已复制' : '分享'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <span>共 {replays.length} 个精彩回放记录</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer transition"
          >
            返回游戏
          </button>
        </div>
      </div>
    </div>
  );
};

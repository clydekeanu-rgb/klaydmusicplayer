import React, { useState } from 'react';
import { X, Sliders, Radio, Server, Zap, Globe, CheckCircle2, AlertCircle } from 'lucide-react';
import { PlayerSettings } from '../types';
import { setCustomApiBase } from '../services/api';

interface SettingsModalProps {
  settings: PlayerSettings;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<PlayerSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onUpdateSettings,
}) => {
  const [apiUrl, setApiUrl] = useState(() => {
    return (typeof window !== 'undefined' ? localStorage.getItem('ytm_api_base') : '') || '';
  });
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');

  const handleTestApi = async (urlToTest: string) => {
    setTestStatus('testing');
    const base = urlToTest.trim() || '/api';
    const cleanBase = base.endsWith('/api') ? base : `${base.replace(/\/$/, '')}/api`;
    try {
      const res = await fetch(`${cleanBase}/health`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        setTestStatus('ok');
      } else {
        setTestStatus('fail');
      }
    } catch {
      setTestStatus('fail');
    }
  };

  const handleSaveApi = () => {
    setCustomApiBase(apiUrl.trim() || null);
    handleTestApi(apiUrl);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#121216] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-bold text-white tracking-tight">Player Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings List */}
        <div className="space-y-5">
          {/* Crossfade Duration Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Crossfade Transitions
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                {settings.crossfadeDuration === 0 ? 'Off (Gapless)' : `${settings.crossfadeDuration}s`}
              </span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              Smoothly blends out the ending song while ramping up the next song using dual Web Audio API GainNodes.
            </p>
            <input
              type="range"
              min="0"
              max="12"
              step="1"
              value={settings.crossfadeDuration}
              onChange={(e) => onUpdateSettings({ crossfadeDuration: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <div className="flex justify-between text-[10px] text-white/30 font-mono">
              <span>0s (Off)</span>
              <span>4s (Recommended)</span>
              <span>12s</span>
            </div>
          </div>

          {/* Smart Radio / Auto Queue */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="space-y-0.5 pr-4">
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-400" />
                Auto-Queue Smart Radio
              </span>
              <p className="text-xs text-white/50">
                Automatically fetches and queues similar songs when your queue reaches the end.
              </p>
            </div>
            <button
              onClick={() => onUpdateSettings({ autoQueueRadio: !settings.autoQueueRadio })}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                settings.autoQueueRadio ? 'bg-red-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform transform absolute top-0.5 ${
                  settings.autoQueueRadio ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Custom Backend API Server */}
          <div className="space-y-2 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                Backend API Server
              </span>
              {testStatus === 'testing' && (
                <span className="text-white/40 text-[11px]">Testing...</span>
              )}
              {testStatus === 'ok' && (
                <span className="text-emerald-400 text-[11px] flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              )}
              {testStatus === 'fail' && (
                <span className="text-red-400 text-[11px] flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> Unreachable
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Default is <code className="text-white/70">/api</code>. If hosting your dedicated Node.js backend on Render, paste its URL here (e.g. <code className="text-white/70">https://your-app.onrender.com</code>).
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. https://ytm-backend.onrender.com"
                value={apiUrl}
                onChange={(e) => {
                  setApiUrl(e.target.value);
                  setTestStatus('idle');
                }}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-red-500 transition-colors font-mono"
              />
              <button
                type="button"
                onClick={handleSaveApi}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-semibold text-white transition-all shrink-0"
              >
                Save & Test
              </button>
            </div>
          </div>

          {/* Architecture Badge */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5 text-xs text-white/60">
            <div className="flex items-center gap-2 text-white font-medium">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Full-Stack Architecture (Render / Vercel)</span>
            </div>
            <p className="text-[11px] text-white/40 leading-relaxed">
              Powered by InnerTube music search, LRCLIB synchronized lyrics, and browser dual-engine playback.
            </p>
          </div>
        </div>

        {/* Done button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 active:scale-98 transition-all"
        >
          Done
        </button>
      </div>
    </div>
  );
};

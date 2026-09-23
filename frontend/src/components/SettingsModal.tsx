import React from 'react';
import { X, Sliders, Radio, Server, Zap } from 'lucide-react';
import { PlayerSettings } from '../types';

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

          {/* Architecture Badge */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5 text-xs text-white/60">
            <div className="flex items-center gap-2 text-white font-medium">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Node.js / Render Architecture</span>
            </div>
            <p className="text-[11px] text-white/40 leading-relaxed">
              Powered by high-performance InnerTube music search, LRCLIB synced lyrics, and browser dual-engine playback.
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

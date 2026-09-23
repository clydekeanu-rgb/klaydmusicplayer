import React, { useState } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Volume2,
  VolumeX,
  Mic2,
  Disc3,
  ListMusic,
} from 'lucide-react';
import { Track, LyricsData, RepeatMode } from '../types';
import { LyricsView } from './LyricsView';

interface FullPlayerProps {
  currentTrack: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  isFav: boolean;
  lyrics: LyricsData | null;
  isLyricsLoading: boolean;
  onClose: () => void;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onToggleFavorite: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const FullPlayer: React.FC<FullPlayerProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isShuffle,
  repeatMode,
  isFav,
  lyrics,
  isLyricsLoading,
  onClose,
  onTogglePlay,
  onPrevious,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleShuffle,
  onCycleRepeat,
  onToggleFavorite,
}) => {
  const [viewMode, setViewMode] = useState<'art' | 'lyrics'>('art');
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-3xl flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Dynamic ambient backdrop glow */}
      <div
        className="absolute inset-0 opacity-40 blur-[140px] pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 40%, var(--theme-glow, rgba(239, 68, 68, 0.4)), transparent 70%)`,
        }}
      />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between z-10">
        <button
          onClick={onClose}
          className="p-3 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title="Minimize player"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        {/* Tab switch between Artwork & Lyrics */}
        <div className="flex items-center p-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
          <button
            onClick={() => setViewMode('art')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              viewMode === 'art'
                ? 'bg-white text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Disc3 className="w-3.5 h-3.5" />
            <span>Artwork</span>
          </button>
          <button
            onClick={() => setViewMode('lyrics')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              viewMode === 'lyrics'
                ? 'bg-white text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Mic2 className="w-3.5 h-3.5" />
            <span>Lyrics</span>
          </button>
        </div>

        <button
          onClick={onToggleFavorite}
          className="p-3 rounded-full text-white/60 hover:text-red-400 hover:bg-white/10 transition-colors"
          title="Toggle Favorite"
        >
          <Heart className={`w-6 h-6 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>

      {/* Center Content: Artwork or Lyrics */}
      <div className="flex-1 flex items-center justify-center my-6 z-10 max-h-[55vh] sm:max-h-[60vh] overflow-hidden">
        {viewMode === 'art' ? (
          <div className="relative group max-w-md w-full aspect-square flex items-center justify-center">
            {/* Ambient shadow */}
            <div
              className="absolute inset-4 rounded-3xl blur-2xl opacity-60 transition-all duration-700 pointer-events-none"
              style={{
                background: `var(--theme-glow, rgba(239, 68, 68, 0.5))`,
              }}
            />
            {/* Artwork Card */}
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className={`w-full h-full object-cover rounded-3xl shadow-2xl border border-white/10 transition-transform duration-700 ${
                isPlaying ? 'scale-100' : 'scale-95 opacity-90'
              }`}
            />
          </div>
        ) : (
          <div className="w-full max-w-2xl h-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <LyricsView
              lyrics={lyrics}
              isLoading={isLyricsLoading}
              currentTime={currentTime}
              onSeek={onSeek}
            />
          </div>
        )}
      </div>

      {/* Bottom Controls Area */}
      <div className="max-w-2xl w-full mx-auto space-y-5 z-10">
        {/* Track Title & Artist */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight line-clamp-1">
            {currentTrack.title}
          </h2>
          <p className="text-base sm:text-lg text-white/60 font-medium line-clamp-1">
            {currentTrack.artist}
          </p>
        </div>

        {/* Scrubber */}
        <div className="space-y-2">
          <div
            onClick={(e) => {
              if (duration <= 0) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              onSeek(pos * duration);
            }}
            className="h-2 w-full bg-white/10 hover:bg-white/20 rounded-full cursor-pointer overflow-hidden transition-all group"
          >
            <div
              className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full group-hover:brightness-125 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-white/40 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Transport Buttons */}
        <div className="flex items-center justify-center gap-6 sm:gap-8">
          <button
            onClick={onToggleShuffle}
            className={`p-3 rounded-full transition-colors ${
              isShuffle ? 'text-red-400 bg-red-500/10' : 'text-white/40 hover:text-white'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={onPrevious}
            className="p-3 text-white/80 hover:text-white transition-colors"
          >
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/20"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-1" />
            )}
          </button>

          <button
            onClick={onNext}
            className="p-3 text-white/80 hover:text-white transition-colors"
          >
            <SkipForward className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={onCycleRepeat}
            className={`p-3 rounded-full transition-colors ${
              repeatMode !== 'off' ? 'text-red-400 bg-red-500/10' : 'text-white/40 hover:text-white'
            }`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

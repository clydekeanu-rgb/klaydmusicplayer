import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  ListMusic,
  Maximize2,
  Heart,
  FileText,
  Loader2,
} from 'lucide-react';
import { Track, RepeatMode } from '../types';

interface PlayerBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  isFav: boolean;
  isLyricsOpen: boolean;
  isQueueOpen: boolean;
  queueLength: number;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onToggleFavorite: () => void;
  onToggleLyrics: () => void;
  onToggleQueue: () => void;
  onOpenFullPlayer: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  currentTrack,
  isPlaying,
  isBuffering,
  currentTime,
  duration,
  volume,
  isShuffle,
  repeatMode,
  isFav,
  isLyricsOpen,
  isQueueOpen,
  queueLength,
  onTogglePlay,
  onPrevious,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleShuffle,
  onCycleRepeat,
  onToggleFavorite,
  onToggleLyrics,
  onToggleQueue,
  onOpenFullPlayer,
}) => {
  const [isHoveringScrubber, setIsHoveringScrubber] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.8);
  const scrubberRef = useRef<HTMLDivElement>(null);

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || duration <= 0) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(pos * duration);
  };

  const handleToggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      onVolumeChange(0);
    } else {
      onVolumeChange(prevVolume || 0.8);
    }
  };

  return (
    <footer className="h-24 px-4 sm:px-6 bg-black/60 backdrop-blur-2xl border-t border-white/10 z-30 flex flex-col justify-center select-none relative">
      {/* Interactive Scrubber line right at top of player bar */}
      <div
        ref={scrubberRef}
        onClick={handleScrubberClick}
        onMouseEnter={() => setIsHoveringScrubber(true)}
        onMouseLeave={() => setIsHoveringScrubber(false)}
        className="absolute -top-1.5 left-0 right-0 h-3 cursor-pointer flex items-center group"
      >
        <div className="w-full h-1 group-hover:h-2 bg-white/10 transition-all rounded-full overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full transition-all duration-75 relative"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {/* Scrubber thumb */}
        <div
          className="absolute w-3 h-3 rounded-full bg-white shadow-lg pointer-events-none transition-transform -translate-x-1/2 scale-0 group-hover:scale-100"
          style={{ left: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Left: Track Info & Artwork */}
        <div className="flex items-center gap-3 min-w-0 w-1/4 sm:w-1/3">
          {currentTrack ? (
            <>
              <div
                onClick={onOpenFullPlayer}
                className="relative cursor-pointer group shrink-0"
              >
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className="w-13 h-13 rounded-xl object-cover shadow-lg border border-white/10 group-hover:opacity-80 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p
                  onClick={onOpenFullPlayer}
                  className="text-sm font-semibold text-white truncate cursor-pointer hover:underline"
                >
                  {currentTrack.title}
                </p>
                <p className="text-xs text-white/50 truncate">{currentTrack.artist}</p>
              </div>
              <button
                onClick={onToggleFavorite}
                className="p-2 text-white/50 hover:text-red-400 transition-colors shrink-0"
                title={isFav ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20">
                <Play className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm text-white/30 font-medium">Ready to play</p>
                <p className="text-xs text-white/20">Select a song from search or queue</p>
              </div>
            </div>
          )}
        </div>

        {/* Center: Playback Controls */}
        <div className="flex flex-col items-center gap-1.5 flex-1 max-w-md">
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              onClick={onToggleShuffle}
              className={`p-2 rounded-full transition-colors ${
                isShuffle ? 'text-red-400 bg-red-500/10' : 'text-white/40 hover:text-white'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={onPrevious}
              disabled={!currentTrack}
              className="p-2 text-white/70 hover:text-white disabled:opacity-30 transition-colors"
              title="Previous Track"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={onTogglePlay}
              disabled={!currentTrack}
              className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10 disabled:opacity-40 disabled:hover:scale-100"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isBuffering ? (
                <Loader2 className="w-5 h-5 animate-spin text-black" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={onNext}
              disabled={!currentTrack}
              className="p-2 text-white/70 hover:text-white disabled:opacity-30 transition-colors"
              title="Next Track"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={onCycleRepeat}
              className={`p-2 rounded-full transition-colors ${
                repeatMode !== 'off' ? 'text-red-400 bg-red-500/10' : 'text-white/40 hover:text-white'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Time indicator */}
          <div className="flex items-center gap-2 text-[11px] text-white/40 font-mono tracking-tight">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Volume & Drawer Toggles */}
        <div className="flex items-center justify-end gap-2.5 w-1/4 sm:w-1/3">
          {/* Synced lyrics toggle */}
          <button
            onClick={onToggleLyrics}
            className={`p-2.5 rounded-xl transition-all ${
              isLyricsOpen
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
            title="Toggle Synced Lyrics"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Queue toggle */}
          <button
            onClick={onToggleQueue}
            className={`relative p-2.5 rounded-xl transition-all ${
              isQueueOpen
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
            title="Toggle Queue"
          >
            <ListMusic className="w-4 h-4" />
            {queueLength > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-red-500 text-[10px] text-white font-bold">
                {queueLength}
              </span>
            )}
          </button>

          {/* Volume control */}
          <div className="hidden lg:flex items-center gap-2 ml-2">
            <button
              onClick={handleToggleMute}
              className="text-white/50 hover:text-white transition-colors"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

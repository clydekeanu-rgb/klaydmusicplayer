import React from 'react';
import { Play, Pause, Heart, Loader2 } from 'lucide-react';
import { Track } from '../types';

interface MobileMiniPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  isFav: boolean;
  onTogglePlay: () => void;
  onToggleFavorite: () => void;
  onOpenFullPlayer: () => void;
}

export const MobileMiniPlayer: React.FC<MobileMiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  isBuffering,
  currentTime,
  duration,
  isFav,
  onTogglePlay,
  onToggleFavorite,
  onOpenFullPlayer,
}) => {
  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      onClick={onOpenFullPlayer}
      className="md:hidden fixed bottom-[calc(3.75rem+max(0.5rem,env(safe-area-inset-bottom)))] left-3 right-3 z-40 bg-[#141420]/95 backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-2xl shadow-black/90 p-2 select-none cursor-pointer group active:scale-[0.99] transition-transform overflow-hidden"
    >
      <div className="flex items-center gap-3">
        {/* Album Artwork */}
        <div className="relative shrink-0">
          <img
            src={currentTrack.thumbnail}
            alt={currentTrack.title}
            className="w-11 h-11 rounded-xl object-cover shadow-md shadow-black/60 border border-white/10"
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-ping" />
            </div>
          )}
        </div>

        {/* Track Title & Artist */}
        <div className="min-w-0 flex-1 pr-1">
          <p className="text-xs font-bold text-white truncate leading-tight">
            {currentTrack.title}
          </p>
          <p className="text-[11px] text-white/50 truncate mt-0.5 font-medium">
            {currentTrack.artist}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Favorite button */}
          <button
            onClick={onToggleFavorite}
            aria-label="Toggle Favorite"
            className="p-2 text-white/40 hover:text-rose-400 active:scale-90 transition-transform"
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-90 transition-all shadow-md shadow-white/10 ml-0.5"
          >
            {isBuffering ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Mini Progress Scrubber Line at the bottom edge */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-red-500 via-rose-500 to-amber-400 transition-all duration-150"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

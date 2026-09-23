import React from 'react';
import { Track } from '../types';
import { Play, ListPlus, Heart, ListMusic } from 'lucide-react';

interface TrackListProps {
  tracks: Track[];
  currentTrackId?: string;
  isPlaying?: boolean;
  onPlay: (track: Track, index?: number) => void;
  onPlayNext: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onToggleFavorite?: (track: Track) => void;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  currentTrackId,
  isPlaying,
  onPlay,
  onPlayNext,
  onAddToQueue,
  onToggleFavorite,
}) => {
  return (
    <div className="space-y-1">
      {tracks.map((track, idx) => {
        const isCurrent = track.id === currentTrackId;

        return (
          <div
            key={`${track.id}-${idx}`}
            onClick={() => onPlay(track, idx)}
            className={`group flex items-center justify-between p-2.5 sm:px-3.5 rounded-2xl transition-all cursor-pointer select-none active:scale-[0.99] ${
              isCurrent
                ? 'bg-rose-500/15 border border-rose-500/25 text-white shadow-sm'
                : 'hover:bg-white/[0.05] text-white/90'
            }`}
          >
            {/* Left: Index / Play Icon + Artwork + Title */}
            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
              <span className="w-5 text-center text-xs font-mono text-white/30 group-hover:hidden shrink-0 hidden sm:block">
                {isCurrent && isPlaying ? (
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                ) : (
                  idx + 1
                )}
              </span>
              <span className="w-5 text-center hidden group-hover:sm:flex items-center justify-center shrink-0">
                <Play className="w-3.5 h-3.5 text-white fill-current" />
              </span>

              {/* Artwork */}
              <div className="relative shrink-0">
                <img
                  src={track.thumbnail}
                  alt={track.title}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover shadow-md shrink-0 bg-white/5 border border-white/10"
                  loading="lazy"
                />
                {isCurrent && (
                  <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                  </div>
                )}
              </div>

              {/* Title & Artist */}
              <div className="min-w-0 flex-1 pr-2">
                <p
                  className={`text-xs sm:text-sm font-semibold truncate leading-tight ${
                    isCurrent ? 'text-rose-400' : 'text-white'
                  }`}
                >
                  {track.title}
                </p>
                <p className="text-[11px] sm:text-xs text-white/50 truncate mt-0.5 font-medium">
                  {track.artist}
                </p>
              </div>
            </div>

            {/* Middle: Album (desktop only) */}
            <div className="hidden lg:block w-1/4 text-xs text-white/40 truncate pr-4">
              {track.album || 'Single'}
            </div>

            {/* Right: Duration & Quick Actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {track.duration && (
                <span className="text-[11px] sm:text-xs text-white/40 font-mono tracking-tight hidden sm:block">
                  {track.duration}
                </span>
              )}

              {/* Action buttons (Visible on touch/mobile, and on hover for desktop) */}
              <div className="flex items-center gap-0.5 sm:gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayNext(track);
                  }}
                  title="Play Next"
                  aria-label="Play Next"
                  className="p-1.5 sm:p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                >
                  <ListMusic className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToQueue(track);
                  }}
                  title="Add to Queue"
                  aria-label="Add to Queue"
                  className="p-1.5 sm:p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                >
                  <ListPlus className="w-4 h-4" />
                </button>
                {onToggleFavorite && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(track);
                    }}
                    title="Save to Favorites"
                    aria-label="Save to Favorites"
                    className="p-1.5 sm:p-2 rounded-xl text-white/50 hover:text-rose-400 hover:bg-white/10 active:scale-95 transition-all"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

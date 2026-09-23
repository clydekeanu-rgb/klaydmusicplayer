import React from 'react';
import { Track } from '../types';
import { Play, ListPlus, Heart, ListMusic } from 'lucide-react';

interface TrackListProps {
  tracks: Track[];
  currentTrackId?: string;
  isPlaying?: boolean;
  onPlay: (track: Track) => void;
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
            onClick={() => onPlay(track)}
            className={`group flex items-center justify-between p-2.5 sm:px-3.5 rounded-2xl transition-all cursor-pointer select-none ${
              isCurrent
                ? 'bg-red-500/10 border border-red-500/20 text-white'
                : 'hover:bg-white/5 text-white/90'
            }`}
          >
            {/* Left: Index / Play Icon + Artwork + Title */}
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <span className="w-5 text-center text-xs font-mono text-white/30 group-hover:hidden shrink-0">
                {isCurrent && isPlaying ? (
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                ) : (
                  idx + 1
                )}
              </span>
              <span className="w-5 text-center hidden group-hover:flex items-center justify-center shrink-0">
                <Play className="w-3.5 h-3.5 text-white fill-current" />
              </span>

              {/* Artwork */}
              <img
                src={track.thumbnail}
                alt={track.title}
                className="w-12 h-12 rounded-xl object-cover shadow-md shrink-0 bg-white/5"
                loading="lazy"
              />

              {/* Title & Artist */}
              <div className="min-w-0 flex-1 pr-2">
                <p
                  className={`text-sm font-semibold truncate ${
                    isCurrent ? 'text-red-400' : 'text-white group-hover:text-white'
                  }`}
                >
                  {track.title}
                </p>
                <p className="text-xs text-white/50 truncate mt-0.5">{track.artist}</p>
              </div>
            </div>

            {/* Middle: Album (desktop only) */}
            <div className="hidden md:block w-1/4 text-xs text-white/40 truncate pr-4">
              {track.album || 'Single'}
            </div>

            {/* Right: Duration & Quick Actions */}
            <div className="flex items-center gap-3 shrink-0">
              {track.duration && (
                <span className="text-xs text-white/40 font-mono">{track.duration}</span>
              )}

              {/* Action buttons on hover */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayNext(track);
                  }}
                  title="Play Next"
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ListMusic className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToQueue(track);
                  }}
                  title="Add to Queue"
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
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
                    className="p-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/10 transition-colors"
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

import React from 'react';
import { Track } from '../types';
import { Trash2, Music2, Radio } from 'lucide-react';

interface QueueDrawerProps {
  queue: Track[];
  currentIndex: number;
  onPlayTrack: (track: Track, index: number) => void;
  onRemoveTrack: (index: number) => void;
  onClearQueue: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  queue,
  currentIndex,
  onPlayTrack,
  onRemoveTrack,
  onClearQueue,
}) => {
  return (
    <div className="h-full flex flex-col bg-black/40 backdrop-blur-3xl border-l border-white/5 select-none overflow-hidden">
      {/* Drawer Header */}
      <div className="h-14 px-5 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <Music2 className="w-4 h-4 text-red-400" />
          <span>Playing Queue ({queue.length})</span>
        </div>
        {queue.length > 0 && (
          <button
            onClick={onClearQueue}
            className="text-xs text-white/50 hover:text-red-400 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {queue.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/30 text-center py-20">
            <Music2 className="w-12 h-12 stroke-[1.2] mb-3 text-white/20" />
            <p className="text-sm font-medium">Your queue is empty</p>
            <p className="text-xs text-white/40 mt-1">Search for songs to start playing</p>
          </div>
        ) : (
          queue.map((track, idx) => {
            const isCurrent = idx === currentIndex;
            const isPlayed = idx < currentIndex;

            return (
              <div
                key={`${track.id}-${idx}`}
                className={`group flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-red-500/15 border border-red-500/30 text-white'
                    : isPlayed
                    ? 'opacity-40 hover:opacity-80 hover:bg-white/5 text-white/70'
                    : 'hover:bg-white/5 text-white/90'
                }`}
              >
                {/* Thumbnail */}
                <div
                  onClick={() => onPlayTrack(track, idx)}
                  className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0"
                >
                  <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
                  {isCurrent && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div
                  onClick={() => onPlayTrack(track, idx)}
                  className="min-w-0 flex-1"
                >
                  <p className={`text-xs font-semibold truncate ${isCurrent ? 'text-red-400' : 'text-white'}`}>
                    {track.title}
                  </p>
                  <p className="text-[11px] text-white/50 truncate">{track.artist}</p>
                </div>

                {/* Duration */}
                {track.duration && (
                  <span className="text-[11px] text-white/40 font-mono shrink-0">
                    {track.duration}
                  </span>
                )}

                {/* Remove button on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveTrack(idx);
                  }}
                  className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  title="Remove from queue"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Auto-Queue Indicator */}
      <div className="p-3 border-t border-white/5 bg-white/[0.02] flex items-center justify-between text-xs text-white/50">
        <div className="flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          <span>Radio autoplay active</span>
        </div>
        <span className="text-[11px] text-white/30">Auto-fetches similar songs</span>
      </div>
    </div>
  );
};

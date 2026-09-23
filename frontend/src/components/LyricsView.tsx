import React, { useEffect, useRef, useState } from 'react';
import { LyricsData } from '../types';
import { Mic2, Loader2, Sparkles } from 'lucide-react';

interface LyricsViewProps {
  lyrics: LyricsData | null;
  isLoading: boolean;
  currentTime: number;
  onSeek: (time: number) => void;
  onClose?: () => void;
}

export const LyricsView: React.FC<LyricsViewProps> = ({
  lyrics,
  isLoading,
  currentTime,
  onSeek,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const scrollTimeoutRef = useRef<any>(null);

  const parsedLines = lyrics?.parsedLines || [];
  const hasSynced = parsedLines.length > 0;

  // Find active lyric index
  let activeIndex = -1;
  if (hasSynced) {
    for (let i = 0; i < parsedLines.length; i++) {
      if (currentTime >= parsedLines[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }
  }

  // Smooth auto-scroll active lyric to center
  useEffect(() => {
    if (userScrolled || activeIndex === -1 || !activeLineRef.current || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    const activeEl = activeLineRef.current;

    const targetTop = activeEl.offsetTop - container.clientHeight / 2 + activeEl.clientHeight / 2;
    container.scrollTo({
      top: Math.max(0, targetTop),
      behavior: 'smooth',
    });
  }, [activeIndex, userScrolled]);

  const handleUserScroll = () => {
    setUserScrolled(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setUserScrolled(false);
    }, 3500); // Resume auto-scroll after 3.5s of inactivity
  };

  return (
    <div className="h-full flex flex-col bg-black/40 backdrop-blur-3xl border-l border-white/5 select-none relative overflow-hidden">
      {/* Header */}
      <div className="h-14 px-6 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <Mic2 className="w-4 h-4 text-red-400" />
          <span>Live Lyrics</span>
          {hasSynced && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">
              Synced
            </span>
          )}
        </div>
        {userScrolled && (
          <button
            onClick={() => setUserScrolled(false)}
            className="text-[11px] text-white/50 hover:text-white flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full transition-colors"
          >
            <Sparkles className="w-3 h-3 text-red-400" />
            Resume Auto-scroll
          </button>
        )}
      </div>

      {/* Lyrics Content Container */}
      <div
        ref={containerRef}
        onScroll={handleUserScroll}
        className="flex-1 overflow-y-auto px-6 py-12 scroll-smooth no-scrollbar space-y-8"
      >
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-white/40 gap-3 py-20">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            <p className="text-sm">Fetching lyrics...</p>
          </div>
        ) : !lyrics?.found ? (
          <div className="h-full flex flex-col items-center justify-center text-white/30 text-center py-20">
            <Mic2 className="w-12 h-12 stroke-[1.2] mb-3 text-white/20" />
            <p className="text-base font-medium text-white/60">No lyrics available</p>
            <p className="text-xs text-white/40 mt-1">Enjoy the music!</p>
          </div>
        ) : hasSynced ? (
          parsedLines.map((line, idx) => {
            const isActive = idx === activeIndex;
            const isPassed = idx < activeIndex;

            return (
              <div
                key={`${line.time}-${idx}`}
                ref={isActive ? activeLineRef : null}
                onClick={() => onSeek(line.time)}
                className={`cursor-pointer transition-all duration-300 transform origin-left leading-relaxed ${
                  isActive
                    ? 'text-white text-2xl sm:text-3xl font-bold scale-105 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                    : isPassed
                    ? 'text-white/40 text-lg sm:text-xl font-medium hover:text-white/70'
                    : 'text-white/20 text-lg sm:text-xl font-medium hover:text-white/60'
                }`}
              >
                {line.text || '♪ ♪ ♪'}
              </div>
            );
          })
        ) : lyrics.plainLyrics ? (
          <div className="whitespace-pre-wrap text-white/70 text-lg leading-loose font-medium">
            {lyrics.plainLyrics}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-white/30 text-center py-20">
            <p className="text-base font-medium text-white/60">Instrumental track</p>
          </div>
        )}
      </div>
    </div>
  );
};

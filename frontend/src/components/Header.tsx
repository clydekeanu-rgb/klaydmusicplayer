import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Sliders, Music2 } from 'lucide-react';

interface HeaderProps {
  onSearch: (query: string) => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearch, onOpenSettings }) => {
  const [query, setQuery] = useState('');
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;
  const isUserTyping = useRef(false);

  // Debounced search ONLY when the user is actively typing
  useEffect(() => {
    if (!isUserTyping.current) return;

    const handler = setTimeout(() => {
      onSearchRef.current(query);
    }, 400);

    return () => clearTimeout(handler);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchRef.current(query);
    }
  };

  const handleClear = () => {
    setQuery('');
    isUserTyping.current = true;
    onSearchRef.current('');
  };

  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-xl z-20 sticky top-0">
      {/* Brand logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/20">
          <Music2 className="w-5 h-5 text-white" />
        </div>
        <div className="hidden sm:block">
          <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
            Aura <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-semibold border border-red-500/30">Player</span>
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-xl mx-4 sm:mx-8">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-white/40 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              isUserTyping.current = true;
              setQuery(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search songs, artists, albums (press Enter or type)..."
            className="w-full h-11 pl-11 pr-10 rounded-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-red-500/60 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/20 text-sm text-white placeholder-white/40 transition-all"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSettings}
          title="Player Settings"
          className="p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Sliders className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

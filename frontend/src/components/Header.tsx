import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Sliders } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  onSearch: (query: string) => void;
  onOpenSettings: () => void;
  showSearchBar?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  onOpenSettings,
  showSearchBar = true,
}) => {
  const [query, setQuery] = useState('');
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;
  const isUserTyping = useRef(false);

  // Debounced search when user types in the header search input
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
    <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-white/[0.06] bg-[#09090f]/80 backdrop-blur-2xl z-30 sticky top-0">
      {/* Brand logo */}
      <BrandLogo size="md" />

      {/* Desktop Search Bar (hidden on mobile, where Search is a dedicated BottomNav tab) */}
      {showSearchBar && (
        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full flex items-center">
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
              className="w-full h-10 pl-11 pr-10 rounded-full bg-white/[0.05] border border-white/10 hover:border-white/20 focus:border-rose-500/60 focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-xs sm:text-sm text-white placeholder-white/40 transition-all font-sans"
            />
            {query && (
              <button
                onClick={handleClear}
                aria-label="Clear search"
                className="absolute right-3 p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSettings}
          title="Player Settings"
          aria-label="Open Settings"
          className="p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
        >
          <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </header>
  );
};

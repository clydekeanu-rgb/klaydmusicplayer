import React, { useState, useEffect, useRef } from 'react';
import { usePlayer } from './state/usePlayerStore';
import { useColorExtractor } from './hooks/useColorExtractor';
import { searchTracks } from './services/api';
import { getFavorites, getHistory } from './services/storage';
import { Track } from './types';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { PlayerBar } from './components/PlayerBar';
import { BottomNav, MobileTab } from './components/BottomNav';
import { MobileMiniPlayer } from './components/MobileMiniPlayer';
import { TrackList } from './components/TrackList';
import { LyricsView } from './components/LyricsView';
import { QueueDrawer } from './components/QueueDrawer';
import { FullPlayer } from './components/FullPlayer';
import { SettingsModal } from './components/SettingsModal';
import {
  Sparkles,
  Compass,
  Heart,
  History,
  Loader2,
  Music2,
  Search as SearchIcon,
  X,
  Flame,
} from 'lucide-react';

const EXPLORE_SUGGESTIONS = [
  "Today's Top Hits",
  'Synthwave & Retrowave',
  'Lo-Fi Beats to Relax',
  'Electronic & EDM',
  'Acoustic Pop Hits',
  'Midnight Chill & Ambient',
];

const SEARCH_GENRES = [
  'Pop',
  'Hip-Hop',
  'Rock',
  'R&B',
  'Electronic',
  'Lo-Fi',
  'Indie',
  'Chillout',
  'Jazz',
  'Acoustic',
];

export function App() {
  const player = usePlayer();
  useColorExtractor(player.currentTrack?.thumbnail);

  const [activeTab, setActiveTab] = useState<NavTab>('explore');
  const [mobileTab, setMobileTab] = useState<MobileTab>('explore');
  const [librarySubTab, setLibrarySubTab] = useState<'favorites' | 'history'>('favorites');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [history, setHistory] = useState<Track[]>([]);

  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Load favorites & history from IndexedDB
  const refreshLibrary = React.useCallback(async () => {
    const [favs, hist] = await Promise.all([getFavorites(), getHistory()]);
    setFavorites(favs);
    setHistory(hist);
  }, []);

  useEffect(() => {
    refreshLibrary();
  }, [player.currentTrack?.id, player.isFav, refreshLibrary]);

  const handleSearch = React.useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchTracks(query);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError('No tracks found matching your query.');
      }
    } catch (e: any) {
      console.warn('Search error:', e);
      setSearchError(e.message || 'Could not connect to music search API.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Sync mobile bottom tab selection with active desktop tab
  const handleMobileTabSelect = (tab: MobileTab) => {
    setMobileTab(tab);
    if (tab === 'explore') {
      setActiveTab('explore');
    } else if (tab === 'search') {
      setActiveTab('explore');
      // Focus mobile search input if switching to search
      setTimeout(() => {
        mobileSearchInputRef.current?.focus();
      }, 100);
    } else if (tab === 'library') {
      setActiveTab(librarySubTab);
    } else if (tab === 'queue') {
      setActiveTab('queue');
    }
  };

  const handleDesktopTabSelect = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === 'explore') setMobileTab('explore');
    else if (tab === 'favorites' || tab === 'history') {
      setMobileTab('library');
      setLibrarySubTab(tab);
    } else if (tab === 'queue') setMobileTab('queue');
  };

  // Initial exploration search on mount
  useEffect(() => {
    handleSearch('Top Hits 2026');
  }, [handleSearch]);

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden text-white font-sans transition-colors duration-1000 bg-[#08080c]"
      style={{
        background: `radial-gradient(circle at 15% 15%, var(--theme-bg-start, #100b14) 0%, var(--theme-bg-end, #060609) 100%)`,
      }}
    >
      {/* Top Header */}
      <Header
        onSearch={(q) => {
          handleSearch(q);
          setActiveTab('explore');
          setMobileTab('explore');
        }}
        onOpenSettings={() => player.setIsSettingsOpen(true)}
      />

      {/* Main Body Area: Sidebar + Content Grid + Drawers */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar (Desktop Only) */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleDesktopTabSelect}
          favoritesCount={favorites.length}
          currentTrack={player.currentTrack}
          onOpenFullPlayer={() => player.setIsFullPlayerOpen(true)}
        />

        {/* Center Main Scrollable Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 space-y-6 pb-36 md:pb-8">
          {/* Mobile Dedicated Search View (When Mobile Search Tab is Active) */}
          {mobileTab === 'search' && (
            <div className="md:hidden space-y-4 animate-in fade-in duration-200">
              {/* Mobile Search Input */}
              <div className="relative flex items-center">
                <SearchIcon className="w-4 h-4 text-white/40 absolute left-4 pointer-events-none" />
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Songs, artists, podcasts..."
                  className="w-full h-11 pl-11 pr-10 rounded-2xl bg-white/[0.07] border border-white/10 focus:border-rose-500/70 focus:bg-white/[0.1] focus:outline-none text-sm text-white placeholder-white/40 transition-all font-sans"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearch('')}
                    aria-label="Clear search"
                    className="absolute right-3 p-1.5 rounded-full text-white/40 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Genre Discovery Tags */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                  Popular Categories
                </p>
                <div className="flex flex-wrap gap-2">
                  {SEARCH_GENRES.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => handleSearch(genre)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.05] border border-white/[0.08] hover:border-rose-500/40 hover:bg-rose-500/10 text-white/80 active:scale-95 transition-all"
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Results in Mobile Search Tab */}
              <div className="pt-2">
                {isSearching ? (
                  <div className="py-16 flex flex-col items-center justify-center text-white/40 gap-3">
                    <Loader2 className="w-7 h-7 animate-spin text-rose-500" />
                    <p className="text-xs">Searching music database...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <TrackList
                    tracks={searchResults}
                    currentTrackId={player.currentTrack?.id}
                    isPlaying={player.isPlaying}
                    onPlay={(t) => player.playTrack(t)}
                    onPlayNext={(t) => player.playNext(t)}
                    onAddToQueue={(t) => player.addToQueue(t)}
                    onToggleFavorite={() => refreshLibrary()}
                  />
                ) : searchError ? (
                  <div className="py-12 px-4 text-center space-y-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <p className="text-xs text-rose-300">{searchError}</p>
                    <button
                      onClick={() => player.setIsSettingsOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-red-500/20 text-xs font-semibold text-white border border-red-500/30"
                    >
                      Configure Backend URL
                    </button>
                  </div>
                ) : (
                  <div className="py-12 text-center text-white/30 text-xs">
                    Type a song or artist to begin searching
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Explore / Home View (When Not on Mobile Search Tab) */}
          {(mobileTab === 'explore' || mobileTab === 'queue' || mobileTab === 'library') && activeTab === 'explore' && (
            <div className="space-y-6">
              {/* Quick Suggestion Chips */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 select-none">
                {EXPLORE_SUGGESTIONS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleSearch(chip)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.05] border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.1] text-white/80 transition-all shrink-0 active:scale-95"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Section Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  {searchQuery ? (
                    <>
                      <Flame className="w-5 h-5 text-rose-500" />
                      <span>Results for &ldquo;{searchQuery}&rdquo;</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-5 h-5 text-rose-500" />
                      <span>Explore &amp; Discover</span>
                    </>
                  )}
                </h2>
                {searchResults.length > 0 && (
                  <button
                    onClick={() => player.addToQueue(searchResults)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    <span>Play All</span>
                  </button>
                )}
              </div>

              {/* Main Track List / States */}
              {isSearching ? (
                <div className="py-20 flex flex-col items-center justify-center text-white/40 gap-3">
                  <Loader2 className="w-7 h-7 animate-spin text-rose-500" />
                  <p className="text-xs sm:text-sm">Fetching songs...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <TrackList
                  tracks={searchResults}
                  currentTrackId={player.currentTrack?.id}
                  isPlaying={player.isPlaying}
                  onPlay={(t) => player.playTrack(t)}
                  onPlayNext={(t) => player.playNext(t)}
                  onAddToQueue={(t) => player.addToQueue(t)}
                  onToggleFavorite={() => refreshLibrary()}
                />
              ) : searchError ? (
                <div className="py-14 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
                  <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-rose-400">
                    <Music2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm text-white">Search Notice</h3>
                    <p className="text-xs text-white/60 leading-relaxed">{searchError}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSearch(searchQuery || 'Top Hits 2026')}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all"
                    >
                      Retry Search
                    </button>
                    <button
                      onClick={() => player.setIsSettingsOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-red-500/20 hover:bg-red-500/30 text-rose-300 border border-red-500/30 transition-all"
                    >
                      Configure Backend URL
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-white/30 text-center">
                  <Music2 className="w-12 h-12 mb-3 stroke-[1.2] text-white/20" />
                  <p className="text-sm">No songs found. Try searching above.</p>
                </div>
              )}
            </div>
          )}

          {/* Unified Library View (Mobile Tabs & Desktop Tabs) */}
          {(mobileTab === 'library' || activeTab === 'favorites' || activeTab === 'history') && mobileTab !== 'search' && mobileTab !== 'queue' && (
            <div className="space-y-5">
              {/* Segmented Library Pill Switcher (Favorites vs History) */}
              <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/[0.05] border border-white/[0.08] w-fit">
                <button
                  onClick={() => {
                    setLibrarySubTab('favorites');
                    setActiveTab('favorites');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    librarySubTab === 'favorites'
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${librarySubTab === 'favorites' ? 'fill-white' : ''}`} />
                  <span>Favorites ({favorites.length})</span>
                </button>
                <button
                  onClick={() => {
                    setLibrarySubTab('history');
                    setActiveTab('history');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    librarySubTab === 'history'
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Recently Played ({history.length})</span>
                </button>
              </div>

              {librarySubTab === 'favorites' ? (
                favorites.length > 0 ? (
                  <TrackList
                    tracks={favorites}
                    currentTrackId={player.currentTrack?.id}
                    isPlaying={player.isPlaying}
                    onPlay={(t) => player.playTrack(t)}
                    onPlayNext={(t) => player.playNext(t)}
                    onAddToQueue={(t) => player.addToQueue(t)}
                    onToggleFavorite={() => refreshLibrary()}
                  />
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center text-white/30 text-center">
                    <Heart className="w-12 h-12 mb-3 stroke-[1.2] text-white/20" />
                    <p className="text-sm font-medium">No favorite tracks yet</p>
                    <p className="text-xs text-white/40 mt-1">Tap the heart on any song to save it to klyd</p>
                  </div>
                )
              ) : history.length > 0 ? (
                <TrackList
                  tracks={history}
                  currentTrackId={player.currentTrack?.id}
                  isPlaying={player.isPlaying}
                  onPlay={(t) => player.playTrack(t)}
                  onPlayNext={(t) => player.playNext(t)}
                  onAddToQueue={(t) => player.addToQueue(t)}
                  onToggleFavorite={() => refreshLibrary()}
                />
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-white/30 text-center">
                  <History className="w-12 h-12 mb-3 stroke-[1.2] text-white/20" />
                  <p className="text-sm font-medium">No playback history yet</p>
                  <p className="text-xs text-white/40 mt-1">Songs you play will appear here</p>
                </div>
              )}
            </div>
          )}

          {/* Queue Tab View */}
          {(mobileTab === 'queue' || activeTab === 'queue') && mobileTab !== 'search' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Music2 className="w-5 h-5 text-rose-400" />
                  <span>Active Queue ({player.queue.length})</span>
                </h2>
                {player.queue.length > 0 && (
                  <button
                    onClick={() => player.clearQueue()}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-red-500/20 text-white/70 hover:text-rose-300 border border-white/5 transition-all"
                  >
                    Clear Queue
                  </button>
                )}
              </div>

              {player.queue.length > 0 ? (
                <TrackList
                  tracks={player.queue}
                  currentTrackId={player.currentTrack?.id}
                  isPlaying={player.isPlaying}
                  onPlay={(t, i) => player.playTrack(t, i)}
                  onPlayNext={(t) => player.playNext(t)}
                  onAddToQueue={(t) => player.addToQueue(t)}
                  onToggleFavorite={() => refreshLibrary()}
                />
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-white/30 text-center">
                  <Music2 className="w-12 h-12 mb-3 stroke-[1.2] text-white/20" />
                  <p className="text-sm font-medium">Queue is empty</p>
                  <p className="text-xs text-white/40 mt-1">Play or add songs from search to build your queue</p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Right Slide-out Drawer: Synced Lyrics (Desktop) */}
        {player.isLyricsOpen && (
          <aside className="w-80 lg:w-96 shrink-0 h-full animate-in slide-in-from-right duration-200 hidden md:block">
            <LyricsView
              lyrics={player.lyrics}
              isLoading={player.isLyricsLoading}
              currentTime={player.currentTime}
              onSeek={(t) => player.seek(t)}
              onClose={() => player.setIsLyricsOpen(false)}
            />
          </aside>
        )}

        {/* Right Slide-out Drawer: Queue (Desktop) */}
        {player.isQueueOpen && !player.isLyricsOpen && (
          <aside className="w-80 lg:w-96 shrink-0 h-full animate-in slide-in-from-right duration-200 hidden md:block">
            <QueueDrawer
              queue={player.queue}
              currentIndex={player.currentIndex}
              onPlayTrack={(t, i) => player.playTrack(t, i)}
              onRemoveTrack={(i) => player.removeFromQueue(i)}
              onClearQueue={() => player.clearQueue()}
            />
          </aside>
        )}
      </div>

      {/* Floating Mobile Mini Player (Mobile Only) */}
      <MobileMiniPlayer
        currentTrack={player.currentTrack}
        isPlaying={player.isPlaying}
        isBuffering={player.isBuffering}
        currentTime={player.currentTime}
        duration={player.duration}
        isFav={player.isFav}
        onTogglePlay={player.togglePlay}
        onToggleFavorite={player.toggleFavorite}
        onOpenFullPlayer={() => player.setIsFullPlayerOpen(true)}
      />

      {/* Mobile Fixed Bottom Navigation Bar (Mobile Only) */}
      <BottomNav
        activeTab={mobileTab}
        onSelectTab={handleMobileTabSelect}
        favoritesCount={favorites.length}
        queueCount={player.queue.length}
      />

      {/* Persistent Bottom Player Bar (Desktop Only) */}
      <PlayerBar
        currentTrack={player.currentTrack}
        isPlaying={player.isPlaying}
        isBuffering={player.isBuffering}
        currentTime={player.currentTime}
        duration={player.duration}
        volume={player.settings.volume}
        isShuffle={player.isShuffle}
        repeatMode={player.repeatMode}
        isFav={player.isFav}
        isLyricsOpen={player.isLyricsOpen}
        isQueueOpen={player.isQueueOpen}
        queueLength={player.queue.length}
        onTogglePlay={player.togglePlay}
        onPrevious={player.previousTrack}
        onNext={player.nextTrack}
        onSeek={player.seek}
        onVolumeChange={player.setVolume}
        onToggleShuffle={player.toggleShuffle}
        onCycleRepeat={player.cycleRepeat}
        onToggleFavorite={player.toggleFavorite}
        onToggleLyrics={() => {
          player.setIsLyricsOpen(!player.isLyricsOpen);
          if (!player.isLyricsOpen) player.setIsQueueOpen(false);
        }}
        onToggleQueue={() => {
          player.setIsQueueOpen(!player.isQueueOpen);
          if (!player.isQueueOpen) player.setIsLyricsOpen(false);
        }}
        onOpenFullPlayer={() => player.setIsFullPlayerOpen(true)}
      />

      {/* Fullscreen Player Modal / Mobile Bottom Sheet */}
      {player.isFullPlayerOpen && player.currentTrack && (
        <FullPlayer
          currentTrack={player.currentTrack}
          isPlaying={player.isPlaying}
          currentTime={player.currentTime}
          duration={player.duration}
          volume={player.settings.volume}
          isShuffle={player.isShuffle}
          repeatMode={player.repeatMode}
          isFav={player.isFav}
          lyrics={player.lyrics}
          isLyricsLoading={player.isLyricsLoading}
          onClose={() => player.setIsFullPlayerOpen(false)}
          onTogglePlay={player.togglePlay}
          onPrevious={player.previousTrack}
          onNext={player.nextTrack}
          onSeek={player.seek}
          onVolumeChange={player.setVolume}
          onToggleShuffle={player.toggleShuffle}
          onCycleRepeat={player.cycleRepeat}
          onToggleFavorite={player.toggleFavorite}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        settings={player.settings}
        isOpen={player.isSettingsOpen}
        onClose={() => player.setIsSettingsOpen(false)}
        onUpdateSettings={(newSettings) => {
          if (newSettings.crossfadeDuration !== undefined) {
            player.setCrossfadeDuration(newSettings.crossfadeDuration);
          }
        }}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { usePlayer } from './state/usePlayerStore';
import { useColorExtractor } from './hooks/useColorExtractor';
import { searchTracks } from './services/api';
import { getFavorites, getHistory } from './services/storage';
import { Track } from './types';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { PlayerBar } from './components/PlayerBar';
import { TrackList } from './components/TrackList';
import { LyricsView } from './components/LyricsView';
import { QueueDrawer } from './components/QueueDrawer';
import { FullPlayer } from './components/FullPlayer';
import { SettingsModal } from './components/SettingsModal';
import { Sparkles, Compass, Heart, History, Loader2, Music2 } from 'lucide-react';

const EXPLORE_SUGGESTIONS = [
  'Today\'s Top Hits',
  'Synthwave & Retrowave',
  'Lo-Fi Beats to Relax',
  'Electronic & EDM',
  'Acoustic Pop Hits',
  'Midnight Chill & Ambient',
];

export function App() {
  const player = usePlayer();
  useColorExtractor(player.currentTrack?.thumbnail);

  const [activeTab, setActiveTab] = useState<NavTab>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [history, setHistory] = useState<Track[]>([]);

  // Load favorites & history
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
    setActiveTab('explore');
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchTracks(query);
      setSearchResults(results);
    } catch (e) {
      console.warn('Search error:', e);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Initial exploration search on mount
  useEffect(() => {
    handleSearch('Top Hits 2026');
  }, [handleSearch]);

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden text-white font-sans transition-colors duration-1000"
      style={{
        background: `radial-gradient(circle at 10% 20%, var(--theme-bg-start, #120d14) 0%, var(--theme-bg-end, #060608) 100%)`,
      }}
    >
      {/* Top Header */}
      <Header
        onSearch={handleSearch}
        onOpenSettings={() => player.setIsSettingsOpen(true)}
      />

      {/* Main Body Area: Sidebar + Content + Side Panels */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          favoritesCount={favorites.length}
          currentTrack={player.currentTrack}
          onOpenFullPlayer={() => player.setIsFullPlayerOpen(true)}
        />

        {/* Center Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
          {/* Quick Suggestions Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 select-none">
            {EXPLORE_SUGGESTIONS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleSearch(chip)}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-white/80 transition-all shrink-0 active:scale-95"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Active Tab View */}
          {activeTab === 'explore' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-red-500" />
                  <span>{searchQuery ? `Results for "${searchQuery}"` : 'Explore Music'}</span>
                </h2>
                {searchResults.length > 0 && (
                  <button
                    onClick={() => player.addToQueue(searchResults)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-red-400" />
                    <span>Play All</span>
                  </button>
                )}
              </div>

              {isSearching ? (
                <div className="py-20 flex flex-col items-center justify-center text-white/40 gap-3">
                  <Loader2 className="w-7 h-7 animate-spin text-red-500" />
                  <p className="text-sm">Searching...</p>
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
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-white/30 text-center">
                  <Music2 className="w-12 h-12 mb-3 stroke-[1.2] text-white/20" />
                  <p className="text-sm">No songs found. Try a different query.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                <span>Saved Favorites ({favorites.length})</span>
              </h2>
              {favorites.length > 0 ? (
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
                  <p className="text-sm">No favorite tracks yet</p>
                  <p className="text-xs text-white/40 mt-1">Tap the heart icon on any song to save it</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <History className="w-5 h-5 text-red-400" />
                <span>Recently Played</span>
              </h2>
              {history.length > 0 ? (
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
                  <p className="text-sm">No playback history yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Music2 className="w-5 h-5 text-red-400" />
                <span>Up Next in Queue ({player.queue.length})</span>
              </h2>
              <TrackList
                tracks={player.queue}
                currentTrackId={player.currentTrack?.id}
                isPlaying={player.isPlaying}
                onPlay={(t) => player.playTrack(t)}
                onPlayNext={(t) => player.playNext(t)}
                onAddToQueue={(t) => player.addToQueue(t)}
                onToggleFavorite={() => refreshLibrary()}
              />
            </div>
          )}
        </main>

        {/* Right Slide-out Drawer: Synced Lyrics */}
        {player.isLyricsOpen && (
          <aside className="w-80 lg:w-96 shrink-0 h-full animate-in slide-in-from-right duration-200">
            <LyricsView
              lyrics={player.lyrics}
              isLoading={player.isLyricsLoading}
              currentTime={player.currentTime}
              onSeek={(t) => player.seek(t)}
              onClose={() => player.setIsLyricsOpen(false)}
            />
          </aside>
        )}

        {/* Right Slide-out Drawer: Queue */}
        {player.isQueueOpen && !player.isLyricsOpen && (
          <aside className="w-80 lg:w-96 shrink-0 h-full animate-in slide-in-from-right duration-200">
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

      {/* Persistent Bottom Player Bar */}
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

      {/* Fullscreen Player Modal */}
      {player.isFullPlayerOpen && player.currentTrack && (
        <FullPlayer
          currentTrack={player.currentTrack}
          isPlaying={player.isPlaying}
          currentTime={player.currentTime}
          duration={player.duration}
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

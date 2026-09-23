import { useState, useEffect, useRef } from 'react';
import { Track, LyricsData, RepeatMode, PlayerSettings } from '../types';
import { PlayerEngine, getPlayerEngine } from '../audio/PlayerEngine';
import { getTrackMetadata, getTrackLyrics, getRelatedTracks } from '../services/api';
import { updateMediaSession, updatePlaybackState, updatePositionState, syncAudioSession } from '../audio/mediaSession';
import {
  addToHistory,
  getSavedSettings,
  saveSettings,
  toggleFavorite,
  isFavorite,
} from '../services/storage';

export function usePlayer() {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [originalQueue, setOriginalQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [lyrics, setLyrics] = useState<LyricsData | null>(null);
  const [isLyricsLoading, setIsLyricsLoading] = useState(false);
  const [isFav, setIsFav] = useState(false);

  // UI state
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<PlayerSettings>(getSavedSettings);

  const engineRef = useRef<PlayerEngine | null>(null);
  const queueRef = useRef<Track[]>([]);
  const currentIndexRef = useRef(-1);
  const repeatModeRef = useRef<RepeatMode>('off');
  const settingsRef = useRef<PlayerSettings>(settings);
  const currentTrackRef = useRef<Track | null>(null);

  queueRef.current = queue;
  currentIndexRef.current = currentIndex;
  repeatModeRef.current = repeatMode;
  settingsRef.current = settings;
  currentTrackRef.current = currentTrack;

  // Initialize PlayerEngine
  useEffect(() => {
    const engine = getPlayerEngine({
      onTimeUpdate: (cur, dur) => {
        setCurrentTime(cur);
        setDuration(dur);
        updatePositionState(dur, 1, cur);
      },
      onEnded: () => {
        handleTrackEnded();
      },
      onTrackNearEnd: () => {
        handleTrackNearEnd();
      },
      onPlayStateChange: (playing, buffering) => {
        setIsPlaying(playing);
        setIsBuffering(buffering);
        updatePlaybackState(playing ? 'playing' : 'paused');
      },
      onError: (err) => {
        console.error('Player engine error:', err);
        setIsBuffering(false);
      },
    });

    engine.setVolume(settings.volume);
    engine.setCrossfadeDuration(settings.crossfadeDuration);
    engineRef.current = engine;
  }, []);

  // Update MediaSession metadata & handlers
  useEffect(() => {
    updateMediaSession(currentTrack, {
      onPlay: () => resume(),
      onPause: () => pause(),
      onPrevious: () => previousTrack(),
      onNext: () => nextTrack(true),
      onSeek: (details) => {
        if (details.seekTime !== undefined) {
          seek(details.seekTime);
        }
      },
    });

    if (currentTrack) {
      isFavorite(currentTrack.id).then(setIsFav);
      addToHistory(currentTrack);
      loadLyrics(currentTrack);
    } else {
      setLyrics(null);
      setIsFav(false);
    }
  }, [currentTrack]);

  // Load lyrics helper
  const loadLyrics = async (track: Track) => {
    setIsLyricsLoading(true);
    try {
      const data = await getTrackLyrics(track.title, track.artist, track.durationSeconds);
      setLyrics(data);
    } catch (e) {
      console.warn('Lyrics load failed:', e);
      setLyrics({
        trackName: track.title,
        artistName: track.artist,
        instrumental: false,
        parsedLines: [],
        found: false,
      });
    } finally {
      setIsLyricsLoading(false);
    }
  };

  // Play a specific track
  const playTrack = async (
    track: Track,
    queueIndex?: number,
    enableCrossfade = false
  ) => {
    try {
      // Synchronously unlock browser AudioContext & audio element on gesture
      engineRef.current?.unlock();
      syncAudioSession(true);

      setIsBuffering(true);
      setCurrentTrack(track);

      if (queueIndex !== undefined) {
        setCurrentIndex(queueIndex);
      } else {
        // If not in queue, add as next or append
        const q = queueRef.current;
        const existingIdx = q.findIndex(t => t.id === track.id);
        if (existingIdx !== -1) {
          setCurrentIndex(existingIdx);
        } else {
          const newQueue = [...q, track];
          setQueue(newQueue);
          setCurrentIndex(newQueue.length - 1);
        }
      }

      // Start audio playback directly via Dual-IFrame engine
      if (engineRef.current) {
        await engineRef.current.playTrack(track.id, enableCrossfade);
      }

      // Enrich metadata in the background (non-blocking)
      getTrackMetadata(track.id).then(meta => {
        if (meta) {
          if (meta.durationSeconds && !track.durationSeconds) {
            track.durationSeconds = meta.durationSeconds;
            setDuration(meta.durationSeconds);
          }
        }
      }).catch(() => {});
    } catch (err) {
      console.error('Failed to play track:', err);
      setIsBuffering(false);
    }
  };

  const togglePlay = () => {
    if (!engineRef.current || !currentTrack) return;
    if (isPlaying) {
      engineRef.current.pause();
    } else {
      engineRef.current.resume();
    }
  };

  const pause = () => {
    engineRef.current?.pause();
  };

  const resume = () => {
    engineRef.current?.resume();
  };

  const seek = (seconds: number) => {
    engineRef.current?.seek(seconds);
    setCurrentTime(seconds);
  };

  const setVolume = (val: number) => {
    const updated = { ...settings, volume: val };
    setSettings(updated);
    saveSettings(updated);
    engineRef.current?.setVolume(val);
  };

  const setCrossfadeDuration = (seconds: number) => {
    const updated = { ...settings, crossfadeDuration: seconds };
    setSettings(updated);
    saveSettings(updated);
    engineRef.current?.setCrossfadeDuration(seconds);
  };

  // Next track
  const nextTrack = (manual = false, enableCrossfade = false) => {
    const q = queueRef.current;
    const curIdx = currentIndexRef.current;
    const rep = repeatModeRef.current;

    if (rep === 'one' && !manual) {
      // Repeat current track
      if (currentTrackRef.current) {
        seek(0);
        resume();
        return;
      }
    }

    if (curIdx + 1 < q.length) {
      const nextIdx = curIdx + 1;
      playTrack(q[nextIdx], nextIdx, enableCrossfade);
    } else if (rep === 'all' && q.length > 0) {
      playTrack(q[0], 0, enableCrossfade);
    } else {
      // Near end of queue: if autoQueueRadio is enabled, fetch related tracks
      if (settingsRef.current.autoQueueRadio && currentTrackRef.current) {
        getRelatedTracks(currentTrackRef.current.id).then(related => {
          if (related.length > 0) {
            const newTracks = related.filter(r => !q.some(existing => existing.id === r.id));
            if (newTracks.length > 0) {
              const updatedQueue = [...q, ...newTracks];
              setQueue(updatedQueue);
              playTrack(newTracks[0], q.length, enableCrossfade);
            }
          }
        });
      }
    }
  };

  // Previous track
  const previousTrack = () => {
    if (currentTime > 3) {
      seek(0);
      return;
    }
    const q = queueRef.current;
    const curIdx = currentIndexRef.current;
    if (curIdx > 0) {
      const prevIdx = curIdx - 1;
      playTrack(q[prevIdx], prevIdx, false);
    } else {
      seek(0);
    }
  };

  const handleTrackEnded = () => {
    nextTrack(false, false);
  };

  const handleTrackNearEnd = () => {
    // If crossfade is enabled, trigger crossfade transition
    if (settingsRef.current.crossfadeDuration > 0) {
      const q = queueRef.current;
      const curIdx = currentIndexRef.current;
      if (curIdx + 1 < q.length) {
        nextTrack(false, true);
      }
    }
  };

  // Shuffle toggle (Fisher-Yates)
  const toggleShuffle = () => {
    if (!isShuffle) {
      // Turn shuffle on: preserve original queue
      setOriginalQueue([...queue]);
      const current = currentTrackRef.current;
      const remaining = queue.filter(t => t.id !== current?.id);

      // Fisher-Yates shuffle
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
      }

      const shuffled = current ? [current, ...remaining] : remaining;
      setQueue(shuffled);
      setCurrentIndex(0);
      setIsShuffle(true);
    } else {
      // Turn shuffle off: restore original queue
      const current = currentTrackRef.current;
      const restored = [...originalQueue];
      const newIdx = current ? restored.findIndex(t => t.id === current.id) : 0;
      setQueue(restored);
      setCurrentIndex(newIdx !== -1 ? newIdx : 0);
      setIsShuffle(false);
    }
  };

  // Repeat cycle: off -> all -> one -> off
  const cycleRepeat = () => {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const nextMode = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  // Queue actions
  const addToQueue = (tracks: Track | Track[]) => {
    const toAdd = Array.isArray(tracks) ? tracks : [tracks];
    setQueue(prev => [...prev, ...toAdd]);
    if (!currentTrack && toAdd.length > 0) {
      playTrack(toAdd[0], 0);
    }
  };

  const playNext = (track: Track) => {
    const q = [...queue];
    const curIdx = currentIndexRef.current;
    q.splice(curIdx + 1, 0, track);
    setQueue(q);
  };

  const removeFromQueue = (index: number) => {
    const q = [...queue];
    q.splice(index, 1);
    setQueue(q);
    if (index < currentIndex) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const clearQueue = () => {
    if (currentTrack) {
      setQueue([currentTrack]);
      setCurrentIndex(0);
    } else {
      setQueue([]);
      setCurrentIndex(-1);
    }
  };

  const toggleFav = async () => {
    if (!currentTrack) return;
    const newState = await toggleFavorite(currentTrack);
    setIsFav(newState);
  };

  return {
    currentTrack,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    queue,
    currentIndex,
    isShuffle,
    repeatMode,
    lyrics,
    isLyricsLoading,
    isFav,
    settings,

    // UI state toggles
    isFullPlayerOpen,
    setIsFullPlayerOpen,
    isQueueOpen,
    setIsQueueOpen,
    isLyricsOpen,
    setIsLyricsOpen,
    isSettingsOpen,
    setIsSettingsOpen,

    // Controls
    playTrack,
    togglePlay,
    pause,
    resume,
    seek,
    setVolume,
    setCrossfadeDuration,
    nextTrack: () => nextTrack(true, false),
    previousTrack,
    toggleShuffle,
    cycleRepeat,
    addToQueue,
    playNext,
    removeFromQueue,
    clearQueue,
    toggleFavorite: toggleFav,
    unlock: () => engineRef.current?.unlock(),
  };
}

export type PlayerContextType = ReturnType<typeof usePlayer>;

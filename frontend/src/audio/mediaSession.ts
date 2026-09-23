import { Track } from '../types';

// Minimal silent WAV data URI to keep the mobile OS audio session alive in background
const SILENT_AUDIO_URI =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

let silentAudio: HTMLAudioElement | null = null;

function getSilentAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
  if (!silentAudio) {
    try {
      silentAudio = new Audio(SILENT_AUDIO_URI);
      silentAudio.loop = true;
      (silentAudio as any).playsInline = true;
      silentAudio.volume = 0.01;
    } catch {
      silentAudio = null;
    }
  }
  return silentAudio;
}

export function syncAudioSession(playing: boolean): void {
  const audio = getSilentAudio();
  if (!audio) return;
  try {
    if (playing) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  } catch {}
}

export function updateMediaSession(
  track: Track | null,
  handlers: {
    onPlay: () => void;
    onPause: () => void;
    onPrevious: () => void;
    onNext: () => void;
    onSeek: (details: MediaSessionActionDetails) => void;
  }
): void {
  if (!('mediaSession' in navigator)) return;

  if (!track) {
    navigator.mediaSession.metadata = null;
    syncAudioSession(false);
    return;
  }

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist,
    album: track.album || 'YouTube Music',
    artwork: [
      { src: track.thumbnail, sizes: '96x96', type: 'image/jpeg' },
      { src: track.thumbnail, sizes: '128x128', type: 'image/jpeg' },
      { src: track.thumbnail, sizes: '192x192', type: 'image/jpeg' },
      { src: track.thumbnail, sizes: '256x256', type: 'image/jpeg' },
      { src: track.thumbnail, sizes: '512x512', type: 'image/jpeg' },
    ],
  });

  navigator.mediaSession.setActionHandler('play', () => {
    syncAudioSession(true);
    handlers.onPlay();
  });
  navigator.mediaSession.setActionHandler('pause', () => {
    syncAudioSession(false);
    handlers.onPause();
  });
  navigator.mediaSession.setActionHandler('previoustrack', handlers.onPrevious);
  navigator.mediaSession.setActionHandler('nexttrack', handlers.onNext);
  navigator.mediaSession.setActionHandler('seekto', handlers.onSeek);
}

export function updatePlaybackState(state: 'playing' | 'paused' | 'none'): void {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = state;
  }
  syncAudioSession(state === 'playing');
}

export function updatePositionState(duration: number, playbackRate = 1, position = 0): void {
  if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
    if (duration > 0 && position <= duration) {
      try {
        navigator.mediaSession.setPositionState({
          duration,
          playbackRate,
          position,
        });
      } catch (e) {
        // ignore position out of bounds
      }
    }
  }
}

import { Track } from '../types';

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

  navigator.mediaSession.setActionHandler('play', handlers.onPlay);
  navigator.mediaSession.setActionHandler('pause', handlers.onPause);
  navigator.mediaSession.setActionHandler('previoustrack', handlers.onPrevious);
  navigator.mediaSession.setActionHandler('nexttrack', handlers.onNext);
  navigator.mediaSession.setActionHandler('seekto', handlers.onSeek);
}

export function updatePlaybackState(state: 'playing' | 'paused' | 'none'): void {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = state;
  }
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

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: string;
  durationSeconds?: number;
  thumbnail: string;
  streamUrl?: string;
  proxyUrl?: string;
}

export interface LyricLine {
  time: number;
  text: string;
}

export interface LyricsData {
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  instrumental: boolean;
  plainLyrics?: string;
  syncedLyrics?: string;
  parsedLines: LyricLine[];
  found: boolean;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlayerSettings {
  crossfadeDuration: number; // in seconds (0 to 12)
  audioQuality: 'auto' | 'high' | 'medium';
  volume: number; // 0 to 1
  autoQueueRadio: boolean;
}

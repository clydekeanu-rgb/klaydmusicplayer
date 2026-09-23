export interface TrackItem {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: string;
  durationSeconds?: number;
  thumbnail: string;
  thumbnails?: Array<{ url: string; width?: number; height?: number }>;
}

export interface StreamResponse {
  id: string;
  streamUrl: string;
  proxyUrl: string;
  mimeType: string;
  bitrate: number;
  itag: number;
  audioQuality: string;
  durationSeconds?: number;
}

export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface LyricsResponse {
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  instrumental: boolean;
  plainLyrics?: string;
  syncedLyrics?: string;
  parsedLines?: LyricLine[];
}

export interface WorkerEnv {
  ENVIRONMENT?: string;
  MUSIC_CACHE?: KVNamespace;
}

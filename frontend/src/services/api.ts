import { Track, LyricsData } from '../types';

export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('ytm_api_base');
    if (custom && custom.trim()) {
      const trimmed = custom.trim();
      return trimmed.endsWith('/api') ? trimmed : `${trimmed.replace(/\/$/, '')}/api`;
    }
  }
  const envApi = (import.meta as any).env?.VITE_API_BASE;
  if (envApi && envApi.trim()) {
    const trimmed = envApi.trim();
    return trimmed.endsWith('/api') ? trimmed : `${trimmed.replace(/\/$/, '')}/api`;
  }
  return '/api';
}

export function setCustomApiBase(url: string | null): void {
  if (typeof window === 'undefined') return;
  if (!url || !url.trim()) {
    localStorage.removeItem('ytm_api_base');
  } else {
    localStorage.setItem('ytm_api_base', url.trim());
  }
}

export async function searchTracks(query: string): Promise<Track[]> {
  if (!query.trim()) return [];
  const base = getApiBase();
  const res = await fetch(`${base}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    throw new Error(`Search failed: HTTP ${res.status} ${res.statusText}`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('API returned an HTML response instead of JSON. Ensure your API backend is running or set the API base URL in Settings.');
  }
  const data = await res.json();
  return data.results || [];
}

export async function getTrackStream(id: string): Promise<{
  streamUrl: string;
  proxyUrl: string;
  bitrate: number;
  mimeType: string;
  durationSeconds?: number;
}> {
  const base = getApiBase();
  const res = await fetch(`${base}/stream/${id}`);
  if (!res.ok) throw new Error(`Stream lookup failed: ${res.statusText}`);
  return await res.json();
}

export async function getTrackMetadata(id: string): Promise<Track> {
  const base = getApiBase();
  const res = await fetch(`${base}/metadata/${id}`);
  if (!res.ok) throw new Error(`Metadata lookup failed: ${res.statusText}`);
  const data = await res.json();
  return data.metadata;
}

export async function getTrackLyrics(title: string, artist?: string, duration?: number): Promise<LyricsData> {
  const base = getApiBase();
  let url = `${base}/lyrics?title=${encodeURIComponent(title)}`;
  if (artist) url += `&artist=${encodeURIComponent(artist)}`;
  if (duration) url += `&duration=${encodeURIComponent(Math.round(duration))}`;

  try {
    const res = await fetch(url);
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return await res.json();
      }
    }
  } catch (e) {
    console.warn('Backend lyrics fetch failed, trying direct LRCLIB fallback...', e);
  }

  // Direct client fallback to LRCLIB
  try {
    const cleanTitle = title
      .replace(/\s*\([^)]*(?:official|video|audio|lyrics|feat|ft|remastered)[^)]*\)/gi, '')
      .replace(/\s*\[[^\]]*(?:official|video|audio|lyrics|feat|ft|remastered)[^\]]*\]/gi, '')
      .trim();
    let lrcUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}`;
    if (artist) lrcUrl += `&artist_name=${encodeURIComponent(artist)}`;
    if (duration) lrcUrl += `&duration=${encodeURIComponent(Math.round(duration))}`;

    const res = await fetch(lrcUrl);
    if (res.ok) {
      const data = await res.json();
      const lines = data.syncedLyrics ? parseLrc(data.syncedLyrics) : [];
      return {
        trackName: data.trackName || cleanTitle,
        artistName: data.artistName || artist || '',
        albumName: data.albumName,
        duration: data.duration,
        instrumental: !!data.instrumental,
        plainLyrics: data.plainLyrics,
        syncedLyrics: data.syncedLyrics,
        parsedLines: lines,
        found: !!(data.syncedLyrics || data.plainLyrics),
      };
    }
  } catch (err) {
    console.warn('Direct LRCLIB fetch failed:', err);
  }

  return {
    trackName: title,
    artistName: artist || '',
    instrumental: false,
    parsedLines: [],
    found: false,
  };
}

function parseLrc(lrcText: string): Array<{ time: number; text: string }> {
  const lines = lrcText.split(/\r?\n/);
  const result: Array<{ time: number; text: string }> = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    timeRegex.lastIndex = 0;
    const matches = [...trimmed.matchAll(timeRegex)];
    if (matches.length > 0) {
      const text = trimmed.replace(timeRegex, '').trim();
      for (const match of matches) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const msPart = match[3];
        const ms = msPart.length === 2 ? parseInt(msPart, 10) * 10 : parseInt(msPart, 10);
        result.push({ time: minutes * 60 + seconds + ms / 1000, text });
      }
    }
  }
  result.sort((a, b) => a.time - b.time);
  return result;
}

export async function getRelatedTracks(id: string): Promise<Track[]> {
  const base = getApiBase();
  const res = await fetch(`${base}/related/${id}`);
  if (!res.ok) return [];
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return [];
  const data = await res.json();
  return data.results || [];
}

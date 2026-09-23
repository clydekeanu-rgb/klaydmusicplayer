import { Track, LyricsData } from '../types';

const envApi = (import.meta as any).env?.VITE_API_BASE;
const API_BASE = envApi
  ? (envApi.endsWith('/api') ? envApi : `${envApi.replace(/\/$/, '')}/api`)
  : '/api';

export async function searchTracks(query: string): Promise<Track[]> {
  if (!query.trim()) return [];
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);
  const data = await res.json();
  return data.results || [];
}

export async function getTrackMetadata(id: string): Promise<Track> {
  const res = await fetch(`${API_BASE}/metadata/${id}`);
  if (!res.ok) throw new Error(`Metadata lookup failed: ${res.statusText}`);
  const data = await res.json();
  return data.metadata;
}

export async function getTrackLyrics(title: string, artist?: string, duration?: number): Promise<LyricsData> {
  let url = `${API_BASE}/lyrics?title=${encodeURIComponent(title)}`;
  if (artist) url += `&artist=${encodeURIComponent(artist)}`;
  if (duration) url += `&duration=${encodeURIComponent(Math.round(duration))}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Lyrics lookup failed: ${res.statusText}`);
  return await res.json();
}

export async function getRelatedTracks(id: string): Promise<Track[]> {
  const res = await fetch(`${API_BASE}/related/${id}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

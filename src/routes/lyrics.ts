import { jsonResponse, errorResponse } from '../utils/cors';
import { getCached, setCached } from '../utils/cache';
import { LyricLine, LyricsResponse, WorkerEnv } from '../types';

function parseLrc(lrcText: string): LyricLine[] {
  const lines = lrcText.split(/\r?\n/);
  const result: LyricLine[] = [];
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
        const milliseconds = msPart.length === 2 ? parseInt(msPart, 10) * 10 : parseInt(msPart, 10);
        const timeInSeconds = minutes * 60 + seconds + milliseconds / 1000;
        result.push({ time: timeInSeconds, text });
      }
    }
  }

  // Sort chronologically
  result.sort((a, b) => a.time - b.time);
  return result;
}

export async function handleLyrics(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url);
  const title = url.searchParams.get('title')?.trim() || '';
  const artist = url.searchParams.get('artist')?.trim() || '';
  const duration = url.searchParams.get('duration')?.trim() || '';

  if (!title) {
    return errorResponse('Missing "title" parameter', 400);
  }

  const cleanTitle = title
    .replace(/\s*\([^)]*(?:official|video|audio|lyrics|feat|ft|remastered)[^)]*\)/gi, '')
    .replace(/\s*\[[^\]]*(?:official|video|audio|lyrics|feat|ft|remastered)[^\]]*\]/gi, '')
    .trim();

  const cacheKey = `lyrics:${cleanTitle.toLowerCase()}:${artist.toLowerCase()}`;
  const cached = await getCached<LyricsResponse>(env, cacheKey);
  if (cached) {
    return jsonResponse({ ...cached, cached: true });
  }

  try {
    const headers = {
      'User-Agent': 'YTM-WebPlayer/1.0.0 (https://github.com/example/player)',
    };

    // 1. Try exact get endpoint
    let getUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}`;
    if (artist) getUrl += `&artist_name=${encodeURIComponent(artist)}`;
    if (duration) getUrl += `&duration=${encodeURIComponent(duration)}`;

    let response = await fetch(getUrl, { headers });
    let data: any = null;

    if (response.ok) {
      data = await response.json();
    } else {
      // 2. Fallback to search endpoint
      const searchQuery = `${cleanTitle} ${artist}`.trim();
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`;
      const searchRes = await fetch(searchUrl, { headers });
      if (searchRes.ok) {
        const searchList = await searchRes.json();
        if (Array.isArray(searchList) && searchList.length > 0) {
          data = searchList[0];
        }
      }
    }

    if (!data || (!data.syncedLyrics && !data.plainLyrics)) {
      return jsonResponse({
        trackName: cleanTitle,
        artistName: artist,
        instrumental: false,
        plainLyrics: undefined,
        syncedLyrics: undefined,
        parsedLines: [],
        found: false,
      });
    }

    const parsedLines = data.syncedLyrics ? parseLrc(data.syncedLyrics) : [];

    const lyricsData: LyricsResponse & { found: boolean } = {
      trackName: data.trackName || cleanTitle,
      artistName: data.artistName || artist,
      albumName: data.albumName,
      duration: data.duration,
      instrumental: !!data.instrumental,
      plainLyrics: data.plainLyrics,
      syncedLyrics: data.syncedLyrics,
      parsedLines,
      found: true,
    };

    // Cache for 1 hour
    await setCached(env, cacheKey, lyricsData, 3600);

    return jsonResponse({ ...lyricsData, cached: false });
  } catch (err: any) {
    console.error('Lyrics error:', err);
    return errorResponse(`Failed to fetch lyrics: ${err.message || err}`, 500);
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

function parseLrc(lrcText: string) {
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
        const milliseconds = msPart.length === 2 ? parseInt(msPart, 10) * 10 : parseInt(msPart, 10);
        const timeInSeconds = minutes * 60 + seconds + milliseconds / 1000;
        result.push({ time: timeInSeconds, text });
      }
    }
  }

  result.sort((a, b) => a.time - b.time);
  return result;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const title = typeof req.query.title === 'string' ? req.query.title.trim() : '';
  const artist = typeof req.query.artist === 'string' ? req.query.artist.trim() : '';
  const duration = typeof req.query.duration === 'string' ? req.query.duration.trim() : '';

  if (!title) {
    return res.status(400).json({ error: 'Missing title parameter' });
  }

  const cleanTitle = title
    .replace(/\s*\([^)]*(?:official|video|audio|lyrics|feat|ft|remastered)[^)]*\)/gi, '')
    .replace(/\s*\[[^\]]*(?:official|video|audio|lyrics|feat|ft|remastered)[^\]]*\]/gi, '')
    .trim();

  try {
    const headers = {
      'User-Agent': 'Aura-Music-Player/1.0.0',
    };

    let getUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}`;
    if (artist) getUrl += `&artist_name=${encodeURIComponent(artist)}`;
    if (duration) getUrl += `&duration=${encodeURIComponent(duration)}`;

    let response = await fetch(getUrl, { headers });
    let data: any = null;

    if (response.ok) {
      data = await response.json();
    } else {
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
      return res.status(200).json({
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

    return res.status(200).json({
      trackName: data.trackName || cleanTitle,
      artistName: data.artistName || artist,
      albumName: data.albumName,
      duration: data.duration,
      instrumental: !!data.instrumental,
      plainLyrics: data.plainLyrics,
      syncedLyrics: data.syncedLyrics,
      parsedLines,
      found: true,
    });
  } catch (err: any) {
    console.error('Lyrics error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch lyrics' });
  }
}

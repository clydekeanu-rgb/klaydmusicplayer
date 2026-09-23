import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getYtMusic } from './lib/yt';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter "q"' });
  }

  try {
    const yt = await getYtMusic();
    const searchResults = await yt.music.search(q, { type: 'song' });

    const tracks: any[] = [];
    const contents = searchResults.contents || (searchResults.songs ? [searchResults.songs] : []);

    for (const shelf of contents) {
      const items = (shelf as any).contents || [];
      for (const item of items) {
        if (!item.id && !item.endpoint?.payload?.videoId) continue;
        const id = item.id || item.endpoint?.payload?.videoId;
        const title = item.title?.toString() || 'Unknown Title';
        const artist = Array.isArray(item.artists)
          ? item.artists.map((a: any) => a.name).join(', ')
          : item.artist?.name || item.author?.name || 'Unknown Artist';
        const album = item.album?.name || undefined;
        const duration = item.duration?.text || undefined;
        const durationSeconds = item.duration?.seconds || undefined;

        const thumbnails = item.thumbnails || (item.thumbnail?.thumbnails) || [];
        let bestThumbnail = '';
        if (Array.isArray(thumbnails) && thumbnails.length > 0) {
          bestThumbnail = thumbnails[thumbnails.length - 1]?.url || '';
        }
        if (!bestThumbnail && id) {
          bestThumbnail = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
        }
        if (bestThumbnail.startsWith('//')) {
          bestThumbnail = 'https:' + bestThumbnail;
        }

        tracks.push({
          id,
          title,
          artist,
          album,
          duration,
          durationSeconds,
          thumbnail: bestThumbnail,
          thumbnails,
        });
      }
    }

    return res.status(200).json({ results: tracks });
  } catch (err: any) {
    console.error('Search error:', err);
    return res.status(500).json({ error: err.message || 'Search failed', results: [] });
  }
}

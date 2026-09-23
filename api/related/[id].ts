import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getYtMusic } from '../lib/yt';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { id } = req.query;
  const videoId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
  if (!videoId) {
    return res.status(400).json({ error: 'Missing videoId' });
  }

  try {
    const yt = await getYtMusic();
    const upNext = await yt.music.getUpNext(videoId);

    const tracks: any[] = [];
    const contents = upNext.contents || [];

    for (const rawItem of contents) {
      const it = rawItem as any;
      if (!it.id && !it.endpoint?.payload?.videoId) continue;
      const trackId = it.id || it.endpoint?.payload?.videoId;
      if (trackId === videoId) continue;

      const title = it.title?.toString() || 'Unknown Title';
      const artist = Array.isArray(it.artists)
        ? it.artists.map((a: any) => a.name).join(', ')
        : it.artist?.name || it.author?.name || 'Unknown Artist';
      const album = it.album?.name || undefined;
      const duration = it.duration?.text || undefined;
      const durationSeconds = it.duration?.seconds || undefined;

      const thumbnails = it.thumbnails || (it.thumbnail?.thumbnails) || [];
      let bestThumbnail = '';
      if (Array.isArray(thumbnails) && thumbnails.length > 0) {
        bestThumbnail = thumbnails[thumbnails.length - 1]?.url || '';
      }
      if (!bestThumbnail && trackId) {
        bestThumbnail = `https://i.ytimg.com/vi/${trackId}/hqdefault.jpg`;
      }
      if (bestThumbnail.startsWith('//')) {
        bestThumbnail = 'https:' + bestThumbnail;
      }

      tracks.push({
        id: trackId,
        title,
        artist,
        album,
        duration,
        durationSeconds,
        thumbnail: bestThumbnail,
        thumbnails,
      });
    }

    return res.status(200).json({ results: tracks });
  } catch (err: any) {
    console.error('Related tracks error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch related tracks', results: [] });
  }
}

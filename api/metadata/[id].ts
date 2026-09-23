import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getYtIos } from '../lib/yt';

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
    const yt = await getYtIos();
    const info = await yt.getBasicInfo(videoId);
    const basic = info.basic_info;

    const thumbnails = basic.thumbnail || [];
    let bestThumbnail = '';
    if (Array.isArray(thumbnails) && thumbnails.length > 0) {
      bestThumbnail = thumbnails[0].url;
      let maxWidth = 0;
      for (const t of thumbnails) {
        if ((t.width || 0) >= maxWidth) {
          maxWidth = t.width || 0;
          bestThumbnail = t.url;
        }
      }
    }
    if (!bestThumbnail) {
      bestThumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    }

    const durationSeconds = basic.duration || 0;
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = Math.floor(durationSeconds % 60);
    const durationText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    const metadata = {
      id: videoId,
      title: basic.title || 'Unknown Title',
      artist: basic.author || 'Unknown Artist',
      duration: durationText,
      durationSeconds,
      thumbnail: bestThumbnail,
      thumbnails: Array.isArray(thumbnails) ? thumbnails : [],
    };

    return res.status(200).json({ metadata });
  } catch (err: any) {
    console.error('Metadata error:', err);
    return res.status(500).json({ error: err.message || 'Metadata lookup failed' });
  }
}

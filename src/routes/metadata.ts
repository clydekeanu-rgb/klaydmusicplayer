import { getYtIos } from '../yt';
import { jsonResponse, errorResponse } from '../utils/cors';
import { getCached, setCached } from '../utils/cache';
import { TrackItem, WorkerEnv } from '../types';

export async function handleMetadata(videoId: string, env: WorkerEnv): Promise<Response> {
  if (!videoId) {
    return errorResponse('Missing videoId', 400);
  }

  const cacheKey = `metadata:${videoId}`;
  const cached = await getCached<TrackItem>(env, cacheKey);
  if (cached) {
    return jsonResponse({ metadata: cached, cached: true });
  }

  try {
    const yt = await getYtIos();
    const info = await yt.getBasicInfo(videoId);
    const basic = info.basic_info;

    const thumbnails = basic.thumbnail || [];
    let bestThumbnail = '';
    if (Array.isArray(thumbnails) && thumbnails.length > 0) {
      bestThumbnail = thumbnails[0].url; // Often maxres or highest is first or last
      // Find the one with largest width
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

    const metadata: TrackItem = {
      id: videoId,
      title: basic.title || 'Unknown Title',
      artist: basic.author || 'Unknown Artist',
      duration: durationText,
      durationSeconds,
      thumbnail: bestThumbnail,
      thumbnails: Array.isArray(thumbnails) ? thumbnails : [],
    };

    // Cache for 30 minutes
    await setCached(env, cacheKey, metadata, 1800);

    return jsonResponse({ metadata, cached: false });
  } catch (err: any) {
    console.error(`Metadata error for ${videoId}:`, err);
    return errorResponse(`Failed to fetch metadata: ${err.message || err}`, 500);
  }
}

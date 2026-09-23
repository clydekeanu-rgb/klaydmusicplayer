import { getYtMusic } from '../yt';
import { jsonResponse, errorResponse } from '../utils/cors';
import { getCached, setCached } from '../utils/cache';
import { TrackItem, WorkerEnv } from '../types';

export async function handleRelated(videoId: string, env: WorkerEnv): Promise<Response> {
  if (!videoId) {
    return errorResponse('Missing videoId', 400);
  }

  const cacheKey = `related:${videoId}`;
  const cached = await getCached<TrackItem[]>(env, cacheKey);
  if (cached) {
    return jsonResponse({ results: cached, cached: true });
  }

  try {
    const yt = await getYtMusic();
    const upNext = await yt.music.getUpNext(videoId);

    const tracks: TrackItem[] = [];
    const contents = upNext.contents || [];

    for (const rawItem of contents) {
      const it = rawItem as any;
      if (!it.id && !it.endpoint?.payload?.videoId) continue;
      const id = it.id || it.endpoint?.payload?.videoId;
      if (id === videoId) continue; // Skip currently playing track

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

    // Cache for 30 minutes
    await setCached(env, cacheKey, tracks, 1800);

    return jsonResponse({ results: tracks, cached: false });
  } catch (err: any) {
    console.error(`Related error for ${videoId}:`, err);
    return errorResponse(`Failed to fetch related tracks: ${err.message || err}`, 500);
  }
}

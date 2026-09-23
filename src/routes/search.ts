import { getYtMusic } from '../yt';
import { jsonResponse, errorResponse } from '../utils/cors';
import { getCached, setCached } from '../utils/cache';
import { TrackItem, WorkerEnv } from '../types';

export async function handleSearch(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.trim();

  if (!query) {
    return errorResponse('Missing search query parameter "q"', 400);
  }

  const cacheKey = `search:${query.toLowerCase()}`;
  const cached = await getCached<TrackItem[]>(env, cacheKey);
  if (cached) {
    return jsonResponse({ results: cached, cached: true });
  }

  try {
    const yt = await getYtMusic();
    const searchResults = await yt.music.search(query, { type: 'song' });

    const tracks: TrackItem[] = [];

    if (searchResults.contents && searchResults.contents.length > 0) {
      for (const shelf of searchResults.contents) {
        // Shelf contents may contain songs
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

          // Process thumbnails
          const thumbnails = item.thumbnails || (item.thumbnail?.thumbnails) || [];
          let bestThumbnail = '';
          if (Array.isArray(thumbnails) && thumbnails.length > 0) {
            bestThumbnail = thumbnails[thumbnails.length - 1]?.url || '';
          }
          if (!bestThumbnail && id) {
            bestThumbnail = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
          }

          // Ensure https and clean sizing
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
    }

    // Cache for 15 minutes
    await setCached(env, cacheKey, tracks, 900);

    return jsonResponse({ results: tracks, cached: false });
  } catch (err: any) {
    console.error('Search error:', err);
    return errorResponse(`Failed to perform search: ${err.message || err}`, 500);
  }
}

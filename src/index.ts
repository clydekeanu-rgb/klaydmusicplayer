import { handleOptions, jsonResponse, errorResponse } from './utils/cors';
import { checkRateLimit } from './utils/rateLimit';
import { handleSearch } from './routes/search';
import { handleMetadata } from './routes/metadata';
import { handleStream, handleAudioProxy } from './routes/stream';
import { handleLyrics } from './routes/lyrics';
import { handleRelated } from './routes/related';
import { WorkerEnv } from './types';

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
    // 1. Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // 2. Apply rate limiting (except for streaming chunks)
    const isAudioStream = path.includes('/audio');
    if (!isAudioStream) {
      const clientIp = request.headers.get('cf-connecting-ip') || '127.0.0.1';
      const limit = checkRateLimit(clientIp, 150, 60);
      if (!limit.allowed) {
        return errorResponse('Too Many Requests. Rate limit exceeded.', 429);
      }
    }

    try {
      // Health check
      if (path === '/' || path === '/health' || path === '/api/health') {
        return jsonResponse({
          status: 'ok',
          service: 'ytm-worker-backend',
          version: '1.0.0',
          endpoints: [
            '/api/search?q=',
            '/api/metadata/:videoId',
            '/api/stream/:videoId',
            '/api/stream/:videoId/audio',
            '/api/lyrics?title=&artist=',
            '/api/related/:videoId',
          ],
        });
      }

      // Search
      if (path === '/api/search' || path === '/search') {
        return await handleSearch(request, env);
      }

      // Audio stream proxy with Range requests
      const audioMatch = path.match(/^\/(?:api\/)?stream\/([a-zA-Z0-9_-]+)\/audio$/);
      if (audioMatch) {
        return await handleAudioProxy(audioMatch[1], request, env);
      }

      // Stream format metadata resolution
      const streamMatch = path.match(/^\/(?:api\/)?stream\/([a-zA-Z0-9_-]+)$/);
      if (streamMatch) {
        return await handleStream(streamMatch[1], request, env);
      }

      // Track metadata
      const metadataMatch = path.match(/^\/(?:api\/)?metadata\/([a-zA-Z0-9_-]+)$/);
      if (metadataMatch) {
        return await handleMetadata(metadataMatch[1], env);
      }

      // Lyrics
      if (path === '/api/lyrics' || path === '/lyrics') {
        return await handleLyrics(request, env);
      }

      // Related / UpNext for radio
      const relatedMatch = path.match(/^\/(?:api\/)?related\/([a-zA-Z0-9_-]+)$/);
      if (relatedMatch) {
        return await handleRelated(relatedMatch[1], env);
      }

      return errorResponse('Endpoint not found', 404);
    } catch (err: any) {
      console.error('Unhandled worker error:', err);
      return errorResponse(`Internal Server Error: ${err.message || err}`, 500);
    }
  },
};

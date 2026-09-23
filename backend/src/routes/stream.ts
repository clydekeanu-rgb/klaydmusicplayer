import { getYtIos } from '../yt';
import { jsonResponse, errorResponse, corsHeaders } from '../utils/cors';
import { StreamResponse, WorkerEnv } from '../types';

export async function handleStream(
  videoId: string,
  request: Request,
  env: WorkerEnv
): Promise<Response> {
  if (!videoId) {
    return errorResponse('Missing videoId', 400);
  }

  try {
    const yt = await getYtIos();
    const info = await yt.getBasicInfo(videoId);
    const audioFormats = info.streaming_data?.adaptive_formats?.filter((f: any) => f.has_audio) || [];

    if (audioFormats.length === 0) {
      return errorResponse('No playable audio formats found for this video', 404);
    }

    // Sort by bitrate descending to choose the best audio quality
    const sorted = [...audioFormats].sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
    const best = sorted[0];

    if (!best.url) {
      return errorResponse('Audio format does not contain a direct stream URL', 500);
    }

    const host = new URL(request.url).origin;
    const proxyUrl = `${host}/api/stream/${videoId}/audio`;

    const data: StreamResponse = {
      id: videoId,
      streamUrl: best.url,
      proxyUrl,
      mimeType: best.mime_type || 'audio/mp4',
      bitrate: best.bitrate || 128000,
      itag: best.itag,
      audioQuality: (best as any).audio_quality || 'AUDIO_QUALITY_MEDIUM',
      durationSeconds: info.basic_info.duration,
    };

    return jsonResponse(data);
  } catch (err: any) {
    console.error(`Stream error for ${videoId}:`, err);
    return errorResponse(`Failed to extract audio stream: ${err.message || err}`, 500);
  }
}

export async function handleAudioProxy(
  videoId: string,
  request: Request,
  env: WorkerEnv
): Promise<Response> {
  if (!videoId) {
    return errorResponse('Missing videoId', 400);
  }

  try {
    const yt = await getYtIos();
    const info = await yt.getBasicInfo(videoId);
    const audioFormats = info.streaming_data?.adaptive_formats?.filter((f: any) => f.has_audio) || [];

    if (audioFormats.length === 0) {
      return errorResponse('No playable audio formats found', 404);
    }

    const sorted = [...audioFormats].sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
    const targetUrl = sorted[0].url;

    if (!targetUrl) {
      return errorResponse('No direct audio URL available', 500);
    }

    // Prepare headers for proxying
    const headers = new Headers();
    const rangeHeader = request.headers.get('range');
    if (rangeHeader) {
      headers.set('Range', rangeHeader);
    }
    headers.set(
      'User-Agent',
      'com.google.ios.youtube/19.29.1 (iPhone14,3; U; CPU iOS 17_5_1 like Mac OS X; en_US)'
    );

    const upstreamResponse = await fetch(targetUrl, {
      method: request.method === 'HEAD' ? 'HEAD' : 'GET',
      headers,
    });

    const responseHeaders = new Headers(corsHeaders);
    responseHeaders.set('Content-Type', upstreamResponse.headers.get('content-type') || 'audio/mp4');
    responseHeaders.set('Accept-Ranges', 'bytes');

    const contentLength = upstreamResponse.headers.get('content-length');
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    const contentRange = upstreamResponse.headers.get('content-range');
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    }

    // Cache briefly (5 minutes)
    responseHeaders.set('Cache-Control', 'public, max-age=300');

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error(`Audio proxy error for ${videoId}:`, err);
    return errorResponse(`Failed to proxy audio: ${err.message || err}`, 500);
  }
}

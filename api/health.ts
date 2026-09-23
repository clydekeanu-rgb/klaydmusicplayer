import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  return res.status(200).json({
    status: 'ok',
    service: 'ytm-player-api',
    version: '1.0.0',
    endpoints: [
      '/api/search?q=',
      '/api/metadata/:id',
      '/api/lyrics?title=&artist=',
      '/api/related/:id',
      '/api/health',
    ],
  });
}

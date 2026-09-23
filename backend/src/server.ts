import { serve } from '@hono/node-server';
import worker from './index';

const port = Number(process.env.PORT) || 8787;
const host = '0.0.0.0';

console.log(`Aura Music Backend starting on http://${host}:${port}`);

serve(
  {
    fetch: (req) => worker.fetch(req, { ENVIRONMENT: process.env.NODE_ENV || 'production' }),
    port,
    hostname: host,
  },
  (info) => {
    console.log(`Server is running on port ${info.port}`);
  }
);

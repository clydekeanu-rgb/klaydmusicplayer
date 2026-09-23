import { WorkerEnv } from '../types';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const inMemoryCache = new Map<string, CacheEntry<unknown>>();

export async function getCached<T>(env: WorkerEnv, key: string): Promise<T | null> {
  // Check KV first if bound
  if (env.MUSIC_CACHE) {
    try {
      const val = await env.MUSIC_CACHE.get(key, 'json');
      if (val) return val as T;
    } catch {
      // ignore KV read errors
    }
  }

  // Fallback to in-memory cache
  const entry = inMemoryCache.get(key);
  if (entry) {
    if (Date.now() < entry.expiresAt) {
      return entry.data as T;
    }
    inMemoryCache.delete(key);
  }

  return null;
}

export async function setCached<T>(
  env: WorkerEnv,
  key: string,
  data: T,
  ttlSeconds = 900 // 15 minutes default
): Promise<void> {
  // Write to KV if bound
  if (env.MUSIC_CACHE) {
    try {
      await env.MUSIC_CACHE.put(key, JSON.stringify(data), {
        expirationTtl: Math.max(60, ttlSeconds),
      });
    } catch {
      // ignore KV write errors
    }
  }

  // Also write to in-memory cache
  inMemoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });

  // Simple housekeeping if map grows large
  if (inMemoryCache.size > 200) {
    const now = Date.now();
    for (const [k, v] of inMemoryCache.entries()) {
      if (now >= v.expiresAt) inMemoryCache.delete(k);
    }
  }
}

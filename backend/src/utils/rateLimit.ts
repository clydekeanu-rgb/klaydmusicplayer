interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const ipBuckets = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  clientIp: string,
  maxRequests = 120, // 120 requests per minute
  windowSeconds = 60
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = ipBuckets.get(clientIp);

  if (!record || now >= record.resetAt) {
    ipBuckets.set(clientIp, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count };
}

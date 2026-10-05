'use strict';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  if (cleanup.unref) {
    cleanup.unref();
  }
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfterSeconds: number;
}

/**
 * In-memory sliding rate limiter.
 * @param key Unique identifier (e.g. `login:ip:email`)
 * @param options windowMs (duration) and max (number of allowed attempts)
 */
export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + options.windowMs,
    };
    store.set(key, newRecord);
    return {
      success: true,
      remaining: options.max - 1,
      resetTime: newRecord.resetTime,
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  if (record.count >= options.max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    return {
      success: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfterSeconds,
    };
  }

  record.count += 1;
  return {
    success: true,
    remaining: options.max - record.count,
    resetTime: record.resetTime,
    retryAfterSeconds: Math.max(1, Math.ceil((record.resetTime - now) / 1000)),
  };
}

/**
 * Helper to extract client IP from request headers
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  return '127.0.0.1';
}

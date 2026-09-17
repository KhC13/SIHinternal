import type { NextFunction, Request, Response } from 'express';

type RateLimitOptions = {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
  statusCode?: number;
  keyGenerator?: (req: Request) => string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

function getClientKey(req: Request, keyGenerator?: (req: Request) => string): string {
  if (keyGenerator) {
    return keyGenerator(req);
  }

  const forwardedFor = req.headers['x-forwarded-for'];
  const ipHeader = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  const rawIp = ipHeader || req.socket?.remoteAddress || 'unknown';
  return rawIp.trim().split(',')[0];
}

export function rateLimit(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs ?? 60_000;
  const maxRequests = options.maxRequests ?? 60;
  const statusCode = options.statusCode ?? 429;
  const message = options.message ?? 'Too many requests, please try again later.';

  return (req: Request, res: Response, next: NextFunction) => {
    const key = getClientKey(req, options.keyGenerator);
    const now = Date.now();
    const current = store.get(key);

    if (!current || now >= current.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= maxRequests) {
      const retryAfterMs = Math.max(0, current.resetAt - now);
      res.setHeader('Retry-After', String(Math.ceil(retryAfterMs / 1000)));
      return res.status(statusCode).json({
        error: message,
        retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      });
    }

    current.count += 1;
    store.set(key, current);
    return next();
  };
}

export const generalRateLimit = rateLimit({
  windowMs: 60_000,
  maxRequests: 120,
  message: 'Too many requests from this IP. Please wait a minute and try again.',
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60_000,
  maxRequests: 10,
  message: 'Too many authentication attempts. Please try again later.',
});

export function clearRateLimitStore() {
  store.clear();
}

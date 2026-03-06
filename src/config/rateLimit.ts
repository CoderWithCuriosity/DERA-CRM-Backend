import rateLimit from 'express-rate-limit';
import { rateLimit as rateLimitConfig } from './environment';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.max,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path.startsWith('/public')
});

// Stricter limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: rateLimitConfig.authWindowMs,
  max: rateLimitConfig.authMax,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Campaign sending limiter
export const campaignLimiter = rateLimit({
  windowMs: rateLimitConfig.campaignWindowMs,
  max: rateLimitConfig.campaignMax,
  message: {
    success: false,
    message: 'Campaign rate limit exceeded. Please wait before sending more campaigns.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false
});

// File upload limiter
export const uploadLimiter = rateLimit({
  windowMs: rateLimitConfig.uploadWindowMs,
  max: rateLimitConfig.uploadMax,
  message: {
    success: false,
    message: 'Upload limit exceeded. Please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Export limiter
export const exportLimiter = rateLimit({
  windowMs: rateLimitConfig.uploadWindowMs,
  max: rateLimitConfig.uploadMax,
  message: {
    success: false,
    message: 'Export limit exceeded. Please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Create custom limiter
export const createCustomLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// Key generators for different scenarios
export const keyGenerators = {
  user: (req: any) => {
    return req.user?.id?.toString() || req.ip;
  },
  ip: (req: any) => {
    return req.ip;
  },
  email: (req: any) => {
    return req.body?.email || req.ip;
  }
};

// Skip functions
export const skipFunctions = {
  healthCheck: (req: any) => req.path === '/health',
  publicAssets: (req: any) => req.path.startsWith('/public'),
  adminUsers: (req: any) => req.user?.role === 'admin'
};

// Rate limit headers
export const rateLimitHeaders = {
  limit: 'X-RateLimit-Limit',
  remaining: 'X-RateLimit-Remaining',
  reset: 'X-RateLimit-Reset',
  retryAfter: 'Retry-After'
};

// Rate limit store (for distributed systems)
export interface RateLimitStore {
  increment: (key: string) => Promise<{ totalHits: number; resetTime: Date }>;
  decrement: (key: string) => Promise<void>;
  resetKey: (key: string) => Promise<void>;
  resetAll: () => Promise<void>;
}

// Memory store (default)
export class MemoryStore implements RateLimitStore {
  private store: Map<string, { hits: number; resetTime: Date }> = new Map();

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const now = new Date();
    const record = this.store.get(key);

    if (!record || record.resetTime <= now) {
      const resetTime = new Date(now.getTime() + rateLimitConfig.windowMs);
      this.store.set(key, { hits: 1, resetTime });
      return { totalHits: 1, resetTime };
    }

    record.hits += 1;
    this.store.set(key, record);
    return { totalHits: record.hits, resetTime: record.resetTime };
  }

  async decrement(key: string): Promise<void> {
    const record = this.store.get(key);
    if (record) {
      record.hits = Math.max(0, record.hits - 1);
      if (record.hits === 0) {
        this.store.delete(key);
      } else {
        this.store.set(key, record);
      }
    }
  }

  async resetKey(key: string): Promise<void> {
    this.store.delete(key);
  }

  async resetAll(): Promise<void> {
    this.store.clear();
  }
}

export default {
  apiLimiter,
  authLimiter,
  campaignLimiter,
  uploadLimiter,
  exportLimiter,
  createCustomLimiter,
  keyGenerators,
  skipFunctions,
  rateLimitHeaders,
  MemoryStore
};
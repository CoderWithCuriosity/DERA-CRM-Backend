// config/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { HTTP_STATUS } from '../config/constants';
import { Request, Response, NextFunction } from 'express';

// Redis client for distributed rate limiting
let redisClient: any;

if (process.env.REDIS_URL) {
  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.connect().catch(console.error);
}

// Rate limit configuration from environment variables
const rateLimitConfig = {
  // General rate limits
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW || '30') || 30) * 60 * 1000, // Convert minutes to milliseconds
  max: parseInt(process.env.RATE_LIMIT_MAX || '200') || 200,
  
  // Auth rate limits
  authWindowMs: (parseInt(process.env.AUTH_RATE_LIMIT_WINDOW || '15') || 15) * 60 * 1000,
  authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10') || 10,
  
  // Campaign rate limits
  campaignWindowMs: (parseInt(process.env.CAMPAIGN_RATE_LIMIT_WINDOW || '60') || 60) * 60 * 1000,
  campaignMax: parseInt(process.env.CAMPAIGN_RATE_LIMIT_MAX || '50') || 50,
  
  // Upload rate limits
  uploadWindowMs: (parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW || '60') || 60) * 60 * 1000,
  uploadMax: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX || '20') || 20,
};

console.log('Rate limit configuration:', {
  general: `${rateLimitConfig.max} requests per ${rateLimitConfig.windowMs / 1000 / 60} minutes`,
  auth: `${rateLimitConfig.authMax} requests per ${rateLimitConfig.authWindowMs / 1000 / 60} minutes`,
  campaign: `${rateLimitConfig.campaignMax} requests per ${rateLimitConfig.campaignWindowMs / 1000 / 60} minutes`,
  upload: `${rateLimitConfig.uploadMax} requests per ${rateLimitConfig.uploadWindowMs / 1000 / 60} minutes`,
});

/**
 * General API rate limiter
 */
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
  store: redisClient ? new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args)
  }) : undefined,
  skip: (req) => req.path === '/health' || req.path.startsWith('/public')
});

/**
 * Stricter limiter for authentication endpoints
 */
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
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    // Use email as key for login attempts
    return req.body?.email || req.ip;
  }
});

/**
 * Limiter for campaign sending
 */
export const campaignLimiter = rateLimit({
  windowMs: rateLimitConfig.campaignWindowMs,
  max: rateLimitConfig.campaignMax,
  message: {
    success: false,
    message: 'Campaign rate limit exceeded. Please wait before sending more campaigns.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id?.toString() || req.ip
});

/**
 * Limiter for file uploads
 */
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

/**
 * Limiter for exports
 */
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

/**
 * Create custom rate limiter
 */
export const createRateLimiter = (
  windowMs: number,
  max: number,
  message: string,
  keyGenerator?: (req: any) => string
) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    store: redisClient ? new RedisStore({
      sendCommand: (...args: string[]) => redisClient.sendCommand(args)
    }) : undefined
  });
};

/**
 * IP-based rate limiter
 */
export const ipLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100,
  'Too many requests from this IP',
  (req) => req.ip
);

/**
 * User-based rate limiter
 */
export const userLimiter = createRateLimiter(
  15 * 60 * 1000,
  200,
  'Too many requests from this user',
  (req) => req.user?.id?.toString() || req.ip
);

/**
 * Concurrent request limiter
 */
export const concurrentLimiter = (maxConcurrent: number = 5) => {
  const currentRequests = new Map<string, number>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.user?.id?.toString() || req.ip;
    const current = currentRequests.get(key) || 0;

    if (current >= maxConcurrent) {
      return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        success: false,
        message: 'Too many concurrent requests. Please wait.'
      });
    }

    currentRequests.set(key, current + 1);

    res.on('finish', () => {
      const remaining = currentRequests.get(key) || 0;
      if (remaining <= 1) {
        currentRequests.delete(key);
      } else {
        currentRequests.set(key, remaining - 1);
      }
    });

    return next();
  };
};

/**
 * Rate limit headers middleware
 */
export const addRateLimitHeaders = (_req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  
  res.json = function(body) {
    if (res.getHeaders) {
      const headers = res.getHeaders();
      if (headers['x-ratelimit-limit']) {
        res.setHeader('X-RateLimit-Limit', headers['x-ratelimit-limit']);
      }
      if (headers['x-ratelimit-remaining']) {
        res.setHeader('X-RateLimit-Remaining', headers['x-ratelimit-remaining']);
      }
      if (headers['x-ratelimit-reset']) {
        res.setHeader('X-RateLimit-Reset', headers['x-ratelimit-reset']);
      }
    }
    return originalJson.call(this, body);
  };
  
  return next();
};
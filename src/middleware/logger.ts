import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import logger from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

// Extend Request type to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

/**
 * Add request ID to each request
 */
export const addRequestId = (req: Request, res: Response, next: NextFunction) => {
  req.requestId = uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

/**
 * Log request start
 */
export const logRequestStart = (req: Request, _res: Response, next: NextFunction) => {
  req.startTime = Date.now();
  
  logger.info({
    message: 'Request started',
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id
  });
  
  next();
};

/**
 * Log request completion
 */
export const logRequestComplete = (req: Request, res: Response, next: NextFunction) => {
  const duration = Date.now() - (req.startTime || Date.now());
  
  logger.info({
    message: 'Request completed',
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    userId: req.user?.id
  });
  
  next();
};

/**
 * Morgan middleware for HTTP logging
 */
export const morganMiddleware = morgan(
  (tokens, req, res) => {
    return JSON.stringify({
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: parseInt(tokens.status(req, res) || '0'),
      contentLength: tokens.res(req, res, 'content-length'),
      responseTime: tokens['response-time'](req, res),
      userAgent: tokens['user-agent'](req, res)
    });
  },
  {
    stream: {
      write: (message: string) => {
        logger.http(JSON.parse(message));
      }
    }
  }
);

/**
 * Log error with context
 */
export const logError = (err: Error, req: Request, _res: Response, next: NextFunction) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id,
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  next(err);
};

/**
 * Log database queries
 */
export const logDatabaseQuery = (query: string, duration: number) => {
  logger.debug({
    message: 'Database query',
    query,
    duration: `${duration}ms`
  });
};

/**
 * Log authentication events
 */
export const logAuth = (action: string, userId: number | null, success: boolean, req: Request) => {
  logger.info({
    message: 'Authentication event',
    action,
    userId,
    success,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    requestId: req.requestId
  });
};

/**
 * Log API usage
 */
export const logApiUsage = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info({
      message: 'API usage',
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
      requestId: req.requestId
    });
  });
  
  next();
};

/**
 * Log performance metrics
 */
export const logPerformance = (threshold: number = 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      if (duration > threshold) {
        logger.warn({
          message: 'Slow request detected',
          method: req.method,
          url: req.originalUrl,
          duration: `${duration}ms`,
          threshold: `${threshold}ms`,
          userId: req.user?.id,
          requestId: req.requestId
        });
      }
    });
    
    next();
  };
};

/**
 * Log uncaught exceptions
 */
export const logUncaughtException = (err: Error) => {
  logger.error({
    message: 'Uncaught exception',
    error: err.message,
    stack: err.stack
  });
  
  process.exit(1);
};

/**
 * Log unhandled rejections
 */
export const logUnhandledRejection = (reason: any, _promise: Promise<any>) => {
  logger.error({
    message: 'Unhandled rejection',
    reason: reason?.message || reason,
    stack: reason?.stack
  });
};
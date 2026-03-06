import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '../config/constants';
import AppError from '../utils/AppError';
import logger from '../config/logger';

// Add this interface near the top of your file
interface MulterError extends Error {
  code: string;
  field?: string;
}


/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?.id
  });

  // Handle AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method
    });
  }

  // Handle Sequelize errors
  if (err.name === 'SequelizeValidationError') {
    const errors = (err as any).errors.map((e: any) => ({
      field: e.path,
      message: e.message
    }));

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Database validation failed',
      errors,
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const errors = (err as any).errors.map((e: any) => ({
      field: e.path,
      message: `${e.path} already exists`
    }));

    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: 'Duplicate entry',
      errors,
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Referenced record does not exist',
      timestamp: new Date().toISOString()
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid token',
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Token expired',
      timestamp: new Date().toISOString()
    });
  }

  // Handle Multer errors
  if (err.name === 'MulterError') {
    const multerError = err as MulterError;
    if (multerError.code === 'LIMIT_FILE_SIZE') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'File too large',
        timestamp: new Date().toISOString()
      });
    }

    
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }

  // Default error
  const statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong' 
    : err.message;

  return res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
};

/**
 * 404 Not Found handler
 */
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(
    `Cannot ${req.method} ${req.originalUrl}`,
    HTTP_STATUS.NOT_FOUND
  );
  return next(error);
};

/**
 * Async error wrapper
 */
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Unhandled rejection handler
 */
export const handleUnhandledRejection = (server: any) => {
  process.on('unhandledRejection', (err: Error) => {
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
    logger.error(err.name, err.message, err.stack);
    
    server.close(() => {
      process.exit(1);
    });
  });
};

/**
 * Uncaught exception handler
 */
export const handleUncaughtException = () => {
  process.on('uncaughtException', (err: Error) => {
    logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    logger.error(err.name, err.message, err.stack);
    process.exit(1);
  });
};
import { Request, Response, NextFunction } from 'express';

/**
 * Wraps async route handlers to catch errors and pass to error handling middleware
 */
const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default catchAsync;
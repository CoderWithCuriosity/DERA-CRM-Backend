import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { environment } from '../config/environment';
import { HTTP_STATUS, ERROR_MESSAGES, USER_ROLES } from '../config/constants';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED
      });
    }

    try {
      // Verify token
      const decoded: any = jwt.verify(token, environment.jwtSecret);

      // Get user from database
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User no longer exists'
        });
      }

      // Check if user is verified
      if (!user.is_verified) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: ERROR_MESSAGES.ACCOUNT_NOT_VERIFIED
        });
      }

      // Attach user to request
      req.user = user;
      return next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: ERROR_MESSAGES.INVALID_TOKEN
        });
      } else if (error instanceof jwt.TokenExpiredError) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: ERROR_MESSAGES.TOKEN_EXPIRED
        });
      }
      throw error;
    }
  } catch (error) {
    return next(error);
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token exists, but doesn't require it
 */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded: any = jwt.verify(token, environment.jwtSecret);
        const user = await User.findByPk(decoded.userId, {
          attributes: { exclude: ['password'] }
        });
        if (user && user.is_verified) {
          req.user = user;
        }
      } catch (error) {
        // Ignore token errors for optional auth
      }
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Role-based access control middleware
 * Restricts access to users with specified roles
 */
export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user exists (should be attached by protect middleware)
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED
      });
    }

    // Check if user role is allowed
    if (!roles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN
      });
    }

    return next();
  };
};

/**
 * Permission-based access control middleware
 * Checks if user has specific permissions
 */
export const hasPermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: ERROR_MESSAGES.UNAUTHORIZED
        });
      }

      // Define role permissions
      const rolePermissions: { [key: string]: string[] } = {
        [USER_ROLES.ADMIN]: ['*'], // Admin has all permissions
        [USER_ROLES.MANAGER]: [
          'view:users', 'create:users', 'update:users',
          'view:contacts', 'create:contacts', 'update:contacts', 'delete:contacts',
          'view:deals', 'create:deals', 'update:deals', 'delete:deals',
          'view:tickets', 'create:tickets', 'update:tickets', 'assign:tickets',
          'view:reports', 'export:data', 'import:data'
        ],
        [USER_ROLES.AGENT]: [
          'view:contacts', 'create:contacts', 'update:contacts',
          'view:deals', 'create:deals', 'update:deals',
          'view:tickets', 'create:tickets', 'update:tickets',
          'view:activities', 'create:activities', 'update:activities'
        ]
      };

      const userPermissions = rolePermissions[req.user.role] || [];

      // Check permission
      if (!userPermissions.includes('*') && !userPermissions.includes(permission)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: ERROR_MESSAGES.FORBIDDEN
        });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

/**
 * Resource ownership middleware
 * Ensures user can only access their own resources
 */
export const checkOwnership = (model: any, paramName: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: ERROR_MESSAGES.UNAUTHORIZED
        });
      }

      // Admin can access all resources
      if (req.user.role === USER_ROLES.ADMIN) {
        return next();
      }

      const resourceId = req.params[paramName];
      if (!resourceId) {
        return next();
      }

      const resource = await model.findByPk(resourceId);

      if (!resource) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Check if user owns the resource or is assigned to it
      const isOwner = resource.user_id === req.user.id;
      const isAssigned = resource.assigned_to === req.user.id;

      if (!isOwner && !isAssigned && req.user.role !== USER_ROLES.MANAGER) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: ERROR_MESSAGES.FORBIDDEN
        });
      }

      // Attach resource to request for later use
      (req as any).resource = resource;
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

/**
 * API key authentication middleware
 * For service-to-service communication
 */
export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'API key required'
      });
    }

    // Validate API key (implement based on your API key storage)
    const validApiKeys = process.env.API_KEYS?.split(',') || [];
    
    if (!validApiKeys.includes(apiKey as string)) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
};
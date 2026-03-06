import { Request, Response, NextFunction } from 'express';
import { USER_ROLES } from '../config/constants';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants';

/**
 * Check if user is admin
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.UNAUTHORIZED
    });
  }

  if (req.user.role !== USER_ROLES.ADMIN) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Admin access required'
    });
  }

  return next();
};

/**
 * Check if user is manager or admin
 */
export const isManagerOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.UNAUTHORIZED
    });
  }

  if (![USER_ROLES.ADMIN, USER_ROLES.MANAGER].includes(req.user.role)) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Manager or admin access required'
    });
  }

  return next();
};

/**
 * Check if user is agent or higher
 */
export const isAgentOrHigher = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.UNAUTHORIZED
    });
  }

  const allowedRoles = [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.AGENT];
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Insufficient permissions'
    });
  }

  return next();
};

/**
 * Check if user has specific role
 */
export const hasRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED
      });
    }

    if (req.user.role !== role) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: `${role} access required`
      });
    }

    return next();
  };
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: `Required roles: ${roles.join(', ')}`
      });
    }

    return next();
  };
};

/**
 * Check if user is accessing their own data
 */
export const isOwnData = (paramName: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED
      });
    }

    const targetUserId = parseInt(req.params[paramName] || req.body.user_id);

    if (req.user.role === USER_ROLES.ADMIN) {
      return next();
    }

    if (targetUserId && targetUserId !== req.user.id) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You can only access your own data'
      });
    }

    return next();
  };
};

/**
 * Check if user can manage other users
 */
export const canManageUsers = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.UNAUTHORIZED
    });
  }

  if (![USER_ROLES.ADMIN, USER_ROLES.MANAGER].includes(req.user.role)) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'You do not have permission to manage users'
    });
  }

  return next();
};

/**
 * Check if user can delete resources
 */
export const canDelete = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.UNAUTHORIZED
    });
  }

  if (req.user.role !== USER_ROLES.ADMIN) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Only admins can delete resources'
    });
  }

  return next();
};

/**
 * Check if user can export data
 */
export const canExport = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.UNAUTHORIZED
    });
  }

  const allowedRoles = [USER_ROLES.ADMIN, USER_ROLES.MANAGER];
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'You do not have permission to export data'
    });
  }

  return next();
};

/**
 * Check if user can import data
 */
export const canImport = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.UNAUTHORIZED
    });
  }

  const allowedRoles = [USER_ROLES.ADMIN, USER_ROLES.MANAGER];
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'You do not have permission to import data'
    });
  }

  return next();
};
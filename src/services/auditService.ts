import { AuditLog, User } from '../models';
import { AUDIT_ACTIONS, ENTITY_TYPES } from '../config/constants';
import { Op } from 'sequelize';
import { Request } from 'express';
import logger from '../config/logger';

// Define types from constants
type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];
type EntityType = typeof ENTITY_TYPES[keyof typeof ENTITY_TYPES];

// Extend Express Request to include user
interface RequestWithUser extends Request {
  user?: {
    id: number;
    [key: string]: any;
  };
}

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  user_id: number | null;
  action: AuditAction;
  entity_type: EntityType;
  entity_id: number;
  details: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Create audit log entry
 */
export const createAuditLog = async (
  entry: AuditLogEntry
): Promise<AuditLog> => {
  try {
    const auditLog = await AuditLog.create({
      user_id: entry.user_id,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      details: entry.details,
      ip_address: entry.ip_address,
      user_agent: entry.user_agent
    });

    return auditLog;
  } catch (error) {
    logger.error('Failed to create audit log:', error);
    throw error;
  }
};

/**
 * Log user action with request context
 */
export const logAction = async (
  req: RequestWithUser,
  action: AuditAction,
  entityType: EntityType,
  entityId: number,
  details: string
): Promise<void> => {
  await createAuditLog({
    user_id: req.user?.id || null,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });
};

/**
 * Log user login
 */
export const logLogin = async (
  userId: number,
  req: RequestWithUser,
  success: boolean
): Promise<void> => {
  await createAuditLog({
    user_id: userId,
    action: success ? AUDIT_ACTIONS.LOGIN : 'LOGIN_FAILED' as AuditAction,
    entity_type: ENTITY_TYPES.USER,
    entity_id: userId,
    details: success ? 'User logged in' : 'Failed login attempt',
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });
};

/**
 * Log user logout
 */
export const logLogout = async (
  userId: number,
  req: RequestWithUser
): Promise<void> => {
  await createAuditLog({
    user_id: userId,
    action: AUDIT_ACTIONS.LOGOUT,
    entity_type: ENTITY_TYPES.USER,
    entity_id: userId,
    details: 'User logged out',
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });
};

/**
 * Log resource creation
 */
export const logCreate = async (
  req: RequestWithUser,
  entityType: EntityType,
  entityId: number,
  details: string
): Promise<void> => {
  await logAction(req, AUDIT_ACTIONS.CREATE, entityType, entityId, details);
};

/**
 * Log resource update
 */
export const logUpdate = async (
  req: RequestWithUser,
  entityType: EntityType,
  entityId: number,
  details: string
): Promise<void> => {
  await logAction(req, AUDIT_ACTIONS.UPDATE, entityType, entityId, details);
};

/**
 * Log resource delete
 */
export const logDelete = async (
  req: RequestWithUser,
  entityType: EntityType,
  entityId: number,
  details: string
): Promise<void> => {
  await logAction(req, AUDIT_ACTIONS.DELETE, entityType, entityId, details);
};

/**
 * Log resource view
 */
export const logView = async (
  req: RequestWithUser,
  entityType: EntityType,
  entityId: number,
  details: string
): Promise<void> => {
  await logAction(req, AUDIT_ACTIONS.VIEW, entityType, entityId, details);
};

/**
 * Log export
 */
export const logExport = async (
  req: RequestWithUser,
  entityType: EntityType,
  count: number
): Promise<void> => {
  await logAction(
    req,
    AUDIT_ACTIONS.EXPORT,
    entityType,
    0,
    `Exported ${count} ${entityType} records`
  );
};

/**
 * Log import
 */
export const logImport = async (
  req: RequestWithUser,
  entityType: EntityType,
  count: number
): Promise<void> => {
  await logAction(
    req,
    AUDIT_ACTIONS.IMPORT,
    entityType,
    0,
    `Imported ${count} ${entityType} records`
  );
};

/**
 * Get audit logs with filters
 */
export const getAuditLogs = async (
  filters: {
    userId?: number;
    action?: AuditAction;
    entityType?: EntityType;
    entityId?: number;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }
): Promise<{ logs: AuditLog[]; total: number; pages: number }> => {
  const {
    userId,
    action,
    entityType,
    entityId,
    startDate,
    endDate,
    page = 1,
    limit = 50
  } = filters;

  const where: any = {};

  if (userId) where.user_id = userId;
  if (action) where.action = action;
  if (entityType) where.entity_type = entityType;
  if (entityId) where.entity_id = entityId;

  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) where.created_at[Op.gte] = startDate;
    if (endDate) where.created_at[Op.lte] = endDate;
  }

  const offset = (page - 1) * limit;

  const { count, rows } = await AuditLog.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }
    ]
  });

  return {
    logs: rows,
    total: count,
    pages: Math.ceil(count / limit)
  };
};

/**
 * Get user activity summary
 */
export const getUserActivitySummary = async (
  userId: number,
  days: number = 30
): Promise<{
  total_actions: number;
  by_action: Record<AuditAction, number>;
  by_entity: Record<EntityType, number>;
  daily_activity: Record<string, number>;
  recent_actions: AuditLog[];
}> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const logs = await AuditLog.findAll({
    where: {
      user_id: userId,
      created_at: { [Op.gte]: startDate }
    },
    order: [['created_at', 'DESC']]
  });

  const summary = {
    total_actions: logs.length,
    by_action: {} as Record<AuditAction, number>,
    by_entity: {} as Record<EntityType, number>,
    daily_activity: {} as Record<string, number>,
    recent_actions: logs.slice(0, 10)
  };

  logs.forEach(log => {
    // Count by action
    const action = log.action as AuditAction;
    summary.by_action[action] = (summary.by_action[action] || 0) + 1;

    // Count by entity
    const entityType = log.entity_type as EntityType;
    summary.by_entity[entityType] = (summary.by_entity[entityType] || 0) + 1;

    // Daily activity
    const date = log.created_at.toISOString().split('T')[0];
    summary.daily_activity[date] = (summary.daily_activity[date] || 0) + 1;
  });

  return summary;
};

/**
 * Clean up old audit logs
 */
export const cleanupOldLogs = async (daysToKeep: number = 90): Promise<number> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const deleted = await AuditLog.destroy({
    where: {
      created_at: { [Op.lt]: cutoffDate }
    }
  });

  logger.info(`Cleaned up ${deleted} audit logs older than ${daysToKeep} days`);
  
  return deleted;
};

/**
 * Export audit logs
 */
export const exportAuditLogs = async (
  filters: {
    userId?: number;
    action?: AuditAction;
    entityType?: EntityType;
    entityId?: number;
    startDate?: Date;
    endDate?: Date;
  },
  format: 'csv' | 'json' = 'json'
): Promise<any> => {
  const { logs } = await getAuditLogs({ ...filters, limit: 10000 });
  
  // Type assertion for logs with user
  const logsWithUser = logs as (AuditLog & {
    user?: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
    };
  })[];

  if (format === 'csv') {
    const csv = logsWithUser.map(log => ({
      timestamp: log.created_at,
      user: log.user ? `${log.user.first_name} ${log.user.last_name}` : 'System',
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      details: log.details,
      ip_address: log.ip_address
    }));
    return csv;
  }

  return logsWithUser;
};
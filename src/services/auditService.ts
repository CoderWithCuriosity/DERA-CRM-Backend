import { AuditLog, User } from '../models';
import { AUDIT_ACTIONS, ENTITY_TYPES } from '../config/constants';
import { Op } from 'sequelize';
import { Request } from 'express';
import logger from '../config/logger';

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  user_id: number | null;
  action: string;
  entity_type: string;
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
  req: Request,
  action: string,
  entityType: string,
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
  req: Request,
  success: boolean
): Promise<void> => {
  await createAuditLog({
    user_id: userId,
    action: success ? AUDIT_ACTIONS.LOGIN : 'LOGIN_FAILED',
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
  req: Request
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
  req: Request,
  entityType: string,
  entityId: number,
  details: string
): Promise<void> => {
  await logAction(req, AUDIT_ACTIONS.CREATE, entityType, entityId, details);
};

/**
 * Log resource update
 */
export const logUpdate = async (
  req: Request,
  entityType: string,
  entityId: number,
  details: string
): Promise<void> => {
  await logAction(req, AUDIT_ACTIONS.UPDATE, entityType, entityId, details);
};

/**
 * Log resource delete
 */
export const logDelete = async (
  req: Request,
  entityType: string,
  entityId: number,
  details: string
): Promise<void> => {
  await logAction(req, AUDIT_ACTIONS.DELETE, entityType, entityId, details);
};

/**
 * Log resource view
 */
export const logView = async (
  req: Request,
  entityType: string,
  entityId: number,
  details: string
): Promise<void> => {
  await logAction(req, AUDIT_ACTIONS.VIEW, entityType, entityId, details);
};

/**
 * Log export
 */
export const logExport = async (
  req: Request,
  entityType: string,
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
  req: Request,
  entityType: string,
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
    action?: string;
    entityType?: string;
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
): Promise<any> => {
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
    by_action: {} as any,
    by_entity: {} as any,
    daily_activity: {} as any,
    recent_actions: logs.slice(0, 10)
  };

  logs.forEach(log => {
    // Count by action
    summary.by_action[log.action] = (summary.by_action[log.action] || 0) + 1;

    // Count by entity
    summary.by_entity[log.entity_type] = (summary.by_entity[log.entity_type] || 0) + 1;

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
  filters: any,
  format: 'csv' | 'json' = 'json'
): Promise<any> => {
  const { logs } = await getAuditLogs({ ...filters, limit: 10000 });

  if (format === 'csv') {
    const csv = logs.map(log => ({
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

  return logs;
};
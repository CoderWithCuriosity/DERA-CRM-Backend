  import { Request, Response } from 'express';
  import { Op } from 'sequelize';
  import { 
    User, Contact, Deal, Ticket, Campaign, AuditLog,
    sequelize 
  } from '../models';
  import { 
    HTTP_STATUS, AUDIT_ACTIONS, ENTITY_TYPES, TIME 
  } from '../config/constants';
  import catchAsync from '../utils/catchAsync';
  import { getPagination, getPagingData } from '../utils/pagination';
  import { createBackup as createDatabaseBackup, getBackupStatus as getBackupStatusService } from '../services/backupService';
  import fs from 'fs';
  import path from 'path';
import { createSimpleAudit } from '../utils/auditHelper';

  // @desc    Get system stats
  // @route   GET /api/admin/stats
  // @access  Private/Admin
  export const getSystemStats = catchAsync(async (_req: Request, res: Response) => {
    const [
      users,
      contacts,
      deals,
      tickets,
      campaigns,
      storage,
      apiUsage
    ] = await Promise.all([
      // Users stats
      User.findAndCountAll({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('role'))), 'by_role']
        ],
        group: ['role']
      }).then(result => {
        const byRole: any = {};
        result.count.forEach((item: any) => {
          byRole[item.role] = parseInt(item.getDataValue('count'));
        });
        return {
          total: result.count.reduce((sum: number, item: any) => sum + parseInt(item.getDataValue('count')), 0),
          active_today: 0, // Implement with last_login tracking
          by_role: byRole
        };
      }),

      // Contacts stats
      Contact.findAndCountAll({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('status'))), 'by_status']
        ],
        group: ['status']
      }).then(result => {
        const byStatus: any = {};
        result.count.forEach((item: any) => {
          byStatus[item.status] = parseInt(item.getDataValue('count'));
        });
        return {
          total: result.count.reduce((sum: number, item: any) => sum + parseInt(item.getDataValue('count')), 0),
          active: byStatus['active'] || 0,
          inactive: byStatus['inactive'] || 0
        };
      }),

      // Deals stats
      Deal.findAndCountAll({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('status'))), 'by_status']
        ],
        group: ['status']
      }).then(result => {
        const byStatus: any = {};
        result.count.forEach((item: any) => {
          byStatus[item.status] = parseInt(item.getDataValue('count'));
        });
        return {
          total: result.count.reduce((sum: number, item: any) => sum + parseInt(item.getDataValue('count')), 0),
          open: byStatus['open'] || 0,
          won: byStatus['won'] || 0,
          lost: byStatus['lost'] || 0
        };
      }),

      // Tickets stats
      Ticket.findAndCountAll({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('status'))), 'by_status']
        ],
        group: ['status']
      }).then(result => {
        const byStatus: any = {};
        result.count.forEach((item: any) => {
          byStatus[item.status] = parseInt(item.getDataValue('count'));
        });
        return {
          total: result.count.reduce((sum: number, item: any) => sum + parseInt(item.getDataValue('count')), 0),
          open: (byStatus['new'] || 0) + (byStatus['open'] || 0) + (byStatus['pending'] || 0),
          resolved: byStatus['resolved'] || 0,
          closed: byStatus['closed'] || 0
        };
      }),

      // Campaigns stats
      Campaign.findAndCountAll({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('status'))), 'by_status']
        ],
        group: ['status']
      }).then(result => {
        const byStatus: any = {};
        result.count.forEach((item: any) => {
          byStatus[item.status] = parseInt(item.getDataValue('count'));
        });
        return {
          total: result.count.reduce((sum: number, item: any) => sum + parseInt(item.getDataValue('count')), 0),
          sent: byStatus['sent'] || 0,
          scheduled: byStatus['scheduled'] || 0
        };
      }),

      // Storage stats
      (async () => {
        const uploadDir = path.join(process.cwd(), 'uploads');
        let totalSize = 0;

        const calculateDirSize = (dir: string): number => {
          let size = 0;
          const files = fs.readdirSync(dir);

          files.forEach(file => {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);

            if (stats.isFile()) {
              size += stats.size;
            } else if (stats.isDirectory()) {
              size += calculateDirSize(filePath);
            }
          });

          return size;
        };

        if (fs.existsSync(uploadDir)) {
          totalSize = calculateDirSize(uploadDir);
        }

        return {
          used: formatBytes(totalSize),
          total: '10 GB',
          percentage: (totalSize / (10 * 1024 * 1024 * 1024)) * 100
        };
      })(),

      // API Usage stats
      (async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thisWeek = new Date();
        thisWeek.setDate(thisWeek.getDate() - 7);

        const thisMonth = new Date();
        thisMonth.setDate(1);

        const todayCount = await AuditLog.count({
          where: {
            created_at: {
              [Op.gte]: today
            }
          }
        });

        const weekCount = await AuditLog.count({
          where: {
            created_at: {
              [Op.gte]: thisWeek
            }
          }
        });

        const monthCount = await AuditLog.count({
          where: {
            created_at: {
              [Op.gte]: thisMonth
            }
          }
        });

        return {
          today: todayCount,
          this_week: weekCount,
          this_month: monthCount
        };
      })()
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        users,
        contacts,
        deals,
        tickets,
        campaigns,
        storage,
        api_usage: apiUsage
      }
    });
  });

  // Add this with your other controller functions
// @desc    Get paginated audit logs
// @route   GET /api/admin/audit-logs
// @access  Private/Admin/Manager
export const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const { 
    page = 1, 
    limit = 20, 
    user_id, 
    action, 
    entity_type, 
    date_from, 
    date_to 
  } = req.query;

  const { limit: take, skip } = getPagination(page as string, limit as string);

  // Build where clause
  let whereClause: any = {};

  if (user_id) {
    whereClause.user_id = user_id;
  }

  if (action) {
    whereClause.action = action;
  }

  if (entity_type) {
    whereClause.entity_type = entity_type;
  }

  if (date_from || date_to) {
    whereClause.created_at = {};
    if (date_from) {
      whereClause.created_at[Op.gte] = date_from;
    }
    if (date_to) {
      // Set to end of day
      const endDate = new Date(date_to as string);
      endDate.setHours(23, 59, 59, 999);
      whereClause.created_at[Op.lte] = endDate;
    }
  }

  // Fetch audit logs with pagination
  const logs = await AuditLog.findAndCountAll({
    where: whereClause,
    limit: take,
    offset: skip,
    order: [['created_at', 'DESC']],
    attributes: ['id', 'user_id', 'action', 'entity_type', 'entity_id', 'details', 'ip_address', 'user_agent', 'created_at']
  });

  // Get unique user IDs from logs (filter out null values)
  const userIds = logs.rows
    .map(log => log.user_id)
    .filter((id): id is number => id !== null);

  // Fetch all users in one query
  let users: User[] = [];
  if (userIds.length > 0) {
    users = await User.findAll({
      where: { id: userIds },
      attributes: ['id', 'first_name', 'last_name', 'email', 'avatar']
    });
  }

  // Create a map for quick user lookup
  const userMap = new Map(users.map(user => [user.id, user]));

  // Attach user data to logs
  const enhancedLogs = logs.rows.map(log => {
    const user = log.user_id !== null ? userMap.get(log.user_id) : null;
    
    return {
      id: log.id,
      user_id: log.user_id,
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      details: log.details, // Keep as JSON string for list view
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      created_at: log.created_at,
      user: user ? {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        avatar: (user as any).avatar
      } : null
    };
  });

  const response = getPagingData(
    { count: logs.count, rows: enhancedLogs },
    page as string,
    limit as string
  );

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: response
  });
});

// @desc    Get detailed audit log by ID
// @route   GET /api/admin/audit-logs/:id/detail
// @access  Private/Admin
export const getAuditLogDetail = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const log = await AuditLog.findByPk(id);

  if (!log) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Audit log not found'
    });
  }

  // Parse the details JSON if it's stored as JSON string
  let parsedDetails = null;
  let isStructured = false;

  try {
    parsedDetails = JSON.parse(log.details);
    isStructured = true;
  } catch (e) {
    // Legacy text format - convert to structured format
    parsedDetails = {
      action: log.action,
      entity_id: log.entity_id,
      entity_name: 'Unknown',
      summary: log.details,
      changes: [],
      timestamp: log.created_at.toISOString(),
      user_id: log.user_id,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      is_legacy_format: true
    };
  }

  // Fetch user data separately using the user_id (handle null case)
  let user = null;
  if (log.user_id !== null) {
    user = await User.findByPk(log.user_id, {
      attributes: ['id', 'first_name', 'last_name', 'email']
    });
    
    if (user && !parsedDetails.user_name) {
      parsedDetails.user_name = `${user.first_name} ${user.last_name}`;
      parsedDetails.user_email = user.email;
    }
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      id: log.id,
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      created_at: log.created_at,
      user: user || { id: log.user_id, first_name: 'Unknown', last_name: 'User', email: null },
      details: parsedDetails,
      is_structured: isStructured,
      raw_details: log.details
    }
  });
});

// @desc    Get entity change history
// @route   GET /api/admin/audit-logs/entity/:entityType/:entityId
// @access  Private/Admin/Manager
export const getEntityChangeHistory = catchAsync(async (req: Request, res: Response) => {
  const { entityType, entityId } = req.params;
  const { page, limit } = req.query;

  const { limit: take, skip } = getPagination(page as string, limit as string);

  const logs = await AuditLog.findAndCountAll({
    where: {
      entity_type: entityType,
      entity_id: entityId
    },
    limit: take,
    offset: skip,
    order: [['created_at', 'DESC']]
  });

  // Get unique user IDs from logs (filter out null values)
  const userIds = logs.rows
    .map(log => log.user_id)
    .filter((id): id is number => id !== null);

  // Fetch all users in one query
  let users: User[] = [];
  if (userIds.length > 0) {
    users = await User.findAll({
      where: { id: userIds },
      attributes: ['id', 'first_name', 'last_name', 'email', 'avatar']
    });
  }
  
  // Create a map for quick user lookup
  const userMap = new Map(users.map(user => [user.id, user]));

  // Parse all details and attach user info
  const enhancedLogs = logs.rows.map(log => {
    let parsedDetails = null;
    try {
      parsedDetails = JSON.parse(log.details);
    } catch (e) {
      parsedDetails = { summary: log.details, changes: [] };
    }

    const user = log.user_id !== null ? userMap.get(log.user_id) : null;

    return {
      id: log.id,
      action: log.action,
      created_at: log.created_at,
      user: user || null,
      summary: parsedDetails.summary || log.details,
      changes: parsedDetails.changes || [],
      ip_address: log.ip_address
    };
  });

  const response = getPagingData(
    { count: logs.count, rows: enhancedLogs },
    page as string,
    limit as string
  );

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      entity_type: entityType,
      entity_id: parseInt(entityId),
      history: response
    }
  });
});

// @desc    Get audit log summary with statistics
// @route   GET /api/admin/audit-logs/summary
// @access  Private/Admin
export const getAuditLogSummary = catchAsync(async (req: Request, res: Response) => {
  const { days = 30, entity_type } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days as string));

  let whereClause: any = {
    created_at: {
      [Op.gte]: startDate
    }
  };

  if (entity_type) {
    whereClause.entity_type = entity_type;
  }

  // Get activity by action type
  const actionStats = await AuditLog.findAll({
    where: whereClause,
    attributes: [
      'action',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['action']
  });

  // Get activity by entity type
  const entityStats = await AuditLog.findAll({
    where: whereClause,
    attributes: [
      'entity_type',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['entity_type']
  });

  // Get activity by user (top 10)
  const userStats = await AuditLog.findAll({
    where: whereClause,
    attributes: [
      'user_id',
      [sequelize.fn('COUNT', sequelize.col('AuditLog.id')), 'count']
    ],
    group: ['user_id'],
    order: [[sequelize.literal('count'), 'DESC']],
    limit: 10,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }
    ]
  });

  // Daily activity trend
  const dailyStats = await AuditLog.findAll({
    where: whereClause,
    attributes: [
      [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: [sequelize.fn('DATE', sequelize.col('created_at'))],
    order: [[sequelize.literal('date'), 'ASC']]
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      period: {
        days: parseInt(days as string),
        start_date: startDate,
        end_date: new Date()
      },
      summary: {
        total_activities: await AuditLog.count({ where: whereClause }),
        unique_users: await AuditLog.count({ 
          where: whereClause,
          distinct: true,
          col: 'user_id'
        })
      },
      by_action: actionStats,
      by_entity: entityStats,
      by_user: userStats.map((stat: any) => ({
        user: stat.user,
        count: parseInt(stat.getDataValue('count'))
      })),
      daily_trend: dailyStats
    }
  });
});

  // @desc    Get user activity report
  // @route   GET /api/admin/user-activity
  // @access  Private/Admin/Manager
  export const getUserActivityReport = catchAsync(async (req: Request, res: Response) => {
    const { start_date, end_date, user_id } = req.query;

    const start = start_date ? new Date(start_date as string) : new Date(Date.now() - 30 * TIME.DAY);
    const end = end_date ? new Date(end_date as string) : new Date();

    let userWhere: any = {};
    if (user_id) {
      userWhere.id = user_id;
    }

    const users = await User.findAll({
      where: userWhere,
      attributes: ['id', 'first_name', 'last_name', 'role']
    });

    const userActivities = await Promise.all(
      users.map(async (user) => {
        const [
          contactsCreated,
          dealsCreated,
          ticketsCreated,
          ticketsResolved,
          campaignsSent,
          logins,
          totalActions
        ] = await Promise.all([
          Contact.count({
            where: {
              user_id: user.id,
              created_at: { [Op.between]: [start, end] }
            }
          }),
          Deal.count({
            where: {
              user_id: user.id,
              created_at: { [Op.between]: [start, end] }
            }
          }),
          Ticket.count({
            where: {
              user_id: user.id,
              created_at: { [Op.between]: [start, end] }
            }
          }),
          Ticket.count({
            where: {
              assigned_to: user.id,
              status: 'resolved',
              resolved_at: { [Op.between]: [start, end] }
            }
          }),
          Campaign.count({
            where: {
              user_id: user.id,
              created_at: { [Op.between]: [start, end] }
            }
          }),
          AuditLog.count({
            where: {
              user_id: user.id,
              action: 'LOGIN',
              created_at: { [Op.between]: [start, end] }
            }
          }),
          AuditLog.count({
            where: {
              user_id: user.id,
              created_at: { [Op.between]: [start, end] }
            }
          })
        ]);

        return {
          user_id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role,
          activities: {
            contacts_created: contactsCreated,
            deals_created: dealsCreated,
            tickets_created: ticketsCreated,
            tickets_resolved: ticketsResolved,
            campaigns_sent: campaignsSent,
            logins,
            total_actions: totalActions
          }
        };
      })
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        period: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        },
        users: userActivities
      }
    });
  });

// @desc    Create database backup
// @route   POST /api/admin/backup
// @access  Private/Admin
export const createBackup = catchAsync(async (req: Request, res: Response) => {
  // createDatabaseBackup now returns a number (backup ID)
  const backupId = await createDatabaseBackup();

  // Log audit

await createSimpleAudit(
  req.user.id,
  AUDIT_ACTIONS.CREATE,
  ENTITY_TYPES.BACKUP,
  backupId,
  `Database Backup ${backupId}`,
  req
);

  res.status(HTTP_STATUS.ACCEPTED).json({
    success: true,
    message: 'Backup started. You will be notified when complete.',
    data: {
      backup_id: backupId,
      estimated_time: '2 minutes'
    }
  });
});

// @desc    Get backup status
// @route   GET /api/admin/backup/:backup_id/status
// @access  Private/Admin
export const getBackupStatus = catchAsync(async (req: Request, res: Response) => {
  const { backup_id } = req.params;
  
  // Convert to number since our service expects a number
  const backupId = parseInt(backup_id, 10);
  
  if (isNaN(backupId)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Invalid backup ID'
    });
  }

  // Use the renamed imported function
  const status = await getBackupStatusService(backupId);

  if (!status) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Backup not found'
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: status
  });
});

  // @desc    Get system health
  // @route   GET /api/admin/health
  // @access  Private/Admin
  export const getSystemHealth = catchAsync(async (_req: Request, res: Response) => {
    // Check database connection
    let dbStatus = 'connected';
    try {
      await sequelize.authenticate();
    } catch (error) {
      dbStatus = 'disconnected';
    }

    // Check disk space
    const uploadDir = path.join(process.cwd(), 'uploads');
    let diskSpace = { used: 0, free: 0, total: 0 };
    
    if (fs.existsSync(uploadDir)) {
      const stats = fs.statfsSync(uploadDir);
      diskSpace = {
        total: stats.blocks * stats.bsize,
        free: stats.bfree * stats.bsize,
        used: (stats.blocks - stats.bfree) * stats.bsize
      };
    }

    // Get memory usage
    const memoryUsage = process.memoryUsage();

    // Get uptime
    const uptime = process.uptime();

    // Get active connections (approximate)
    const activeConnections = await AuditLog.count({
      where: {
        created_at: {
          [Op.gte]: new Date(Date.now() - 5 * TIME.MINUTE)
        }
      },
      distinct: true,
      col: 'user_id'
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        status: dbStatus === 'connected' ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        services: {
          database: {
            status: dbStatus,
            latency: await measureDatabaseLatency()
          },
          storage: {
            status: diskSpace.free > 1024 * 1024 * 1024 ? 'healthy' : 'warning', // 1GB free minimum
            used: formatBytes(diskSpace.used),
            free: formatBytes(diskSpace.free),
            total: formatBytes(diskSpace.total),
            usage_percentage: (diskSpace.used / diskSpace.total) * 100
          }
        },
        system: {
          uptime: formatUptime(uptime),
          memory: {
            heap_used: formatBytes(memoryUsage.heapUsed),
            heap_total: formatBytes(memoryUsage.heapTotal),
            rss: formatBytes(memoryUsage.rss),
            external: formatBytes(memoryUsage.external)
          },
          cpu_usage: process.cpuUsage(),
          active_connections: activeConnections
        }
      }
    });
  });

  // @desc    Get system configuration
  // @route   GET /api/admin/config
  // @access  Private/Admin
  export const getSystemConfig = catchAsync(async (_req: Request, res: Response) => {
    const config = {
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version,
      api_url: process.env.SERVER_URL,
      frontend_url: process.env.FRONTEND_URL,
      features: {
        email_verification: true,
        password_reset: true,
        two_factor_auth: false,
        social_login: false,
        api_rate_limiting: true,
        file_uploads: true,
        email_marketing: true,
        sla_tracking: true,
        audit_logs: true,
        backups: true
      },
      limits: {
        max_file_size: process.env.MAX_FILE_SIZE || '5MB',
        max_import_size: process.env.IMPORT_MAX_SIZE || '10MB',
        rate_limit: {
          window: '15 minutes',
          max_requests: process.env.RATE_LIMIT_MAX || 100
        },
        pagination: {
          default_limit: 20,
          max_limit: 100
        }
      },
      email: {
        provider: process.env.SMTP_HOST?.split('.')[1] || 'custom',
        from: process.env.EMAIL_FROM,
        templates_available: true
      }
    };

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: config
    });
  });

  // Helper functions
  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }

  async function measureDatabaseLatency(): Promise<number> {
    const start = Date.now();
    await sequelize.query('SELECT 1');
    return Date.now() - start;
  }
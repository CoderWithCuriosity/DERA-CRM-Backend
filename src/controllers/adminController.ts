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

  // @desc    Get audit logs
  // @route   GET /api/admin/audit-logs
  // @access  Private/Admin
  export const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
    const { page, limit, user_id, action, date_from, date_to } = req.query;

    const { limit: take, skip } = getPagination(page as string, limit as string);

    let whereClause: any = {};

    if (user_id) {
      whereClause.user_id = user_id;
    }

    if (action) {
      whereClause.action = action;
    }

    if (date_from || date_to) {
      whereClause.created_at = {};
      if (date_from) {
        whereClause.created_at[Op.gte] = new Date(date_from as string);
      }
      if (date_to) {
        whereClause.created_at[Op.lte] = new Date(date_to as string);
      }
    }

    const logs = await AuditLog.findAndCountAll({
      where: whereClause,
      limit: take,
      offset: skip, // Use the skip value as offset
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name']
        }
      ]
    });

    const response = getPagingData(logs, page as string, limit as string);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: response
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
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.CREATE,
    entity_type: ENTITY_TYPES.BACKUP,
    entity_id: backupId, // Use the actual backup ID instead of 0
    details: `Created database backup: ${backupId}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

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
import cron from 'node-cron';
import { Op } from 'sequelize';
import { 
  AuditLog, 
  RefreshToken, 
  PasswordReset,
  CampaignRecipient,
  Activity 
} from '../models';
import { ACTIVITY_STATUS, TIME } from '../config/constants';
import { cleanupOldFiles } from '../services/fileService';
import { cleanupOldExports } from '../services/exportService';
import { cleanupOldImports } from '../services/importService';
import logger from '../config/logger';

/**
 * Schedule all cleanup jobs
 */
export const scheduleCleanupJobs = (): void => {
  // Run daily at 3 AM
  cron.schedule('0 3 * * *', async () => {
    logger.info('Running daily cleanup jobs...');
    
    try {
      await Promise.all([
        cleanupOldAuditLogs(),
        cleanupExpiredTokens(),
        cleanupOldActivities(),
        cleanupOldCampaignData(),
        cleanupUploadedFiles(),
        cleanupOldExports(),
        cleanupOldImports()
      ]);

      logger.info('All cleanup jobs completed successfully');
    } catch (error) {
      logger.error('Error in cleanup jobs:', error);
    }
  });

  logger.info('Cleanup jobs scheduled for 3 AM daily');
};

/**
 * Clean up old audit logs
 */
export const cleanupOldAuditLogs = async (daysToKeep: number = 90): Promise<number> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const deleted = await AuditLog.destroy({
      where: {
        created_at: {
          [Op.lt]: cutoffDate
        }
      }
    });

    logger.info(`Cleaned up ${deleted} audit logs older than ${daysToKeep} days`);
    return deleted;
  } catch (error) {
    logger.error('Error cleaning up audit logs:', error);
    throw error;
  }
};

/**
 * Clean up expired refresh tokens
 */
export const cleanupExpiredTokens = async (): Promise<{ refresh: number; password: number }> => {
  try {
    const now = new Date();

    // Clean up expired refresh tokens
    const refreshDeleted = await RefreshToken.destroy({
      where: {
        [Op.or]: [
          { expires_at: { [Op.lt]: now } },
          { revoked: true }
        ]
      }
    });

    // Clean up expired password reset tokens
    const passwordDeleted = await PasswordReset.destroy({
      where: {
        [Op.or]: [
          { expires_at: { [Op.lt]: now } },
          { used: true }
        ]
      }
    });

    logger.info(`Cleaned up ${refreshDeleted} refresh tokens and ${passwordDeleted} password reset tokens`);
    
    return {
      refresh: refreshDeleted,
      password: passwordDeleted
    };
  } catch (error) {
    logger.error('Error cleaning up expired tokens:', error);
    throw error;
  }
};

/**
 * Clean up old completed/cancelled activities
 */
export const cleanupOldActivities = async (daysToKeep: number = 30): Promise<number> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const deleted = await Activity.destroy({
      where: {
        status: {
          [Op.in]: [ACTIVITY_STATUS.COMPLETED, ACTIVITY_STATUS.CANCELLED]
        },
        updated_at: {
          [Op.lt]: cutoffDate
        }
      }
    });

    logger.info(`Cleaned up ${deleted} old activities`);
    return deleted;
  } catch (error) {
    logger.error('Error cleaning up old activities:', error);
    throw error;
  }
};

/**
 * Clean up old campaign recipient data
 */
export const cleanupOldCampaignData = async (daysToKeep: number = 30): Promise<number> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const deleted = await CampaignRecipient.destroy({
      where: {
        status: {
          [Op.in]: ['sent', 'failed', 'bounced', 'unsubscribed']
        },
        updated_at: {
          [Op.lt]: cutoffDate
        }
      }
    });

    logger.info(`Cleaned up ${deleted} old campaign recipient records`);
    return deleted;
  } catch (error) {
    logger.error('Error cleaning up campaign data:', error);
    throw error;
  }
};

/**
 * Clean up uploaded files
 */
export const cleanupUploadedFiles = async (): Promise<void> => {
  try {
    // Clean up old avatar files (keep for 30 days)
    const avatarDeleted = await cleanupOldFiles('AVATAR_DIR', 30 * TIME.DAY);
    
    // Clean up old import files (keep for 7 days)
    const importDeleted = await cleanupOldFiles('IMPORT_DIR', 7 * TIME.DAY);
    
    // Clean up old export files (keep for 2 days)
    const exportDeleted = await cleanupOldFiles('EXPORT_DIR', 2 * TIME.DAY);
    
    // Clean up old attachments (keep for 90 days)
    const attachmentDeleted = await cleanupOldFiles('ATTACHMENT_DIR', 90 * TIME.DAY);

    logger.info(`Cleaned up files - Avatars: ${avatarDeleted}, Imports: ${importDeleted}, Exports: ${exportDeleted}, Attachments: ${attachmentDeleted}`);
  } catch (error) {
    logger.error('Error cleaning up uploaded files:', error);
    throw error;
  }
};

/**
 * Clean up orphaned records
 */
export const cleanupOrphanedRecords = async (): Promise<void> => {
  try {
    // Delete activities with no associated contact or deal
    const [orphanedActivities] = await sequelize.query(`
      DELETE FROM activities 
      WHERE contact_id IS NOT NULL 
      AND contact_id NOT IN (SELECT id FROM contacts)
    `);

    // Delete tickets with no associated contact
    const [orphanedTickets] = await sequelize.query(`
      DELETE FROM tickets 
      WHERE contact_id NOT IN (SELECT id FROM contacts)
    `);

    // Delete deals with no associated contact
    const [orphanedDeals] = await sequelize.query(`
      DELETE FROM deals 
      WHERE contact_id NOT IN (SELECT id FROM contacts)
    `);

    logger.info(`Cleaned up orphaned records - Activities: ${orphanedActivities}, Tickets: ${orphanedTickets}, Deals: ${orphanedDeals}`);
  } catch (error) {
    logger.error('Error cleaning up orphaned records:', error);
    throw error;
  }
};

/**
 * Clean up old notifications
 */
export const cleanupOldNotifications = async (daysToKeep: number = 30): Promise<number> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // This would be implemented when you add a notifications table
    // For now, just log
    logger.info(`Would clean up notifications older than ${daysToKeep} days`);
    
    return 0;
  } catch (error) {
    logger.error('Error cleaning up old notifications:', error);
    throw error;
  }
};

/**
 * Run all cleanup jobs on demand
 */
export const runAllCleanups = async (): Promise<void> => {
  logger.info('Running all cleanup jobs on demand...');
  
  const results = await Promise.allSettled([
    cleanupOldAuditLogs(),
    cleanupExpiredTokens(),
    cleanupOldActivities(),
    cleanupOldCampaignData(),
    cleanupUploadedFiles(),
    cleanupOldExports(),
    cleanupOldImports(),
    cleanupOrphanedRecords(),
    cleanupOldNotifications()
  ]);

  const summary = {
    successful: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length
  };

  logger.info(`Cleanup jobs completed - Successful: ${summary.successful}, Failed: ${summary.failed}`);
};

export default {
  scheduleCleanupJobs,
  cleanupOldAuditLogs,
  cleanupExpiredTokens,
  cleanupOldActivities,
  cleanupOldCampaignData,
  cleanupUploadedFiles,
  cleanupOrphanedRecords,
  cleanupOldNotifications,
  runAllCleanups
};
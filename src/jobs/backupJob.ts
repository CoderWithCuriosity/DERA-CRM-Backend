import cron from 'node-cron';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { Op } from 'sequelize';
import { Backup, User } from '../models';
import { sendEmail } from '../services/emailService';
import logger from '../config/logger';
import { formatDate } from '../utils/helpers/dateHelpers';
import { TIME } from '../config/constants';

const execPromise = util.promisify(exec);

/**
 * Backup configuration
 */
interface BackupConfig {
  retentionDays: number;
  backupPath: string;
  database: string;
  username: string;
  password: string;
  host: string;
  port: number;
}

/**
 * Get backup configuration from environment
 */
const getBackupConfig = (): BackupConfig => ({
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
  backupPath: process.env.BACKUP_PATH || path.join(process.cwd(), 'backups'),
  database: process.env.DB_NAME || 'dera_crm',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10)
});

/**
 * Ensure backup directory exists
 */
const ensureBackupDir = (): void => {
  const config = getBackupConfig();
  if (!fs.existsSync(config.backupPath)) {
    fs.mkdirSync(config.backupPath, { recursive: true });
    logger.info(`Created backup directory: ${config.backupPath}`);
  }
};

/**
 * Generate backup filename
 */
const generateBackupFilename = (): string => {
  const timestamp = formatDate(new Date(), 'YYYY-MM-DD-HHmmss');
  return `dera-crm-backup-${timestamp}.sql`;
};

/**
 * Create database backup using pg_dump
 */
export const createBackup = async (): Promise<{ success: boolean; filename?: string; error?: string }> => {
  const config = getBackupConfig();
  ensureBackupDir();

  const filename = generateBackupFilename();
  const filepath = path.join(config.backupPath, filename);

  // Create backup record
  const backup = await Backup.create({
    filename,
    path: filepath,
    size: 0,
    status: 'pending'
  });

  // Set PGPASSWORD environment variable for password authentication
  const env = {
    ...process.env,
    PGPASSWORD: config.password
  };

  const command = `pg_dump -h ${config.host} -p ${config.port} -U ${config.username} -d ${config.database} -F c -f "${filepath}"`;

  try {
    logger.info(`Starting database backup: ${filename}`);
    const { stdout, stderr } = await execPromise(command, { env });

    if (stderr) {
      logger.warn(`Backup warnings: ${stderr}`);
    }

    // Get file size
    const stats = fs.statSync(filepath);
    const sizeInMB = stats.size / (1024 * 1024);

    // Update backup record
    await backup.update({
      size: stats.size,
      status: 'completed',
      completed_at: new Date()
    });

    logger.info(`Backup completed successfully: ${filename} (${sizeInMB.toFixed(2)} MB)`);

    // Clean up old backups
    await cleanupOldBackups();

    return { success: true, filename };
  } catch (error) {
    logger.error('Backup failed:', error);
    
    // Update backup record with error
    await backup.update({
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error occurred',
      completed_at: new Date()
    });

    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * Restore database from backup
 */
export const restoreBackup = async (filename: string): Promise<{ success: boolean; error?: string }> => {
  const config = getBackupConfig();
  const filepath = path.join(config.backupPath, filename);

  if (!fs.existsSync(filepath)) {
    return { success: false, error: 'Backup file not found' };
  }

  const env = {
    ...process.env,
    PGPASSWORD: config.password
  };

  const command = `pg_restore -h ${config.host} -p ${config.port} -U ${config.username} -d ${config.database} -c "${filepath}"`;

  try {
    logger.info(`Starting database restore from: ${filename}`);
    const { stdout, stderr } = await execPromise(command, { env });

    if (stderr) {
      logger.warn(`Restore warnings: ${stderr}`);
    }

    logger.info(`Database restored successfully from: ${filename}`);
    
    // Log restore in audit
    await Backup.create({
      filename: `restore-${filename}`,
      path: filepath,
      size: fs.statSync(filepath).size,
      status: 'completed',
      completed_at: new Date()
    });

    return { success: true };
  } catch (error) {
    logger.error('Restore failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * List all backups
 */
export const listBackups = async (): Promise<any[]> => {
  const backups = await Backup.findAll({
    where: { status: 'completed' },
    order: [['created_at', 'DESC']]
  });

  return backups.map(backup => ({
    id: backup.id,
    filename: backup.filename,
    size: backup.size,
    size_formatted: formatBytes(backup.size),
    created_at: backup.created_at,
    status: backup.status
  }));
};

/**
 * Clean up old backups
 */
export const cleanupOldBackups = async (): Promise<number> => {
  const config = getBackupConfig();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);

  // Find old backups in database
  const oldBackups = await Backup.findAll({
    where: {
      created_at: {
        [Op.lt]: cutoffDate
      },
      status: 'completed'
    }
  });

  let deleted = 0;

  for (const backup of oldBackups) {
    try {
      // Delete file if exists
      if (fs.existsSync(backup.path)) {
        fs.unlinkSync(backup.path);
      }
      
      // Delete database record
      await backup.destroy();
      deleted++;
      
      logger.info(`Deleted old backup: ${backup.filename}`);
    } catch (error) {
      logger.error(`Failed to delete backup ${backup.filename}:`, error);
    }
  }

  if (deleted > 0) {
    logger.info(`Cleaned up ${deleted} old backup files`);
  }

  return deleted;
};

/**
 * Schedule backup job
 */
export const scheduleBackupJob = (): void => {
  // Run daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('Running scheduled backup job...');
    
    const result = await createBackup();
    
    if (result.success) {
      // Send success notification to admins
      await sendBackupNotification(true, result.filename);
    } else {
      // Send failure notification
      await sendBackupNotification(false, undefined, result.error);
    }
  });

  logger.info('Backup job scheduled for 2 AM daily');
};

/**
 * Send backup notification
 */
const sendBackupNotification = async (
  success: boolean,
  filename?: string,
  error?: string
): Promise<void> => {
  try {
    // Get admin users
    const admins = await User.findAll({
      where: { role: 'admin' },
      attributes: ['email', 'first_name']
    });

    const subject = success ? '✅ Backup Successful' : '❌ Backup Failed';
    const template = success ? 'backupSuccess' : 'backupFailed';

    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject,
        template,
        data: {
          first_name: admin.first_name,
          filename,
          error,
          timestamp: new Date().toLocaleString(),
          retention_days: getBackupConfig().retentionDays
        }
      });
    }
  } catch (error) {
    logger.error('Failed to send backup notification:', error);
  }
};

/**
 * Format bytes to human readable
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get backup status
 */
export const getBackupStatus = async (backupId: string): Promise<any> => {
  // Try to find by filename containing the ID
  const backup = await Backup.findOne({
    where: {
      filename: {
        [Op.like]: `%${backupId}%`
      }
    }
  });

  if (!backup) {
    return null;
  }

  return {
    backup_id: backupId,
    status: backup.status,
    size: formatBytes(backup.size),
    download_url: `/backups/${backup.filename}`,
    expires_at: new Date(Date.now() + 7 * TIME.DAY).toISOString(),
    completed_at: backup.completed_at?.toISOString()
  };
};

/**
 * Get backup statistics
 */
export const getBackupStats = async (): Promise<any> => {
  const total = await Backup.count();
  const successful = await Backup.count({ where: { status: 'completed' } });
  const failed = await Backup.count({ where: { status: 'failed' } });
  
  const totalSize = await Backup.sum('size', {
    where: { status: 'completed' }
  });

  const lastBackup = await Backup.findOne({
    where: { status: 'completed' },
    order: [['created_at', 'DESC']]
  });

  return {
    total_backups: total,
    successful_backups: successful,
    failed_backups: failed,
    total_size: formatBytes(totalSize || 0),
    last_backup: lastBackup ? {
      filename: lastBackup.filename,
      created_at: lastBackup.created_at,
      size: formatBytes(lastBackup.size)
    } : null
  };
};

export default {
  createBackup,
  restoreBackup,
  listBackups,
  cleanupOldBackups,
  scheduleBackupJob,
  getBackupStatus,
  getBackupStats
};
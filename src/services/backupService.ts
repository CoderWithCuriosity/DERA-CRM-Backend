import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { sequelize, Backup } from '../models';
import { BackupCreationAttributes } from '../models/Backup';

const execAsync = promisify(exec);

export interface BackupStatus {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  progress?: number; // For real-time progress (can be calculated)
  file_path?: string;
  file_size?: number;
  error?: string;
  started_at: Date;
  completed_at?: Date; // Keep as undefined to match the interface
}

/**
 * Create a database backup
 */
export const createBackup = async (): Promise<number> => {
  try {
    // Create backup directory if it doesn't exist
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Generate backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);

    // Create backup record in database
// Create backup record in database
const backup = await Backup.create({
  filename,
  path: filepath,
  size: 0,
  status: 'pending',
  error_message: null,
  completed_at: null
} as BackupCreationAttributes); // Add type assertion

    // Start backup process asynchronously
    processBackup(backup.id, filepath).catch(async (error) => {
      console.error('Backup failed:', error);
      await backup.update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date()
      });
    });

    return backup.id;

  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

/**
 * Process backup in background
 */
async function processBackup(backupId: number, filepath: string): Promise<void> {
  try {
    const backup = await Backup.findByPk(backupId);
    if (!backup) return;

    // Get database config from Sequelize
    const config = sequelize.config;
    const database = config.database as string;
    const username = config.username as string;
    const password = config.password as string;
    const host = config.host as string;
    
    // Safely convert port to number
    const port = config.port ? parseInt(config.port.toString(), 10) : 5432;

    // Use pg_dump for PostgreSQL
    const command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -f "${filepath}"`;
    
    // Set PGPASSWORD environment variable for password
    const env = {
      ...process.env,
      PGPASSWORD: password
    };

    await execAsync(command, { env });

    // Check if file was created
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      
      // Update backup record
      await backup.update({
        status: 'completed',
        size: stats.size,
        error_message: null,
        completed_at: new Date()
      });

      // Clean up old backups (keep last 10)
      await cleanOldBackups(10);
    } else {
      throw new Error('Backup file was not created');
    }

  } catch (error) {
    throw error;
  }
}

/**
 * Get backup status
 */
export const getBackupStatus = async (backupId: number): Promise<BackupStatus | null> => {
  const backup = await Backup.findByPk(backupId);
  
  if (!backup) {
    return null;
  }

  // Calculate progress based on status
  let progress = 0;
  if (backup.status === 'pending') progress = 10;
  else if (backup.status === 'completed') progress = 100;
  else if (backup.status === 'failed') progress = 0;

  return {
    id: backup.id.toString(),
    status: backup.status,
    progress,
    file_path: backup.path,
    file_size: backup.size,
    error: backup.error_message || undefined,
    started_at: backup.created_at,
    completed_at: backup.completed_at || undefined // Convert null to undefined
  };
};

/**
 * Clean up old backups, keeping only the most recent N
 */
async function cleanOldBackups(keepCount: number): Promise<void> {
  try {
    // Get completed backups ordered by created_at desc
    const backups = await Backup.findAll({
      where: {
        status: 'completed'
      },
      order: [['created_at', 'DESC']],
      limit: 100 // Get more than we need to find ones to delete
    });

    // Keep the most recent N, delete the rest
    const backupsToDelete = backups.slice(keepCount);

    for (const backup of backupsToDelete) {
      // Delete file if it exists
      if (fs.existsSync(backup.path)) {
        fs.unlinkSync(backup.path);
      }
      
      // Delete the database record entirely
      await backup.destroy(); // Delete the record instead of updating status
    }

    console.log(`Cleaned up ${backupsToDelete.length} old backups`);
  } catch (error) {
    console.error('Error cleaning old backups:', error);
  }
}

/**
 * Generate a unique backup ID
 */
export function generateBackupId(): string {
  return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Restore from backup (admin function)
 */
export const restoreFromBackup = async (backupId: number): Promise<boolean> => {
  const backup = await Backup.findByPk(backupId);
  
  if (!backup || backup.status !== 'completed') {
    throw new Error('Backup not found or not completed');
  }

  // Check if file exists
  if (!fs.existsSync(backup.path)) {
    throw new Error('Backup file not found on disk');
  }

  try {
    const config = sequelize.config;
    const database = config.database as string;
    const username = config.username as string;
    const password = config.password as string;
    const host = config.host as string;
    
    // Safely convert port to number
    const port = config.port ? parseInt(config.port.toString(), 10) : 5432;

    // Use psql to restore
    const command = `psql -h ${host} -p ${port} -U ${username} -d ${database} -f "${backup.path}"`;
    
    const env = {
      ...process.env,
      PGPASSWORD: password
    };

    await execAsync(command, { env });
    
    // Log the restore action
    console.log(`Database restored from backup: ${backup.id}`);
    
    return true;

  } catch (error) {
    console.error('Restore failed:', error);
    throw error;
  }
};

/**
 * List all backups
 */
export const listBackups = async (): Promise<Backup[]> => {
  return await Backup.findAll({
    order: [['created_at', 'DESC']]
  });
};
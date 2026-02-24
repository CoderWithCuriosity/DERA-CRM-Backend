import dotenv from 'dotenv';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { formatDate } from '../src/utils/helpers/dateHelpers';
import logger from '../src/config/logger';

dotenv.config();

const execPromise = util.promisify(exec);

/**
 * Database backup script
 * Usage: npm run backup
 */
const createBackup = async () => {
  try {
    // Get database configuration from environment
    const config = {
      database: process.env.DB_NAME || 'dera_crm',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      backupPath: process.env.BACKUP_PATH || path.join(process.cwd(), 'backups')
    };

    // Ensure backup directory exists
    if (!fs.existsSync(config.backupPath)) {
      fs.mkdirSync(config.backupPath, { recursive: true });
    }

    // Generate backup filename
    const timestamp = formatDate(new Date(), 'YYYY-MM-DD-HHmmss');
    const filename = `manual-backup-${timestamp}.sql`;
    const filepath = path.join(config.backupPath, filename);

    logger.info(`Starting database backup to: ${filename}`);

    // Set PGPASSWORD environment variable
    const env = {
      ...process.env,
      PGPASSWORD: config.password
    };

    // Execute pg_dump
    const command = `pg_dump -h ${config.host} -p ${config.port} -U ${config.username} -d ${config.database} -F c -f "${filepath}"`;
    
    const { stdout, stderr } = await execPromise(command, { env });

    if (stderr) {
      logger.warn(`Backup warnings: ${stderr}`);
    }

    // Get file size
    const stats = fs.statSync(filepath);
    const sizeInMB = stats.size / (1024 * 1024);

    logger.info(`
      ✅ Backup completed successfully!
      
      📁 Filename: ${filename}
      📂 Location: ${filepath}
      💾 Size: ${sizeInMB.toFixed(2)} MB
      📅 Created: ${new Date().toLocaleString()}
    `);

    process.exit(0);
  } catch (error) {
    logger.error('Backup failed:', error);
    process.exit(1);
  }
};

// Run the script
createBackup();
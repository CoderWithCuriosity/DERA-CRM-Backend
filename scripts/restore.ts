import dotenv from 'dotenv';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import readline from 'readline';
import logger from '../src/config/logger';

dotenv.config();

const execPromise = util.promisify(exec);

/**
 * Database restore script
 * Usage: npm run restore <backup-file>
 * Example: npm run restore backups/manual-backup-2024-01-01-120000.sql
 */
const restoreBackup = async () => {
  try {
    // Get backup filename from command line argument
    const backupFile = process.argv[2];
    
    if (!backupFile) {
      logger.error('Please provide a backup filename');
      logger.info('Usage: npm run restore <backup-file>');
      logger.info('Example: npm run restore backups/manual-backup-2024-01-01-120000.sql');
      process.exit(1);
    }

    // Get database configuration from environment
    const config = {
      database: process.env.DB_NAME || 'dera_crm',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
    };

    const filepath = path.isAbsolute(backupFile) 
      ? backupFile 
      : path.join(process.cwd(), backupFile);

    // Check if backup file exists
    if (!fs.existsSync(filepath)) {
      logger.error(`Backup file not found: ${filepath}`);
      process.exit(1);
    }

    // Get file info
    const stats = fs.statSync(filepath);
    const sizeInMB = stats.size / (1024 * 1024);

    logger.warn(`
      ⚠️  WARNING: Database Restore
      
      This will COMPLETELY OVERWRITE your current database!
      
      Database: ${config.database}@${config.host}
      Backup file: ${path.basename(filepath)}
      Backup size: ${sizeInMB.toFixed(2)} MB
      Created: ${stats.birthtime.toLocaleString()}
    `);

    // Ask for confirmation
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question('Type "YES" to confirm: ', resolve);
    });

    rl.close();

    if (answer !== 'YES') {
      logger.info('Restore cancelled');
      process.exit(0);
    }

    logger.info('Starting database restore...');

    // Set PGPASSWORD environment variable
    const env = {
      ...process.env,
      PGPASSWORD: config.password
    };

    // First, drop and recreate the database
    logger.info('Dropping existing database...');
    await execPromise(`dropdb -h ${config.host} -p ${config.port} -U ${config.username} ${config.database}`, { env })
      .catch(() => {
        // Ignore error if database doesn't exist
      });

    logger.info('Creating fresh database...');
    await execPromise(`createdb -h ${config.host} -p ${config.port} -U ${config.username} ${config.database}`, { env });

    // Restore from backup
    logger.info('Restoring from backup...');
    const command = `pg_restore -h ${config.host} -p ${config.port} -U ${config.username} -d ${config.database} -c "${filepath}"`;
    
    const { stdout, stderr } = await execPromise(command, { env });

    if (stderr) {
      logger.warn(`Restore warnings: ${stderr}`);
    }

    logger.info(`
      ✅ Database restored successfully!
      
      📁 Backup: ${path.basename(filepath)}
      🗄️  Database: ${config.database}
      📅 Restored: ${new Date().toLocaleString()}
    `);

    process.exit(0);
  } catch (error) {
    logger.error('Restore failed:', error);
    process.exit(1);
  }
};

// Run the script
restoreBackup();
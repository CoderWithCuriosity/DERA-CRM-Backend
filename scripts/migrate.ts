import dotenv from 'dotenv';
import { exec } from 'child_process';
import util from 'util';
import logger from '../src/config/logger';

dotenv.config();

const execPromise = util.promisify(exec);

/**
 * Database migration script
 * Usage: npm run db:migrate
 */
const runMigrations = async () => {
  try {
    logger.info('Running database migrations...');

    const { stdout, stderr } = await execPromise('npx sequelize-cli db:migrate');

    if (stderr) {
      logger.warn(`Migration warnings: ${stderr}`);
    }

    logger.info(stdout);
    logger.info('✅ Migrations completed successfully');

    process.exit(0);
  } catch (error) {
    logger.error('Migrations failed:', error);
    process.exit(1);
  }
};

// Run the script
runMigrations();
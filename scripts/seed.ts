import dotenv from 'dotenv';
import { exec } from 'child_process';
import util from 'util';
import logger from '../src/config/logger';

dotenv.config();

const execPromise = util.promisify(exec);

/**
 * Database seed script
 * Usage: npm run db:seed
 */
const runSeeds = async () => {
  try {
    logger.info('Running database seeds...');

    const { stdout, stderr } = await execPromise('npx sequelize-cli db:seed:all');

    if (stderr) {
      logger.warn(`Seed warnings: ${stderr}`);
    }

    logger.info(stdout);
    logger.info('✅ Seeds completed successfully');

    process.exit(0);
  } catch (error) {
    logger.error('Seeds failed:', error);
    process.exit(1);
  }
};

// Run the script
runSeeds();
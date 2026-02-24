import dotenv from 'dotenv';
import { runAllCleanups } from '../src/jobs/cleanupJob';
import sequelize from '../src/config/database';
import logger from '../src/config/logger';

dotenv.config();

/**
 * Manual cleanup script
 * Usage: npm run cleanup
 */
const runCleanup = async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    logger.info('Database connected successfully');

    logger.info('Starting manual cleanup...');

    // Run all cleanup jobs
    await runAllCleanups();

    logger.info(`
      ✅ Cleanup completed successfully!
      
      📅 Time: ${new Date().toLocaleString()}
    `);

    process.exit(0);
  } catch (error) {
    logger.error('Cleanup failed:', error);
    process.exit(1);
  }
};

// Run the script
runCleanup();
import dotenv from 'dotenv';
import { triggerJob } from '../src/jobs';
import sequelize from '../src/config/database';
import logger from '../src/config/logger';

dotenv.config();

/**
 * Manual job trigger script
 * Usage: npm run job:trigger <job-name>
 * Available jobs: backup, sla, digest, summary, cleanup
 * Example: npm run job:trigger backup
 */
const runJob = async () => {
  try {
    // Get job name from command line argument
    const jobName = process.argv[2];
    
    if (!jobName) {
      logger.error('Please provide a job name');
      logger.info('Available jobs: backup, sla, digest, summary, cleanup');
      logger.info('Usage: npm run job:trigger <job-name>');
      logger.info('Example: npm run job:trigger backup');
      process.exit(1);
    }

    // Connect to database
    await sequelize.authenticate();
    logger.info('Database connected successfully');

    logger.info(`Manually triggering job: ${jobName}`);

    // Trigger the job
    const result = await triggerJob(jobName);

    logger.info(`
      ✅ Job "${jobName}" completed successfully!
      
      📊 Result: ${JSON.stringify(result, null, 2)}
      📅 Time: ${new Date().toLocaleString()}
    `);

    process.exit(0);
  } catch (error) {
    logger.error(`Job failed:`, error);
    process.exit(1);
  }
};

// Run the script
runJob();
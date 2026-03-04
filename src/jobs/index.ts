import { scheduleBackupJob } from './backupJob';
import { initializeCampaignQueues, scheduleCampaignJobs } from './campaignScheduler';
import { scheduleSLAMonitor } from './slaMonitor';
import { scheduleDailyDigest } from './dailyDigest';
import { scheduleWeeklySummary } from './weeklySummary';
import { scheduleCleanupJobs } from './cleanupJob';
import logger from '../config/logger';

/**
 * Initialize all scheduled jobs
 */
export const initializeJobs = (): void => {
  try {
    logger.info('Initializing scheduled jobs...');

    // Initialize campaign queues
    initializeCampaignQueues();

    // Schedule backup job (daily at 2 AM)
    scheduleBackupJob();

    // Schedule campaign jobs (check every minute)
    scheduleCampaignJobs();

    // Schedule SLA monitor (every hour)
    scheduleSLAMonitor();

    // Schedule daily digest (daily at 8 AM)
    scheduleDailyDigest();

    // Schedule weekly summary (Monday at 9 AM)
    scheduleWeeklySummary();

    // Schedule cleanup jobs (daily at 3 AM)
    scheduleCleanupJobs();

    logger.info('All scheduled jobs initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize scheduled jobs:', error);
  }
};

// Export all job functions
export * from './backupJob';
export * from './campaignScheduler';
export * from './slaMonitor';
export * from './dailyDigest';
export * from './weeklySummary';
export * from './cleanupJob';

// Export a function to manually trigger jobs (for testing)
export const triggerJob = async (jobName: string): Promise<any> => {
  logger.info(`Manually triggering job: ${jobName}`);
  
  switch (jobName) {
    case 'backup':
      return await (await import('./backupJob')).createBackup();
    case 'sla':
       const slaMonitor = await import('./slaMonitor');
      return await slaMonitor.default.checkActualBreaches();
    case 'digest':
      const dailyDigest = await import('./dailyDigest');
      return await dailyDigest.default.sendDailyDigests();
    case 'summary':
      const weeklySummary = await import('./weeklySummary');
      return await weeklySummary.default.sendWeeklySummaries();
    case 'cleanup':
      const cleanupJob = await import('./cleanupJob');
      return await cleanupJob.runAllCleanups();
    default:
      throw new Error(`Unknown job: ${jobName}`);
  }
};
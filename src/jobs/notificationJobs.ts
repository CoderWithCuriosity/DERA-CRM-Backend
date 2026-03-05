import cron from 'node-cron';
import { notificationScheduler } from '../services/notificationService';
import logger from '../config/logger';

// Run every hour to check for upcoming activities and schedule reminders
export const startNotificationJobs = () => {
  // Check for activities that need reminders every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Running activity reminder check...');
    try {
      await notificationScheduler.checkAndScheduleReminders();
      logger.info('Activity reminder check completed');
    } catch (error) {
      logger.error('Error in activity reminder check:', error);
    }
  });

  logger.info('Notification jobs started');
};
import { Activity, User } from '../models';
import { sendEmail } from './emailService';
import logger from '../config/logger';
import { Op } from 'sequelize';

interface NotificationJob {
  id: string;
  type: 'activity_reminder';  // Only keep what you use
  userId: number;
  data: any;
  scheduledFor: Date;
  sent: boolean;
}

class NotificationScheduler {
  private jobs: Map<string, NotificationJob> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private checking = false;

  /**
   * Schedule a notification
   */
  schedule(job: Omit<NotificationJob, 'id' | 'sent'>): string {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const notificationJob: NotificationJob = {
      id,
      ...job,
      sent: false
    };
    
    this.jobs.set(id, notificationJob);
    
    // Calculate delay
    const now = new Date();
    const delay = job.scheduledFor.getTime() - now.getTime();
    
    if (delay <= 0) {
      // Send immediately if scheduled for now or past
      this.sendNotification(id);
    } else {
      // Schedule for future
      const timer = setTimeout(() => {
        this.sendNotification(id);
        this.timers.delete(id);
      }, delay);
      
      this.timers.set(id, timer);
    }
    
    return id;
  }

  /**
   * Send a notification
   */
  private async sendNotification(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    
    if (!job || job.sent) {
      return;
    }
    
    try {
      // Only one type now - activity_reminder
      await this.sendActivityReminder(job.data);
      
      job.sent = true;
      this.jobs.delete(jobId);
      
    } catch (error) {
      logger.error(`Failed to send notification ${jobId}:`, error);
    }
  }

  /**
   * Send activity reminder
   */
  private async sendActivityReminder(data: any): Promise<void> {
    const { activityId, userId, scheduledDate, subject } = data;
    
    const user = await User.findByPk(userId);
    if (!user || !user.email) return;

    const minutesUntil = Math.round((new Date(scheduledDate).getTime() - Date.now()) / (1000 * 60));
    
    await sendEmail({
      to: user.email,
      subject: `⏰ Reminder: ${subject}`,
      template: 'activityReminder',
      data: {
        first_name: user.first_name,
        activity_subject: subject,
        scheduled_time: new Date(scheduledDate).toLocaleString(),
        minutes_until: minutesUntil,
        activity_url: `${process.env.FRONTEND_URL}/activities/${activityId}`
      }
    });
    
    logger.info(`Activity reminder sent to ${user.email} for activity ${activityId}`);
  }

  /**
   * Cancel a scheduled notification
   */
  cancel(jobId: string): boolean {
    const timer = this.timers.get(jobId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(jobId);
    }
    return this.jobs.delete(jobId);
  }

  /**
   * Schedule activity reminder
   */
  async scheduleActivityReminder(activityId: number, scheduledDate: Date, userId: number): Promise<string> {
    const activity = await Activity.findByPk(activityId);
    if (!activity) {
      throw new Error('Activity not found');
    }

    // Schedule one reminder (30 minutes before)
    const reminderTime = new Date(scheduledDate);
    reminderTime.setMinutes(reminderTime.getMinutes() - 30);
    
    if (reminderTime > new Date()) {
      const jobData = {
        activityId: activity.id,
        userId,
        scheduledDate: activity.scheduled_date,
        subject: activity.subject
      };

      return this.schedule({
        type: 'activity_reminder',
        userId,
        data: jobData,
        scheduledFor: reminderTime
      });
    }

    return '';
  }

  /**
   * Check for upcoming activities and schedule reminders
   */
  async checkAndScheduleReminders(): Promise<void> {
    if (this.checking) return;
    
    this.checking = true;
    
    try {
      const now = new Date();
      const next24Hours = new Date();
      next24Hours.setHours(now.getHours() + 24);

      const activities = await Activity.findAll({
        where: {
          status: 'scheduled',
          scheduled_date: {
            [Op.between]: [now, next24Hours]
          }
        }
      });

      for (const activity of activities) {
        await this.scheduleActivityReminder(
          activity.id,
          activity.scheduled_date,
          activity.user_id
        );
      }
    } catch (error) {
      logger.error('Error checking and scheduling reminders:', error);
    } finally {
      this.checking = false;
    }
  }
}

// Create singleton instance
export const notificationScheduler = new NotificationScheduler();

// Export only what you need
export const scheduleActivityReminder = (
  activityId: number, 
  scheduledDate: Date, 
  userId: number
): Promise<string> => {
  return notificationScheduler.scheduleActivityReminder(activityId, scheduledDate, userId);
};

export default notificationScheduler;
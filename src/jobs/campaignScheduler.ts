import cron from 'node-cron';
import Queue from 'bull';
import { Op } from 'sequelize';
import { Campaign, CampaignRecipient, EmailTemplate, Contact } from '../models';
import { CAMPAIGN_STATUS } from '../config/constants';
import { sendEmail } from '../services/emailService';
import logger from '../config/logger';
import Redis from 'ioredis';

// Redis connection for Bull queue
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(redisUrl);

void redis;

// Create queues
export const campaignQueue = new Queue('campaign sending', redisUrl);
export const emailQueue = new Queue('email sending', redisUrl);

/**
 * Initialize campaign queues
 */
export const initializeCampaignQueues = (): void => {
  // Process campaign sending
  campaignQueue.process('send-campaign', async (job) => {
    const { campaignId } = job.data;
    await processCampaign(campaignId);
  });

  // Process individual email sending
  emailQueue.process('send-email', async (job) => {
    const { to, subject, html, campaignId, recipientId } = job.data;
    await sendCampaignEmail(to, subject, html, campaignId, recipientId);
  });

  // Queue event handlers
  campaignQueue.on('completed', (job) => {
    logger.info(`Campaign job ${job.id} completed successfully`);
  });

  campaignQueue.on('failed', (job, err) => {
    logger.error(`Campaign job ${job.id} failed:`, err);
  });

  emailQueue.on('completed', (job) => {
    logger.debug(`Email job ${job.id} completed`);
  });

  emailQueue.on('failed', (job, err) => {
    logger.error(`Email job ${job.id} failed:`, err);
  });

  logger.info('Campaign queues initialized');
};

/**
 * Schedule campaign jobs
 */
export const scheduleCampaignJobs = (): void => {
  // Check for scheduled campaigns every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      
      // Find campaigns that are scheduled and due
      const campaigns = await Campaign.findAll({
        where: {
          status: CAMPAIGN_STATUS.SCHEDULED,
          scheduled_at: {
            [Op.lte]: now
          }
        }
      });

      for (const campaign of campaigns) {
        logger.info(`Queueing scheduled campaign: ${campaign.name} (ID: ${campaign.id})`);
        
        await campaignQueue.add('send-campaign', {
          campaignId: campaign.id
        }, {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 60000 // 1 minute
          }
        });

        await campaign.update({ status: CAMPAIGN_STATUS.SENDING });
      }
    } catch (error) {
      logger.error('Error checking scheduled campaigns:', error);
    }
  });

  logger.info('Campaign scheduler started (checking every minute)');
};

/**
 * Queue a campaign for sending
 */
export const queueCampaign = async (
  campaignId: number,
  scheduledAt?: Date
): Promise<void> => {
  const delay = scheduledAt ? scheduledAt.getTime() - Date.now() : 0;

  await campaignQueue.add('send-campaign', {
    campaignId
  }, {
    delay: Math.max(0, delay),
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000
    }
  });

  logger.info(`Campaign ${campaignId} queued${scheduledAt ? ` for ${scheduledAt.toISOString()}` : ''}`);
};

/**
 * Process a campaign
 */
const processCampaign = async (campaignId: number): Promise<void> => {
  const campaign = await Campaign.findByPk(campaignId, {
    include: [
      {
        model: EmailTemplate,
        as: 'template'
      },
      {
        model: CampaignRecipient,
        as: 'recipients',
        where: { status: 'pending' },
        include: [
          {
            model: Contact,
            as: 'contact'
          }
        ]
      }
    ]
  }) as (Campaign & { 
    template: EmailTemplate;
    recipients: (CampaignRecipient & { contact: Contact })[];
  });;

  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  if (!campaign.template) {
    throw new Error(`Campaign ${campaignId} has no template`);
  }

  if (!campaign.recipients || campaign.recipients.length === 0) {
    logger.warn(`Campaign ${campaignId} has no pending recipients`);
    await campaign.update({ status: CAMPAIGN_STATUS.SENT });
    return;
  }

  logger.info(`Processing campaign ${campaignId} with ${campaign.recipients.length} recipients`);

  let sentCount = 0;
  const batchSize = 50;

  // Send emails in batches
  for (let i = 0; i < campaign.recipients.length; i += batchSize) {
    const batch = campaign.recipients.slice(i, i + batchSize);
    
    const promises = batch.map(recipient => 
      emailQueue.add('send-email', {
        to: recipient.contact?.email || recipient.email,
        subject: campaign.template!.subject,
        html: campaign.template!.body,
        campaignId: campaign.id,
        recipientId: recipient.id,
        templateData: {
          first_name: recipient.contact?.first_name,
          last_name: recipient.contact?.last_name,
          email: recipient.contact?.email,
          company: recipient.contact?.company
        }
      }, {
        attempts: 3,
        backoff: 60000
      })
    );

    await Promise.all(promises);
    sentCount += batch.length;

    // Update sent count
    await campaign.update({ sent_count: sentCount });

    // Rate limiting delay
    if (i + batchSize < campaign.recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  logger.info(`Campaign ${campaignId} queued ${sentCount} emails for sending`);
};

/**
 * Send a single campaign email
 */
const sendCampaignEmail = async (
  to: string,
  subject: string,
  html: string,
  campaignId: number,
  recipientId: number
): Promise<void> => {
  try {
    // Add tracking pixel
    const trackingPixel = `<img src="${process.env.SERVER_URL}/track/open/${campaignId}/${recipientId}" width="1" height="1" />`;
    const htmlWithTracking = html + trackingPixel;

    // Add click tracking
    const htmlWithClickTracking = addClickTracking(htmlWithTracking, campaignId, recipientId);

    await sendEmail({
      to,
      subject,
      template: 'campaign',
      data: {
        content: htmlWithClickTracking
      }
    });

    await CampaignRecipient.update(
      {
        status: 'sent',
        sent_at: new Date()
      },
      { where: { id: recipientId } }
    );

    logger.debug(`Email sent to ${to} for campaign ${campaignId}`);
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error);
    
    await CampaignRecipient.update(
      {
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      },
      { where: { id: recipientId } }
    );

    throw error;
  }
};

/**
 * Add click tracking to HTML
 */
const addClickTracking = (html: string, campaignId: number, recipientId: number): string => {
  const trackingUrl = `${process.env.SERVER_URL}/track/click/${campaignId}/${recipientId}`;
  
  return html.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"/g, (match, url) => {
    const encodedUrl = encodeURIComponent(url);
    return match.replace(url, `${trackingUrl}?url=${encodedUrl}`);
  });
};

/**
 * Track email open
 */
export const trackOpen = async (campaignId: number, recipientId: number): Promise<void> => {
  try {
    const recipient = await CampaignRecipient.findOne({
      where: {
        campaign_id: campaignId,
        id: recipientId
      }
    });

    if (recipient && recipient.status === 'sent') {
      await recipient.update({
        status: 'opened',
        opened_at: new Date()
      });

      await Campaign.increment('open_count', {
        by: 1,
        where: { id: campaignId }
      });

      logger.debug(`Open tracked for campaign ${campaignId}, recipient ${recipientId}`);
    }
  } catch (error) {
    logger.error('Error tracking open:', error);
  }
};

/**
 * Track email click
 */
export const trackClick = async (
  campaignId: number,
  recipientId: number,
  _url: string
): Promise<void> => {
  try {
    const recipient = await CampaignRecipient.findOne({
      where: {
        campaign_id: campaignId,
        id: recipientId
      }
    });

    if (recipient) {
      await recipient.update({
        status: 'clicked',
        clicked_at: new Date()
      });

      await Campaign.increment('click_count', {
        by: 1,
        where: { id: campaignId }
      });

      logger.debug(`Click tracked for campaign ${campaignId}, recipient ${recipientId}`);
    }
  } catch (error) {
    logger.error('Error tracking click:', error);
  }
};

/**
 * Get queue statistics
 */
export const getQueueStats = async (): Promise<any> => {
  const [campaignCounts, emailCounts] = await Promise.all([
    campaignQueue.getJobCounts(),
    emailQueue.getJobCounts()
  ]);

  return {
    campaign_queue: campaignCounts,
    email_queue: emailCounts
  };
};

/**
 * Pause queues (for maintenance)
 */
export const pauseQueues = async (): Promise<void> => {
  await campaignQueue.pause();
  await emailQueue.pause();
  logger.info('Campaign queues paused');
};

/**
 * Resume queues
 */
export const resumeQueues = async (): Promise<void> => {
  await campaignQueue.resume();
  await emailQueue.resume();
  logger.info('Campaign queues resumed');
};

/**
 * Clean old jobs
 */
export const cleanOldJobs = async (age: number = 24 * 60 * 60 * 1000): Promise<void> => {
  const date = new Date(Date.now() - age);
  
  await campaignQueue.clean(date.getTime(), 'completed');
  await campaignQueue.clean(date.getTime(), 'failed');
  await emailQueue.clean(date.getTime(), 'completed');
  await emailQueue.clean(date.getTime(), 'failed');
  
  logger.info(`Cleaned up jobs older than ${age / (60 * 60 * 1000)} hours`);
};

export default {
  campaignQueue,
  emailQueue,
  initializeCampaignQueues,
  scheduleCampaignJobs,
  queueCampaign,
  trackOpen,
  trackClick,
  getQueueStats,
  pauseQueues,
  resumeQueues,
  cleanOldJobs
};
import { Op } from 'sequelize';
import { Campaign, CampaignRecipient, EmailTemplate, Contact, ContactAttributes } from '../models';
import { CAMPAIGN_STATUS } from '../config/constants';
import { sendEmail } from './emailService';
import logger from '../config/logger';
import AppError from '../utils/AppError';
import { HTTP_STATUS } from '../config/constants';
import { queueCampaign } from '../jobs/campaignScheduler';

/**
 * Campaign analytics interface
 */
export interface CampaignAnalytics {
  campaign_id: number;
  name: string;
  summary: {
    sent: number;
    delivered: number;
    opens: number;
    unique_opens: number;
    clicks: number;
    unique_clicks: number;
    bounces: number;
    unsubscribes: number;
    complaints: number;
  };
  rates: {
    delivery_rate: number;
    open_rate: number;
    click_rate: number;
    click_to_open_rate: number;
    bounce_rate: number;
    unsubscribe_rate: number;
  };
  hourly_opens: Array<{ hour: string; opens: number }>;
  device_breakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  top_links: Array<{ url: string; clicks: number }>;
}

/**
 * Create campaign
 */
export const createCampaign = async (
  data: {
    name: string;
    template_id: number;
    user_id: number;
    scheduled_at?: Date;
    target_list: {
      contact_ids?: number[];
      filters?: any;
    };
  }
): Promise<Campaign> => {
  const { name, template_id, user_id, scheduled_at, target_list } = data;

  // Check if template exists
  const template = await EmailTemplate.findByPk(template_id);
  if (!template) {
    throw new AppError('Email template not found', HTTP_STATUS.NOT_FOUND);
  }

  // Process target list to get contact IDs
  let contactIds: number[] = [];
  let targetCount = 0;

  if (target_list.contact_ids && target_list.contact_ids.length > 0) {
    contactIds = target_list.contact_ids;
    targetCount = contactIds.length;
  } else if (target_list.filters) {
    // Build where clause from filters
    const whereClause: any = {};

    if (target_list.filters.tags) {
      whereClause.tags = { [Op.contains]: target_list.filters.tags };
    }

    if (target_list.filters.status) {
      whereClause.status = target_list.filters.status;
    }

    const contacts = await Contact.findAll({
      where: whereClause,
      attributes: ['id']
    });

    contactIds = contacts.map(c => c.id);
    targetCount = contactIds.length;
  }

  if (targetCount === 0) {
    throw new AppError('No contacts found for the target list', HTTP_STATUS.BAD_REQUEST);
  }

  // Create campaign
  const campaign = await Campaign.create({
    name,
    template_id,
    user_id,
    status: scheduled_at ? CAMPAIGN_STATUS.SCHEDULED : CAMPAIGN_STATUS.DRAFT,
    target_count: targetCount,
    scheduled_at: scheduled_at || null
  });

  // Create campaign recipients in batches
  const batchSize = 1000;
  for (let i = 0; i < contactIds.length; i += batchSize) {
    const batch = contactIds.slice(i, i + batchSize);
    const recipients = batch.map(contactId => ({
      campaign_id: campaign.id,
      contact_id: contactId,
      email: '', // Will be populated from contact when sending
      status: 'pending' as const
    }));

    await CampaignRecipient.bulkCreate(recipients);
  }

  // Queue campaign if scheduled
  if (scheduled_at) {
    await queueCampaign(campaign.id, scheduled_at);
  }

  return campaign;
};

/**
 * Send campaign
 */
export const sendCampaign = async (campaignId: number): Promise<void> => {
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
  });

  if (!campaign) {
    throw new AppError('Campaign not found', HTTP_STATUS.NOT_FOUND);
  }

  if (campaign.status !== CAMPAIGN_STATUS.SENDING && campaign.status !== CAMPAIGN_STATUS.SCHEDULED) {
    throw new AppError(`Campaign cannot be sent with status: ${campaign.status}`, HTTP_STATUS.BAD_REQUEST);
  }

  // Update campaign status
  await campaign.update({
    status: CAMPAIGN_STATUS.SENDING,
    sent_at: new Date()
  });

  let sentCount = 0;
  const recipients = campaign.recipients || [];

  // Send emails in batches with rate limiting
  const batchSize = 50;
  const delayBetweenBatches = 2000; // 2 seconds

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    await Promise.all(
      batch.map(recipient => sendCampaignEmail(campaign, recipient))
    );

    sentCount += batch.length;

    // Update sent count periodically
    if (sentCount % 100 === 0) {
      await campaign.update({ sent_count: sentCount });
    }

    // Rate limiting delay
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  // Final update
  await campaign.update({
    status: CAMPAIGN_STATUS.SENT,
    sent_count: sentCount
  });

  logger.info(`Campaign ${campaignId} sent successfully to ${sentCount} recipients`);
};

/**
 * Send single campaign email
 */
export const sendCampaignEmail = async (
  campaign: Campaign & { template: EmailTemplate },
  recipient: CampaignRecipient & { contact?: Contact }
): Promise<void> => {
  try {
    if (!recipient.contact) {
      throw new Error('Contact not found');
    }

    // Render email with contact data
    const preview = campaign.template.renderPreview({
      first_name: recipient.contact.first_name,
      last_name: recipient.contact.last_name,
      email: recipient.contact.email,
      company: recipient.contact.company
    });

    // Add tracking pixel
    const trackingPixel = `<img src="${process.env.SERVER_URL}/track/open/${campaign.id}/${recipient.id}" width="1" height="1" />`;
    const htmlWithTracking = preview.body + trackingPixel;

    // Add click tracking to links
    const htmlWithClickTracking = addClickTracking(htmlWithTracking, campaign.id, recipient.id);

    // Send email
    await sendEmail({
      to: recipient.contact.email,
      subject: preview.subject,
      template: 'campaign',
      data: {
        content: htmlWithClickTracking
      }
    });

    await recipient.update({
      status: 'sent',
      sent_at: new Date()
    });
  } catch (error) {
    const err = error as Error;
    logger.error(`Failed to send campaign email to recipient ${recipient.id}:`, err);

    await recipient.update({
      status: 'failed',
      error_message: err.message
    });
  }
};

/**
 * Add click tracking to HTML links
 */
export const addClickTracking = (html: string, campaignId: number, recipientId: number): string => {
  const trackingUrl = `${process.env.SERVER_URL}/track/click/${campaignId}/${recipientId}`;

  // Replace all href attributes with tracking URLs
  return html.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"/g, (match, url) => {
    const encodedUrl = encodeURIComponent(url);
    return match.replace(url, `${trackingUrl}?url=${encodedUrl}`);
  });
};

/**
 * Track email open
 */
export const trackOpen = async (campaignId: number, recipientId: number): Promise<void> => {
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

    // Update campaign open count
    await Campaign.increment('open_count', {
      by: 1,
      where: { id: campaignId }
    });
  }
};

/**
 * Track click
 */
export const trackClick = async (
  campaignId: number,
  recipientId: number,
  _url: string
): Promise<void> => {
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

    // Update campaign click count
    await Campaign.increment('click_count', {
      by: 1,
      where: { id: campaignId }
    });
  }
};

/**
 * Get campaign analytics
 */
export const getCampaignAnalytics = async (campaignId: number): Promise<CampaignAnalytics> => {
  const campaign = await Campaign.findByPk(campaignId, {
    include: [
      {
        model: CampaignRecipient,
        as: 'recipients'
      }
    ]
  }) as Campaign & {
    recipients: CampaignRecipient[];
  };

  if (!campaign) {
    throw new AppError('Campaign not found', HTTP_STATUS.NOT_FOUND);
  }

  const recipients = campaign.recipients || [];

  // Calculate metrics
  const summary = {
    sent: campaign.sent_count,
    delivered: recipients.filter(r => r.status !== 'bounced' && r.status !== 'failed').length,
    opens: campaign.open_count,
    unique_opens: campaign.open_count,
    clicks: campaign.click_count,
    unique_clicks: campaign.click_count,
    bounces: recipients.filter(r => r.status === 'bounced').length,
    unsubscribes: recipients.filter(r => r.status === 'unsubscribed').length,
    complaints: 0 // Track separately
  };

  const rates = {
    delivery_rate: (summary.delivered / summary.sent) * 100 || 0,
    open_rate: campaign.openRate,
    click_rate: campaign.clickRate,
    click_to_open_rate: campaign.clickToOpenRate,
    bounce_rate: (summary.bounces / summary.sent) * 100 || 0,
    unsubscribe_rate: (summary.unsubscribes / summary.sent) * 100 || 0
  };

  // Generate hourly opens (mock data - implement with real tracking)
  const hourlyOpens = generateHourlyData();

  // Device breakdown (mock data)
  const deviceBreakdown = {
    desktop: 65,
    mobile: 30,
    tablet: 5
  };

  // Top links (mock data)
  const topLinks = [
    { url: 'https://deracrm.com/features', clicks: 18 },
    { url: 'https://deracrm.com/pricing', clicks: 12 },
    { url: 'https://deracrm.com/blog', clicks: 4 }
  ];

  return {
    campaign_id: campaign.id,
    name: campaign.name,
    summary,
    rates,
    hourly_opens: hourlyOpens,
    device_breakdown: deviceBreakdown,
    top_links: topLinks
  };
};

/**
 * Generate hourly data for analytics
 */
const generateHourlyData = (): Array<{ hour: string; opens: number }> => {
  const data = [];
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0') + ':00';
    data.push({
      hour,
      opens: Math.floor(Math.random() * 50)
    });
  }
  return data;
};

/**
 * Duplicate campaign
 */
export const duplicateCampaign = async (campaignId: number, userId: number): Promise<Campaign> => {
  const campaign = await Campaign.findByPk(campaignId, {
    include: [
      {
        model: CampaignRecipient,
        as: 'recipients'
      }
    ]
  }) as Campaign & {
    recipients: CampaignRecipient[]
  };

  if (!campaign) {
    throw new AppError('Campaign not found', HTTP_STATUS.NOT_FOUND);
  }

  // Create duplicate with unique name
  const duplicateName = `${campaign.name} (Copy)`;
  let finalName = duplicateName;
  let counter = 1;

  while (await Campaign.findOne({ where: { name: finalName } })) {
    finalName = `${duplicateName} ${counter}`;
    counter++;
  }

  const duplicate = await Campaign.create({
    name: finalName,
    template_id: campaign.template_id,
    user_id: userId,
    status: CAMPAIGN_STATUS.DRAFT,
    target_count: campaign.target_count
  });

  // Duplicate recipients in batches
  if (campaign.recipients && campaign.recipients.length > 0) {
    const batchSize = 1000;
    for (let i = 0; i < campaign.recipients.length; i += batchSize) {
      const batch = campaign.recipients.slice(i, i + batchSize);
      const recipients = batch.map(r => ({
        campaign_id: duplicate.id,
        contact_id: r.contact_id,
        email: r.email,
        status: 'pending' as const
      }));

      await CampaignRecipient.bulkCreate(recipients);
    }
  }

  return duplicate;
};

/**
 * Cancel campaign
 */
export const cancelCampaign = async (campaignId: number): Promise<Campaign> => {
  const campaign = await Campaign.findByPk(campaignId);

  if (!campaign) {
    throw new AppError('Campaign not found', HTTP_STATUS.NOT_FOUND);
  }

  if (campaign.status !== CAMPAIGN_STATUS.DRAFT && campaign.status !== CAMPAIGN_STATUS.SCHEDULED) {
    throw new AppError(`Cannot cancel campaign with status: ${campaign.status}`, HTTP_STATUS.BAD_REQUEST);
  }

  await campaign.update({ status: CAMPAIGN_STATUS.CANCELLED });

  return campaign;
};

/**
 * Validate campaign before sending
 */
/**
 * Validate campaign before sending
 */
export const validateCampaign = async (campaignId: number): Promise<boolean> => {
  const campaign = await Campaign.findByPk(campaignId, {
    include: [
      {
        model: EmailTemplate,
        as: 'template'
      },
      {
        model: CampaignRecipient,
        as: 'recipients',
        where: { status: 'pending' }
      }
    ]
  }) as Campaign & {
    template: EmailTemplate;
    recipients: CampaignRecipient[]
  };

  if (!campaign) {
    throw new AppError('Campaign not found', HTTP_STATUS.NOT_FOUND);
  }

  // Check if template exists
  if (!campaign.template) {
    throw new AppError('Email template not found', HTTP_STATUS.BAD_REQUEST);
  }

  // Check if there are recipients
  if (!campaign.recipients || campaign.recipients.length === 0) {
    throw new AppError('No pending recipients found', HTTP_STATUS.BAD_REQUEST);
  }

  // Validate template variables
  const variables = campaign.template.variables || [];
  
  // Define which Contact fields are available for templates
  const validContactFields: (keyof ContactAttributes)[] = [
    'first_name',
    'last_name', 
    'email',
    'company',
    'job_title',
    'phone',
    'status',
    'source',
    'notes',
    'tags'
  ];

  for (const recipient of campaign.recipients) {
    const contact = await Contact.findByPk(recipient.contact_id);
    if (contact) {
      const contactData = contact.toJSON() as ContactAttributes;
      
      for (const variable of variables) {
        // Check if variable is a valid contact field
        if (validContactFields.includes(variable as keyof ContactAttributes)) {
          const key = variable as keyof ContactAttributes;
          if (!contactData[key]) {
            logger.warn(`Missing variable ${variable} for contact ${contact.id}`);
          }
        } else {
          logger.warn(`Variable ${variable} is not a valid contact field for contact ${contact.id}`);
        }
      }
    }
  }

  return true;
};
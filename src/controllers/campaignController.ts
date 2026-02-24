import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { Campaign, EmailTemplate, Contact, CampaignRecipient, AuditLog, User } from '../models';
import { 
  HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES, 
  CAMPAIGN_STATUS, AUDIT_ACTIONS, ENTITY_TYPES 
} from '../config/constants';
import catchAsync from '../utils/catchAsync';
import { getPagination, getPagingData } from '../utils/pagination';
import { sendCampaignEmail } from '../services/emailService';
import { queueCampaign } from '../jobs/campaignScheduler';
import { v4 as uuidv4 } from 'uuid';

// @desc    Create campaign
// @route   POST /api/campaigns
// @access  Private
export const createCampaign = catchAsync(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.VALIDATION_FAILED,
      errors: errors.array()
    });
  }

  const { name, template_id, target_list, scheduled_at } = req.body;

  // Check if template exists
  const template = await EmailTemplate.findByPk(template_id);
  if (!template) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Email template')
    });
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
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'No contacts found for the target list'
    });
  }

  const campaign = await Campaign.create({
    name,
    template_id,
    user_id: req.user.id,
    status: scheduled_at ? CAMPAIGN_STATUS.SCHEDULED : CAMPAIGN_STATUS.DRAFT,
    target_count: targetCount,
    scheduled_at: scheduled_at || null
  });

  // Create campaign recipients
  const recipients = contactIds.map(contactId => ({
    campaign_id: campaign.id,
    contact_id: contactId,
    email: '', // Will be populated from contact
    status: 'pending'
  }));

  await CampaignRecipient.bulkCreate(recipients);

  // Fetch created campaign with associations
  const createdCampaign = await Campaign.findByPk(campaign.id, {
    include: [
      {
        model: EmailTemplate,
        as: 'template',
        attributes: ['id', 'name', 'subject']
      }
    ]
  });

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.CREATE,
    entity_type: ENTITY_TYPES.CAMPAIGN,
    entity_id: campaign.id,
    details: `Created campaign: ${campaign.name}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  // Queue campaign if scheduled
  if (scheduled_at) {
    await queueCampaign(campaign.id, scheduled_at);
  }

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: SUCCESS_MESSAGES.CREATED('Campaign'),
    data: { campaign: createdCampaign }
  });
});

// @desc    Get all campaigns
// @route   GET /api/campaigns
// @access  Private
export const getCampaigns = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, status, search } = req.query;

  const { limit: take, offset } = getPagination(page as string, limit as string);

  let whereClause: any = {};

  if (status) {
    whereClause.status = status;
  }

  if (search) {
    whereClause.name = { [Op.iLike]: `%${search}%` };
  }

  // Role-based filtering
  if (req.user.role === 'agent') {
    whereClause.user_id = req.user.id;
  }

  const campaigns = await Campaign.findAndCountAll({
    where: whereClause,
    limit: take,
    offset,
    order: [['created_at', 'DESC']],
    include: [
      {
        model: EmailTemplate,
        as: 'template',
        attributes: ['id', 'name', 'subject']
      }
    ]
  });

  // Enhance campaigns with rates
  const enhancedCampaigns = campaigns.rows.map(campaign => {
    const campaignData = campaign.toJSON();
    return {
      ...campaignData,
      open_rate: campaign.openRate,
      click_rate: campaign.clickRate
    };
  });

  const response = getPagingData(
    { count: campaigns.count, rows: enhancedCampaigns },
    page as string,
    limit as string
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: response
  });
});

// @desc    Get campaign by ID
// @route   GET /api/campaigns/:id
// @access  Private
export const getCampaignById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const campaign = await Campaign.findByPk(id, {
    include: [
      {
        model: EmailTemplate,
        as: 'template'
      },
      {
        model: User,
        as: 'createdBy',
        attributes: ['id', 'first_name', 'last_name']
      },
      {
        model: CampaignRecipient,
        as: 'recipients',
        include: [
          {
            model: Contact,
            as: 'contact',
            attributes: ['id', 'first_name', 'last_name', 'email']
          }
        ],
        limit: 100,
        order: [['created_at', 'DESC']]
      }
    ]
  });

  if (!campaign) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Campaign')
    });
  }

  // Calculate analytics
  const analytics = {
    open_rate: campaign.openRate,
    click_rate: campaign.clickRate,
    click_to_open_rate: campaign.clickToOpenRate,
    unique_opens: campaign.open_count,
    unique_clicks: campaign.click_count,
    bounces: campaign.recipients?.filter(r => r.status === 'bounced').length || 0,
    unsubscribes: campaign.recipients?.filter(r => r.status === 'unsubscribed').length || 0,
    complaints: 0 // Track separately
  };

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      campaign,
      analytics
    }
  });
});

// @desc    Update campaign
// @route   PUT /api/campaigns/:id
// @access  Private
export const updateCampaign = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const campaign = await Campaign.findByPk(id);

  if (!campaign) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Campaign')
    });
  }

  // Check permission
  if (req.user.role === 'agent' && campaign.user_id !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  // Can only update draft or scheduled campaigns
  if (campaign.status !== CAMPAIGN_STATUS.DRAFT && campaign.status !== CAMPAIGN_STATUS.SCHEDULED) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `Cannot update campaign with status: ${campaign.status}`
    });
  }

  await campaign.update(updates);

  // Reschedule if scheduled_at changed
  if (updates.scheduled_at && campaign.status === CAMPAIGN_STATUS.SCHEDULED) {
    await queueCampaign(campaign.id, updates.scheduled_at);
  }

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity_type: ENTITY_TYPES.CAMPAIGN,
    entity_id: campaign.id,
    details: `Updated campaign: ${campaign.name}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.UPDATED('Campaign'),
    data: { campaign }
  });
});

// @desc    Send campaign
// @route   POST /api/campaigns/:id/send
// @access  Private
export const sendCampaign = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { send_immediately } = req.body;

  const campaign = await Campaign.findByPk(id, {
    include: [
      {
        model: EmailTemplate,
        as: 'template'
      },
      {
        model: CampaignRecipient,
        as: 'recipients',
        include: [
          {
            model: Contact,
            as: 'contact'
          }
        ]
      }
    ]
  });

  if (!campaign) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Campaign')
    });
  }

  // Check permission
  if (req.user.role === 'agent' && campaign.user_id !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  // Validate campaign status
  if (campaign.status === CAMPAIGN_STATUS.SENT) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Campaign already sent'
    });
  }

  if (campaign.status === CAMPAIGN_STATUS.SENDING) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Campaign is already being sent'
    });
  }

  // Update status
  await campaign.update({
    status: send_immediately ? CAMPAIGN_STATUS.SENDING : CAMPAIGN_STATUS.SCHEDULED,
    sent_at: send_immediately ? new Date() : null
  });

  if (send_immediately) {
    // Process campaign asynchronously
    processCampaign(campaign.id).catch(console.error);
  }

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity_type: ENTITY_TYPES.CAMPAIGN,
    entity_id: campaign.id,
    details: `Started sending campaign: ${campaign.name}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: send_immediately ? 'Campaign sending started' : 'Campaign scheduled',
    data: {
      campaign,
      estimated_time: send_immediately ? `${Math.ceil(campaign.target_count / 10)} minutes` : null
    }
  });
});

// @desc    Cancel campaign
// @route   POST /api/campaigns/:id/cancel
// @access  Private
export const cancelCampaign = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const campaign = await Campaign.findByPk(id);

  if (!campaign) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Campaign')
    });
  }

  // Check permission
  if (req.user.role === 'agent' && campaign.user_id !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  // Can only cancel draft or scheduled campaigns
  if (campaign.status !== CAMPAIGN_STATUS.DRAFT && campaign.status !== CAMPAIGN_STATUS.SCHEDULED) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `Cannot cancel campaign with status: ${campaign.status}`
    });
  }

  await campaign.update({ status: CAMPAIGN_STATUS.CANCELLED });

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity_type: ENTITY_TYPES.CAMPAIGN,
    entity_id: campaign.id,
    details: `Cancelled campaign: ${campaign.name}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Campaign cancelled successfully',
    data: { campaign }
  });
});

// @desc    Send test email
// @route   POST /api/campaigns/:id/test
// @access  Private
export const sendTestEmail = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { test_email, test_data } = req.body;

  const campaign = await Campaign.findByPk(id, {
    include: [
      {
        model: EmailTemplate,
        as: 'template'
      }
    ]
  });

  if (!campaign) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Campaign')
    });
  }

  // Render email with test data
  const preview = campaign.template.renderPreview(test_data || {});

  // Send test email
  const emailId = await sendCampaignEmail({
    to: test_email,
    subject: `[TEST] ${preview.subject}`,
    html: preview.body,
    campaign_id: campaign.id,
    track_opens: true,
    track_clicks: true
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Test email sent successfully',
    data: {
      email_id: emailId,
      sent_to: test_email
    }
  });
});

// @desc    Get campaign analytics
// @route   GET /api/campaigns/:id/analytics
// @access  Private
export const getCampaignAnalytics = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const campaign = await Campaign.findByPk(id, {
    include: [
      {
        model: CampaignRecipient,
        as: 'recipients'
      }
    ]
  });

  if (!campaign) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Campaign')
    });
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
    complaints: 0
  };

  const rates = {
    delivery_rate: (summary.delivered / summary.sent) * 100 || 0,
    open_rate: campaign.openRate,
    click_rate: campaign.clickRate,
    click_to_open_rate: campaign.clickToOpenRate,
    bounce_rate: (summary.bounces / summary.sent) * 100 || 0,
    unsubscribe_rate: (summary.unsubscribes / summary.sent) * 100 || 0
  };

  // Get hourly opens (mock data - implement real tracking)
  const hourlyOpens = [];
  for (let i = 9; i <= 17; i++) {
    hourlyOpens.push({
      hour: `${i.toString().padStart(2, '0')}:00`,
      opens: Math.floor(Math.random() * 30)
    });
  }

  // Get device breakdown (mock data)
  const deviceBreakdown = {
    desktop: 65,
    mobile: 30,
    tablet: 5
  };

  // Get top links (mock data)
  const topLinks = [
    { url: 'https://deracrm.com/features', clicks: 18 },
    { url: 'https://deracrm.com/pricing', clicks: 12 },
    { url: 'https://deracrm.com/blog', clicks: 4 }
  ];

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      campaign_id: campaign.id,
      name: campaign.name,
      summary,
      rates,
      hourly_opens: hourlyOpens,
      device_breakdown: deviceBreakdown,
      top_links: topLinks
    }
  });
});

// @desc    Duplicate campaign
// @route   POST /api/campaigns/:id/duplicate
// @access  Private
export const duplicateCampaign = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const campaign = await Campaign.findByPk(id, {
    include: [
      {
        model: CampaignRecipient,
        as: 'recipients'
      }
    ]
  });

  if (!campaign) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Campaign')
    });
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
    user_id: req.user.id,
    status: CAMPAIGN_STATUS.DRAFT,
    target_count: campaign.target_count
  });

  // Duplicate recipients
  if (campaign.recipients && campaign.recipients.length > 0) {
    const recipients = campaign.recipients.map(r => ({
      campaign_id: duplicate.id,
      contact_id: r.contact_id,
      email: r.email,
      status: 'pending'
    }));

    await CampaignRecipient.bulkCreate(recipients);
  }

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.CREATE,
    entity_type: ENTITY_TYPES.CAMPAIGN,
    entity_id: duplicate.id,
    details: `Duplicated campaign from: ${campaign.name}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Campaign duplicated successfully',
    data: { campaign: duplicate }
  });
});

// Helper function to process campaign sending
async function processCampaign(campaignId: number) {
  const campaign = await Campaign.findByPk(campaignId, {
    include: [
      {
        model: EmailTemplate,
        as: 'template'
      },
      {
        model: CampaignRecipient,
        as: 'recipients',
        include: [
          {
            model: Contact,
            as: 'contact'
          }
        ]
      }
    ]
  });

  if (!campaign || campaign.status !== CAMPAIGN_STATUS.SENDING) {
    return;
  }

  let sentCount = 0;

  for (const recipient of campaign.recipients || []) {
    if (recipient.status !== 'pending') continue;

    try {
      // Render email with contact data
      const preview = campaign.template.renderPreview({
        first_name: recipient.contact?.first_name,
        last_name: recipient.contact?.last_name,
        email: recipient.contact?.email,
        company: recipient.contact?.company
      });

      // Send email
      await sendCampaignEmail({
        to: recipient.contact?.email || recipient.email,
        subject: preview.subject,
        html: preview.body,
        campaign_id: campaign.id,
        recipient_id: recipient.id,
        track_opens: true,
        track_clicks: true
      });

      await recipient.update({
        status: 'sent',
        sent_at: new Date()
      });

      sentCount++;

      // Update campaign sent count periodically
      if (sentCount % 10 === 0) {
        await campaign.update({
          sent_count: campaign.sent_count + 10
        });
      }
    } catch (error) {
      console.error(`Failed to send to recipient ${recipient.id}:`, error);
      await recipient.update({
        status: 'failed',
        error_message: error.message
      });
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Final update
  await campaign.update({
    status: CAMPAIGN_STATUS.SENT,
    sent_count: campaign.sent_count + (sentCount % 10)
  });
}
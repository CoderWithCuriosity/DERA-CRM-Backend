import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Op, Order } from 'sequelize';
import { Campaign, EmailTemplate, Contact, CampaignRecipient, AuditLog, User, Organization } from '../models';
import { 
  HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES, 
  CAMPAIGN_STATUS, AUDIT_ACTIONS, ENTITY_TYPES, CAMPAIGN_RECIPIENT_STATUS
} from '../config/constants';
import catchAsync from '../utils/catchAsync';
import { getPagination, getPagingData } from '../utils/pagination';
import { sendEmail } from '../services/emailService';
import { queueCampaign } from '../jobs/campaignScheduler';

// Define interfaces for type safety - Fix: Don't extend Campaign, use composition instead
interface CampaignWithAssociations {
  id: number;
  name: string;
  template_id: number;
  user_id: number;
  status: string;
  target_count: number;
  scheduled_at: Date | null;
  sent_at: Date | null;
  sent_count: number;
  open_count: number;
  click_count: number;
  created_at: Date;
  updated_at: Date;
  template?: EmailTemplate;
  createdBy?: User;
  recipients?: CampaignRecipientWithContact[];
  openRate?: number;
  clickRate?: number;
  clickToOpenRate?: number;
}

interface CampaignRecipientWithContact extends CampaignRecipient {
  contact?: Contact;
}

interface ContactWithEmail extends Contact {
  email: string;
}

// Helper function to convert Campaign to CampaignWithAssociations
function toCampaignWithAssociations(campaign: Campaign, extras: Partial<CampaignWithAssociations> = {}): CampaignWithAssociations {
  return {
    id: campaign.id,
    name: campaign.name,
    template_id: campaign.template_id,
    user_id: campaign.user_id,
    status: campaign.status,
    target_count: campaign.target_count,
    scheduled_at: campaign.scheduled_at,
    sent_at: campaign.sent_at,
    sent_count: campaign.sent_count,
    open_count: campaign.open_count,
    click_count: campaign.click_count,
    created_at: campaign.created_at,
    updated_at: campaign.updated_at,
    ...extras
  };
}

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
      attributes: ['id', 'email']
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
    user_id: (req.user as any).id,
    status: scheduled_at ? CAMPAIGN_STATUS.SCHEDULED : CAMPAIGN_STATUS.DRAFT,
    target_count: targetCount,
    scheduled_at: scheduled_at || null
  });

  // Get contacts with emails
  const contacts = await Contact.findAll({
    where: { id: contactIds },
    attributes: ['id', 'email']
  }) as ContactWithEmail[];

  // Create campaign recipients with proper status type
  const recipients = contacts.map(contact => ({
    campaign_id: campaign.id,
    contact_id: contact.id,
    email: contact.email || '',
    status: CAMPAIGN_RECIPIENT_STATUS.PENDING
  }));

  await CampaignRecipient.bulkCreate(recipients);

  // Fetch created campaign with associations
  const campaignWithTemplate = await Campaign.findByPk(campaign.id, {
    include: [
      {
        model: EmailTemplate,
        as: 'template',
        attributes: ['id', 'name', 'subject']
      }
    ]
  });

  const createdCampaign = campaignWithTemplate ? toCampaignWithAssociations(campaignWithTemplate, {
    template: campaignWithTemplate.get('template') as EmailTemplate | undefined
  }) : null;

  // Log audit
  await AuditLog.create({
    user_id: (req.user as any).id,
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

  return res.status(HTTP_STATUS.CREATED).json({
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

  // Fix pagination
  const pagination = getPagination(page as string, limit as string);
  const take = pagination.limit;
  const skip = pagination.skip;

  let whereClause: any = {};

  if (status) {
    whereClause.status = status;
  }

  if (search) {
    whereClause.name = { [Op.iLike]: `%${search}%` };
  }

  // Role-based filtering
  if ((req.user as any).role === 'agent') {
    whereClause.user_id = (req.user as any).id;
  }

  // Fix order typing
  const order: Order = [['created_at', 'DESC']];

  const campaigns = await Campaign.findAndCountAll({
    where: whereClause,
    limit: take,
    offset: skip,
    order,
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
      open_rate: (campaign as any).openRate || 0,
      click_rate: (campaign as any).clickRate || 0
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

  // Cast recipients to proper type
  const recipients = (campaign.get('recipients') as CampaignRecipientWithContact[]) || [];

  // Calculate analytics with safe navigation
  const analytics = {
    open_rate: (campaign as any).openRate || 0,
    click_rate: (campaign as any).clickRate || 0,
    click_to_open_rate: (campaign as any).clickToOpenRate || 0,
    unique_opens: campaign.open_count || 0,
    unique_clicks: campaign.click_count || 0,
    bounces: recipients.filter(r => r.status === CAMPAIGN_RECIPIENT_STATUS.BOUNCED).length,
    unsubscribes: recipients.filter(r => r.status === CAMPAIGN_RECIPIENT_STATUS.UNSUBSCRIBED).length,
    complaints: 0
  };

  return res.status(HTTP_STATUS.OK).json({
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
  if ((req.user as any).role === 'agent' && campaign.user_id !== (req.user as any).id) {
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
    user_id: (req.user as any).id,
    action: AUDIT_ACTIONS.UPDATE,
    entity_type: ENTITY_TYPES.CAMPAIGN,
    entity_id: campaign.id,
    details: `Updated campaign: ${campaign.name}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  return res.status(HTTP_STATUS.OK).json({
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
  if ((req.user as any).role === 'agent' && campaign.user_id !== (req.user as any).id) {
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
    user_id: (req.user as any).id,
    action: AUDIT_ACTIONS.UPDATE,
    entity_type: ENTITY_TYPES.CAMPAIGN,
    entity_id: campaign.id,
    details: `Started sending campaign: ${campaign.name}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: send_immediately ? 'Campaign sending started' : 'Campaign scheduled',
    data: {
      campaign,
      estimated_time: send_immediately ? `${Math.ceil((campaign.target_count || 0) / 10)} minutes` : null
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
  if ((req.user as any).role === 'agent' && campaign.user_id !== (req.user as any).id) {
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
    user_id: (req.user as any).id,
    action: AUDIT_ACTIONS.UPDATE,
    entity_type: ENTITY_TYPES.CAMPAIGN,
    entity_id: campaign.id,
    details: `Cancelled campaign: ${campaign.name}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  return res.status(HTTP_STATUS.OK).json({
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
      },
      {
        model: User,
        as: 'createdBy',
        attributes: ['id', 'organization_id', 'first_name', 'last_name', 'email']
      }
    ]
  });

  if (!campaign) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Campaign')
    });
  }

  const template = campaign.get('template') as EmailTemplate | undefined;
  
  // Get the user/agent who created the campaign
  const campaignUser = campaign.get('createdBy') as User | undefined;
  
  // Get organization info from the user's organization_id
  let organization = null;
  if (campaignUser?.organization_id) {
    organization = await Organization.findByPk(campaignUser.organization_id);
  }
  
  // Prepare test data with all available variables
  const fullTestData = {
    // ========== CONTACT INFORMATION (Test recipient) ==========
    first_name: test_data?.first_name || 'Test',
    last_name: test_data?.last_name || 'User',
    full_name: `${test_data?.first_name || 'Test'} ${test_data?.last_name || 'User'}`.trim(),
    email: test_email,
    phone: test_data?.phone || '+1 (555) 123-4567',
    
    // Contact's company information (where they work)
    contact_company: test_data?.contact_company || 'Test Company',
    contact_job_title: test_data?.contact_job_title || 'Marketing Manager',
    contact_status: 'active',
    
    // ========== SENDER/ORGANIZATION INFORMATION (Your company) ==========
    company_name: organization?.company_name || 'Dera CRM',
    company_email: organization?.company_email || 'support@deracrm.com',
    company_phone: organization?.company_phone || '+1 (555) 987-6543',
    company_website: organization?.website || 'https://deracrm.com',
    company_address: organization?.company_address || '123 Business Ave, Suite 100',
    
    // Sender/Agency info
    agency_name: organization?.company_name || 'Dera CRM',
    agency_email: organization?.company_email || 'support@deracrm.com',
    agency_phone: organization?.company_phone || '+1 (555) 987-6543',
    
    // Agent info (who created the campaign)
    agent_name: campaignUser ? `${campaignUser.first_name} ${campaignUser.last_name}` : 'Support Agent',
    agent_email: campaignUser?.email || 'support@deracrm.com',
    
    // ========== CAMPAIGN INFORMATION ==========
    campaign_name: campaign.name,
    campaign_id: campaign.id,
    sent_date: new Date().toLocaleDateString(),
    sent_time: new Date().toLocaleTimeString(),
    
    // ========== TRACKING LINKS (test) ==========
    unsubscribe_link: '#test-unsubscribe-link',
    tracking_pixel: '#test-tracking-pixel',
    
    // ========== ADDITIONAL USEFUL VARIABLES ==========
    current_year: new Date().getFullYear(),
    current_date: new Date().toLocaleDateString(),
    current_time: new Date().toLocaleTimeString(),
    name: test_data?.first_name ? `${test_data.first_name} ${test_data.last_name || 'User'}` : 'Test User',
    
    // Any additional test data passed
    ...test_data
  };
  
  // Render email with test data
  const preview = template?.renderPreview(fullTestData) || { subject: '', body: '' };

  // Send test email
  const emailId = await sendEmail({
    to: test_email,
    subject: `[TEST] ${preview.subject}`,
    template: 'campaign-test',
    data: {
      content: preview.body,
      ...fullTestData
    }
  });

  return res.status(HTTP_STATUS.OK).json({
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

  const recipients = (campaign.get('recipients') as CampaignRecipient[]) || [];

  // Calculate metrics
  const summary = {
    sent: campaign.sent_count || 0,
    delivered: recipients.filter(r => r.status !== CAMPAIGN_RECIPIENT_STATUS.BOUNCED && r.status !== CAMPAIGN_RECIPIENT_STATUS.FAILED).length,
    opens: campaign.open_count || 0,
    unique_opens: campaign.open_count || 0,
    clicks: campaign.click_count || 0,
    unique_clicks: campaign.click_count || 0,
    bounces: recipients.filter(r => r.status === CAMPAIGN_RECIPIENT_STATUS.BOUNCED).length,
    unsubscribes: recipients.filter(r => r.status === CAMPAIGN_RECIPIENT_STATUS.UNSUBSCRIBED).length,
    complaints: 0
  };

  const rates = {
    delivery_rate: summary.sent > 0 ? (summary.delivered / summary.sent) * 100 : 0,
    open_rate: (campaign as any).openRate || 0,
    click_rate: (campaign as any).clickRate || 0,
    click_to_open_rate: (campaign as any).clickToOpenRate || 0,
    bounce_rate: summary.sent > 0 ? (summary.bounces / summary.sent) * 100 : 0,
    unsubscribe_rate: summary.sent > 0 ? (summary.unsubscribes / summary.sent) * 100 : 0
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

  return res.status(HTTP_STATUS.OK).json({
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
    user_id: (req.user as any).id,
    status: CAMPAIGN_STATUS.DRAFT,
    target_count: campaign.target_count
  });

  // Duplicate recipients
  const recipients = (campaign.get('recipients') as CampaignRecipient[]) || [];
  
  if (recipients.length > 0) {
    const newRecipients = recipients.map(r => ({
      campaign_id: duplicate.id,
      contact_id: r.contact_id,
      email: r.email,
      status: CAMPAIGN_RECIPIENT_STATUS.PENDING
    }));

    await CampaignRecipient.bulkCreate(newRecipients);
  }

  // Log audit
  await AuditLog.create({
    user_id: (req.user as any).id,
    action: AUDIT_ACTIONS.CREATE,
    entity_type: ENTITY_TYPES.CAMPAIGN,
    entity_id: duplicate.id,
    details: `Duplicated campaign from: ${campaign.name}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  return res.status(HTTP_STATUS.CREATED).json({
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
      },
      {
        model: User,
        as: 'createdBy',
        attributes: ['id', 'organization_id', 'first_name', 'last_name']
      }
    ]
  });

  if (!campaign || campaign.status !== CAMPAIGN_STATUS.SENDING) {
    return;
  }

  let sentCount = 0;
  const recipients = (campaign.get('recipients') as (CampaignRecipient & { contact?: Contact })[]) || [];
  
  // Get the user/agent who created this campaign
  const campaignUser = campaign.get('createdBy') as User | undefined;
  
  // Get organization info from the user's organization_id (your company)
  let organization = null;
  if (campaignUser?.organization_id) {
    organization = await Organization.findByPk(campaignUser.organization_id);
  }

  for (const recipient of recipients) {
    if (recipient.status !== CAMPAIGN_RECIPIENT_STATUS.PENDING) continue;

    try {
      const template = campaign.get('template') as EmailTemplate | undefined;
      
      // Prepare ALL available variables for the template
      const templateData = {
        // ========== CONTACT INFORMATION (The recipient) ==========
        first_name: recipient.contact?.first_name || '',
        last_name: recipient.contact?.last_name || '',
        full_name: `${recipient.contact?.first_name || ''} ${recipient.contact?.last_name || ''}`.trim(),
        email: recipient.contact?.email || '',
        phone: recipient.contact?.phone || '',
        
        // Contact's company information (where they work)
        contact_company: recipient.contact?.company || '',
        contact_job_title: recipient.contact?.job_title || '',
        contact_status: recipient.contact?.status || '',
        
        // Contact's custom fields (if any)
        ...((recipient.contact as any)?.custom_fields || {}),
        
        // ========== SENDER/ORGANIZATION INFORMATION (Your company) ==========
        // Company info (your agency/company)
        company_name: organization?.company_name || '',
        company_email: organization?.company_email || '',
        company_phone: organization?.company_phone || '',
        company_website: organization?.website || '',
        company_address: organization?.company_address || '',
        
        // Sender/Agency info
        agency_name: organization?.company_name || '',
        agency_email: organization?.company_email || '',
        agency_phone: organization?.company_phone || '',
        
        // Agent info (who created the campaign)
        agent_name: campaignUser ? `${campaignUser.first_name} ${campaignUser.last_name}` : '',
        agent_email: campaignUser?.email || '',
        
        // ========== CAMPAIGN INFORMATION ==========
        campaign_name: campaign.name,
        campaign_id: campaign.id,
        sent_date: new Date().toLocaleDateString(),
        sent_time: new Date().toLocaleTimeString(),
        
        // ========== TRACKING LINKS ==========
        unsubscribe_link: `${process.env.FRONTEND_URL}/unsubscribe?email=${recipient.contact?.email}&campaign=${campaign.id}`,
        tracking_pixel: `${process.env.API_URL}/api/tracking/open/${recipient.id}`,
        
        // ========== ADDITIONAL USEFUL VARIABLES ==========
        // Current date/time in different formats
        current_year: new Date().getFullYear(),
        current_date: new Date().toLocaleDateString(),
        current_time: new Date().toLocaleTimeString(),
        
        // Contact fallbacks
        name: `${recipient.contact?.first_name || ''} ${recipient.contact?.last_name || ''}`.trim() || 'Valued Customer',
      };

      // Render email with all contact data
      const preview = template?.renderPreview(templateData) || { subject: '', body: '' };

      // Send email using the existing sendEmail function
      await sendEmail({
        to: recipient.contact?.email || recipient.email,
        subject: preview.subject,
        template: 'campaign',
        data: {
          content: preview.body,
          ...templateData,
          campaign_id: campaign.id,
          recipient_id: recipient.id,
          track_opens: true,
          track_clicks: true
        }
      });

      // Update recipient status
      await recipient.update({
        status: CAMPAIGN_RECIPIENT_STATUS.SENT,
        sent_at: new Date()
      });

      sentCount++;

      // Update campaign sent count periodically
      if (sentCount % 10 === 0) {
        await campaign.update({
          sent_count: (campaign.sent_count || 0) + 10
        });
      }
    } catch (error: any) {
      console.error(`Failed to send to recipient ${recipient.id}:`, error);
      await recipient.update({
        status: CAMPAIGN_RECIPIENT_STATUS.FAILED,
        error_message: error?.message || 'Unknown error'
      });
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Final update
  await campaign.update({
    status: CAMPAIGN_STATUS.SENT,
    sent_count: (campaign.sent_count || 0) + (sentCount % 10)
  });
}
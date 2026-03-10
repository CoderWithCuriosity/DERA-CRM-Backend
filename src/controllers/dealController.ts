import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { Deal, Contact, User, Activity, AuditLog } from '../models';
import {
  HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES,
  DEAL_STAGES, DEAL_STATUS, DEAL_STAGE_DISPLAY, DEAL_STAGE_COLORS,
  AUDIT_ACTIONS, ENTITY_TYPES
} from '../config/constants';
import catchAsync from '../utils/catchAsync';
import { getPagination, getPagingData } from '../utils/pagination';
import { sendEmail } from '../services/emailService';
import sequelize from '../config/database';

// @desc    Create deal
// @route   POST /api/deals
// @access  Private
export const createDeal = catchAsync(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.VALIDATION_FAILED,
      errors: errors.array()
    });
  }

  const { name, contact_id, stage, amount, probability, expected_close_date, notes, user_id } = req.body;

  // Check if contact exists
  const contact = await Contact.findByPk(contact_id);
  if (!contact) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Contact')
    });
  }

  // Check permission for contact
  if (req.user.role === 'agent' && contact.user_id !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  // Determine owner
  const ownerId = user_id || req.user.id;

  // Check if owner exists and has permission
  if (user_id && req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'You cannot assign deals to other users'
    });
  }

  const deal = await Deal.create({
    name,
    contact_id,
    user_id: ownerId,
    stage: stage || DEAL_STAGES.LEAD,
    amount: amount || 0,
    probability: probability || 0,
    expected_close_date,
    notes,
    status: DEAL_STATUS.OPEN
  });

  // Fetch created deal with associations
  const createdDeal = await Deal.findByPk(deal.id, {
    include: [
      {
        model: Contact,
        as: 'contact',
        attributes: ['id', 'first_name', 'last_name', 'company']
      },
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'first_name', 'last_name']
      }
    ]
  });

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.CREATE,
    entity_type: ENTITY_TYPES.DEAL,
    entity_id: deal.id,
    details: `Created deal: ${deal.name}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  // Send notification email if assigned to different user
  if (ownerId !== req.user.id) {
    const owner = await User.findByPk(ownerId);
    if (owner) {
      await sendEmail({
        to: owner.email,
        subject: 'New Deal Assigned',
        template: 'dealAssigned',
        data: {
          first_name: owner.first_name,
          deal_name: deal.name,
          contact_name: contact.fullName,
          amount: deal.amount,
          stage: DEAL_STAGE_DISPLAY[deal.stage as keyof typeof DEAL_STAGE_DISPLAY],
          deal_url: `${process.env.FRONTEND_URL}/deals/${deal.id}`
        }
      });
    }
  }

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: SUCCESS_MESSAGES.CREATED('Deal'),
    data: { deal: createdDeal }
  });
});

// @desc    Get all deals
// @route   GET /api/deals
// @access  Private
export const getDeals = catchAsync(async (req: Request, res: Response) => {
  const {
    page, limit, stage, status, user_id, contact_id, search,
    date_from, date_to, min_amount, max_amount
  } = req.query;

  // Fix 1: Get pagination correctly - offset doesn't exist in the return value
  const pagination = getPagination(page as string, limit as string);
  const take = pagination.limit; // or pagination.take depending on your function
  const skip = pagination.skip; // Use skip instead of offset

  let whereClause: any = {};

  if (stage) {
    whereClause.stage = stage;
  }

  if (status) {
    whereClause.status = status;
  }

  if (user_id) {
    whereClause.user_id = user_id;
  } else if ((req.user as any).role === 'agent') {
    // Agents see only their own deals
    whereClause.user_id = (req.user as any).id;
  }

  if (contact_id) {
    whereClause.contact_id = contact_id;
  }

  if (search) {
    whereClause = {
      ...whereClause,
      name: { [Op.iLike]: `%${search}%` }
    };
  }

  if (date_from || date_to) {
    whereClause.expected_close_date = {};
    if (date_from) {
      whereClause.expected_close_date[Op.gte] = date_from;
    }
    if (date_to) {
      whereClause.expected_close_date[Op.lte] = date_to;
    }
  }

  if (min_amount || max_amount) {
    whereClause.amount = {};
    if (min_amount) {
      whereClause.amount[Op.gte] = min_amount;
    }
    if (max_amount) {
      whereClause.amount[Op.lte] = max_amount;
    }
  }

  const deals = await Deal.findAndCountAll({
    where: whereClause,
    limit: take,
    offset: skip, // Use skip here
    order: [['created_at', 'DESC']],
    include: [
      {
        model: Contact,
        as: 'contact',
        attributes: ['id', 'first_name', 'last_name', 'company']
      },
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'first_name', 'last_name']
      },
      {
        model: Activity,
        as: 'activities',
        attributes: ['id'],
        required: false,
        separate: true,
        limit: 1
      }
    ]
  });

  // Fix 2: Properly type the rows and access activities
  const rows = deals.rows as (Deal & {
    contact?: Contact;
    owner?: User;
    activities?: Activity[];
  })[];

  // Enhance deals with counts and calculated fields
  const enhancedDeals = rows.map(deal => {
    // Fix 3: Access activities directly from the deal object, not from toJSON()
    const activities = deal.activities || [];

    return {
      ...deal.toJSON(),
      // Fix 4: Access virtual fields safely
      weighted_amount: (deal as any).weightedAmount || 0,
      activities_count: activities.length,
      is_overdue: (deal as any).isOverdue || false
    };
  });

  // Calculate summary statistics
  const summary = await getDealSummary(whereClause);

  const response = getPagingData(
    { count: deals.count, rows: enhancedDeals },
    page as string,
    limit as string
  );

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { ...response, summary }
  });
});

// @desc    Get deal by ID
// @route   GET /api/deals/:id
// @access  Private
export const getDealById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const deal = await Deal.findByPk(id, {
    include: [
      {
        model: Contact,
        as: 'contact',
        attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'company']
      },
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'first_name', 'last_name', 'email']
      },
      {
        model: Activity,
        as: 'activities',
        include: [
          {
            model: Contact,
            as: 'contact',
            attributes: ['first_name', 'last_name']
          }
        ],
        order: [['scheduled_date', 'DESC']]
      }
    ]
  });

  if (!deal) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Deal')
    });
  }

  // Check permission
  if (req.user.role === 'agent' && deal.user_id !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  // Log view
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.VIEW,
    entity_type: ENTITY_TYPES.DEAL,
    entity_id: deal.id,
    details: `Viewed deal: ${deal.name}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { deal }
  });
});

// @desc    Update deal
// @route   PUT /api/deals/:id
// @access  Private
export const updateDeal = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const deal = await Deal.findByPk(id);

  if (!deal) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Deal')
    });
  }

  // Check permission
  if (req.user.role === 'agent' && deal.user_id !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  const previousStage = deal.stage;
  const previousAmount = deal.amount;
  const previousProbability = deal.probability;

  await deal.update(updates);

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity_type: ENTITY_TYPES.DEAL,
    entity_id: deal.id,
    details: `Updated deal: ${deal.name}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  const pipelineUpdate = {
    previous_stage: previousStage,
    new_stage: deal.stage,
    probability_change: deal.probability - previousProbability,
    amount_change: deal.amount - previousAmount
  };

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.UPDATED('Deal'),
    data: {
      deal,
      pipeline_update: pipelineUpdate
    }
  });
});

// @desc    Update deal stage (Drag & Drop)
// @route   PATCH /api/deals/:id/stage
// @access  Private
export const updateDealStage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { stage, actual_close_date } = req.body;

  const deal = await Deal.findByPk(id);

  if (!deal) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Deal')
    });
  }

  // Check permission
  if (req.user.role === 'agent' && deal.user_id !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  await deal.update({
    stage,
    actual_close_date: actual_close_date || deal.actual_close_date
  });

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity_type: ENTITY_TYPES.DEAL,
    entity_id: deal.id,
    details: `Updated deal stage to ${stage}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  // Get updated pipeline summary
  const whereClause = req.user.role === 'agent' ? { user_id: req.user.id } : {};
  const summary = await getDealSummary(whereClause);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.UPDATED('Deal stage'),
    data: {
      deal,
      pipeline_summary: summary
    }
  });
});

// @desc    Mark deal as won
// @route   POST /api/deals/:id/win
// @access  Private
export const markDealAsWon = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { actual_close_date, notes } = req.body;

  const deal = await Deal.findByPk(id, {
    include: [
      {
        model: Contact,
        as: 'contact'
      },
      {
        model: User,
        as: 'owner'
      }
    ]
  }) as (Deal & {
    contact: Contact,
    owner: User
  });

  if (!deal) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Deal')
    });
  }

  // Check permission
  if (req.user.role === 'agent' && deal.user_id !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  await deal.update({
    stage: DEAL_STAGES.WON,
    status: DEAL_STATUS.WON,
    actual_close_date: actual_close_date || new Date(),
    notes: notes ? `${deal.notes || ''}\n\nWon: ${notes}` : deal.notes
  });

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity_type: ENTITY_TYPES.DEAL,
    entity_id: deal.id,
    details: `Marked deal as won`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  // Send notification
  if (deal.owner) {
    await sendEmail({
      to: deal.owner.email,
      subject: '🎉 Deal Won!',
      template: 'dealWon',
      data: {
        first_name: deal.owner.first_name,
        deal_name: deal.name,
        contact_name: deal.contact?.fullName,
        amount: deal.amount,
        close_date: deal.actual_close_date
      }
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Deal marked as won',
    data: { deal }
  });
});

// @desc    Mark deal as lost
// @route   POST /api/deals/:id/lost
// @access  Private
export const markDealAsLost = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { actual_close_date, notes, loss_reason } = req.body;

  const deal = await Deal.findByPk(id);

  if (!deal) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Deal')
    });
  }

  // Check permission
  if (req.user.role === 'agent' && deal.user_id !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  const lossNotes = `Lost: ${loss_reason ? `Reason: ${loss_reason}. ` : ''}${notes || ''}`;

  await deal.update({
    stage: DEAL_STAGES.LOST,
    status: DEAL_STATUS.LOST,
    actual_close_date: actual_close_date || new Date(),
    notes: notes ? `${deal.notes || ''}\n\n${lossNotes}` : lossNotes
  });

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity_type: ENTITY_TYPES.DEAL,
    entity_id: deal.id,
    details: `Marked deal as lost`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Deal marked as lost',
    data: { deal }
  });
});

// @desc    Delete deal
// @route   DELETE /api/deals/:id
// @access  Private
export const deleteDeal = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const deal = await Deal.findByPk(id);

  if (!deal) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Deal')
    });
  }

  // Check permission
  if (req.user.role === 'agent' && deal.user_id !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  await deal.destroy();

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.DELETE,
    entity_type: ENTITY_TYPES.DEAL,
    entity_id: parseInt(id),
    details: `Deleted deal: ${deal.name}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.DELETED('Deal')
  });
});

// @desc    Get pipeline summary
// @route   GET /api/deals/pipeline/summary
// @access  Private
export const getPipelineSummary = catchAsync(async (req: Request, res: Response) => {
  const { user_id } = req.query;

  let whereClause: any = {};

  if (user_id) {
    whereClause.user_id = user_id;
  } else if (req.user.role === 'agent') {
    whereClause.user_id = req.user.id;
  }

  const summary = await getDealSummary(whereClause);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: summary
  });
});

// @desc    Get Kanban board
// @route   GET /api/deals/kanban
// @access  Private
export const getKanbanBoard = catchAsync(async (req: Request, res: Response) => {
  const { user_id } = req.query;

  let whereClause: any = {
    status: DEAL_STATUS.OPEN
  };

  if (user_id) {
    whereClause.user_id = user_id;
  } else if (req.user.role === 'agent') {
    whereClause.user_id = req.user.id;
  }

  const deals = await Deal.findAll({
    where: whereClause,
    include: [
      {
        model: Contact,
        as: 'contact',
        attributes: ['id', 'first_name', 'last_name', 'company', 'avatar']
      }
    ],
    order: [['created_at', 'DESC']]
  }) as (Deal & {
    contact: Contact
  })[];

  // Group deals by stage
  const columns = Object.values(DEAL_STAGES).map(stage => ({
    id: stage,
    title: DEAL_STAGE_DISPLAY[stage as keyof typeof DEAL_STAGE_DISPLAY],
    color: DEAL_STAGE_COLORS[stage as keyof typeof DEAL_STAGE_COLORS],
    limit: 10,
    deals: deals
      .filter(deal => deal.stage === stage)
      .map(deal => ({
        id: deal.id,
        name: deal.name,
        amount: deal.amount,
        probability: deal.probability,
        expected_close_date: deal.expected_close_date,
        contact_name: deal.contact?.fullName,
        contact_company: deal.contact?.company,
        avatar: deal.contact?.avatar,
        has_activity_today: false // Implement activity check
      }))
  }));

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { columns }
  });
});

// Helper function to get deal summary
// Helper function to get deal summary
async function getDealSummary(whereClause: any) {
  const stages = await Deal.findAll({
    where: whereClause,
    attributes: [
      'stage',
      [sequelize.fn('COUNT', sequelize.col('stage')), 'count'],
      [sequelize.fn('SUM', sequelize.col('amount')), 'value']
    ],
    group: ['stage']
  });

  const stageSummary = stages.map(s => {
    // Fix: Handle the return type of get properly
    const count = s.get('count');
    const value = s.get('value');
    
    return {
      name: s.stage,
      display_name: DEAL_STAGE_DISPLAY[s.stage as keyof typeof DEAL_STAGE_DISPLAY] || s.stage,
      count: count ? parseInt(count.toString()) : 0,
      value: value ? parseFloat(value.toString()) : 0,
      color: DEAL_STAGE_COLORS[s.stage as keyof typeof DEAL_STAGE_COLORS] || '#6B7280'
    };
  });

  // Calculate weighted values
  const deals = await Deal.findAll({
    where: whereClause,
    attributes: ['stage', 'amount', 'probability']
  });

  let totalValue = 0;
  let weightedValue = 0;
  let openDeals = 0;
  let wonDeals = 0;
  let lostDeals = 0;

  deals.forEach(deal => {
    totalValue += deal.amount || 0;
    weightedValue += (deal.amount || 0) * ((deal.probability || 0) / 100);

    if (deal.stage === DEAL_STAGES.WON) {
      wonDeals++;
    } else if (deal.stage === DEAL_STAGES.LOST) {
      lostDeals++;
    } else {
      openDeals++;
    }
  });

  // Add weighted value to stages
  const enhancedStages = stageSummary.map(stage => {
    const stageDeals = deals.filter(d => d.stage === stage.name);
    const stageWeightedValue = stageDeals.reduce(
      (sum, deal) => sum + (deal.amount || 0) * ((deal.probability || 0) / 100),
      0
    );
    return {
      ...stage,
      weighted_value: stageWeightedValue
    };
  });

  // Calculate forecast (simplified)
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const firstDayOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const lastDayOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);

  const thisMonthDeals = await Deal.sum('amount', {
    where: {
      ...whereClause,
      expected_close_date: {
        [Op.between]: [firstDayOfMonth, firstDayOfNextMonth]
      }
    }
  });

  const nextMonthDeals = await Deal.sum('amount', {
    where: {
      ...whereClause,
      expected_close_date: {
        [Op.between]: [
          firstDayOfNextMonth, 
          new Date(firstDayOfNextMonth.getFullYear(), firstDayOfNextMonth.getMonth() + 1, 1)
        ]
      }
    }
  });

  const quarterDeals = await Deal.sum('amount', {
    where: {
      ...whereClause,
      expected_close_date: {
        [Op.between]: [firstDayOfQuarter, lastDayOfQuarter]
      }
    }
  });

  return {
    stages: enhancedStages,
    totals: {
      total_value: totalValue,
      weighted_value: weightedValue,
      open_deals: openDeals,
      won_deals: wonDeals,
      lost_deals: lostDeals,
      win_rate: openDeals + wonDeals > 0 ? (wonDeals / (openDeals + wonDeals)) * 100 : 0
    },
    forecast: {
      this_month: thisMonthDeals || 0,
      next_month: nextMonthDeals || 0,
      quarter: quarterDeals || 0
    }
  };
}
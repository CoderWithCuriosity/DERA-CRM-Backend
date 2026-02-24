import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { Activity, Contact, Deal, User, AuditLog } from '../models';
import { 
  HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES, 
  ACTIVITY_TYPES, ACTIVITY_STATUS, 
  AUDIT_ACTIONS, ENTITY_TYPES 
} from '../config/constants';
import catchAsync from '../utils/catchAsync';
import { getPagination, getPagingData } from '../utils/pagination';
import { sendEmail } from '../services/emailService';
import { scheduleActivityReminder } from '../services/notificationService';

// @desc    Create activity
// @route   POST /api/activities
// @access  Private
export const createActivity = catchAsync(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.VALIDATION_FAILED,
      errors: errors.array()
    });
  }

  const { type, subject, description, contact_id, deal_id, scheduled_date, duration, user_id } = req.body;

  // Check if contact exists if provided
  if (contact_id) {
    const contact = await Contact.findByPk(contact_id);
    if (!contact) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.NOT_FOUND('Contact')
      });
    }
  }

  // Check if deal exists if provided
  if (deal_id) {
    const deal = await Deal.findByPk(deal_id);
    if (!deal) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.NOT_FOUND('Deal')
      });
    }
  }

  // Determine owner
  const ownerId = user_id || req.user.id;
  
  // Check permission for assigning to others
  if (user_id && req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'You cannot assign activities to other users'
    });
  }

  const activity = await Activity.create({
    type,
    subject,
    description,
    contact_id,
    deal_id,
    user_id: ownerId,
    scheduled_date,
    duration,
    status: ACTIVITY_STATUS.SCHEDULED
  });

  // Fetch created activity with associations
  const createdActivity = await Activity.findByPk(activity.id, {
    include: [
      {
        model: Contact,
        as: 'contact',
        attributes: ['id', 'first_name', 'last_name', 'company']
      },
      {
        model: Deal,
        as: 'deal',
        attributes: ['id', 'name', 'amount']
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name']
      }
    ]
  });

  // Schedule reminder if activity is in the future
  if (new Date(scheduled_date) > new Date()) {
    await scheduleActivityReminder(activity.id, scheduled_date, ownerId);
  }

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.CREATE,
    entity_type: ENTITY_TYPES.ACTIVITY,
    entity_id: activity.id,
    details: `Created activity: ${activity.subject}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: SUCCESS_MESSAGES.CREATED('Activity'),
    data: { activity: createdActivity }
  });
});

// @desc    Get all activities
// @route   GET /api/activities
// @access  Private
export const getActivities = catchAsync(async (req: Request, res: Response) => {
  const { 
    page, limit, type, contact_id, deal_id, user_id, 
    status, date_from, date_to 
  } = req.query;

  const { limit: take, offset } = getPagination(page as string, limit as string);

  let whereClause: any = {};

  if (type) {
    whereClause.type = type;
  }

  if (contact_id) {
    whereClause.contact_id = contact_id;
  }

  if (deal_id) {
    whereClause.deal_id = deal_id;
  }

  if (user_id) {
    whereClause.user_id = user_id;
  } else if (req.user.role === 'agent') {
    whereClause.user_id = req.user.id;
  }

  if (status) {
    whereClause.status = status;
  }

  if (date_from || date_to) {
    whereClause.scheduled_date = {};
    if (date_from) {
      whereClause.scheduled_date[Op.gte] = new Date(date_from as string);
    }
    if (date_to) {
      whereClause.scheduled_date[Op.lte] = new Date(date_to as string);
    }
  }

  const activities = await Activity.findAndCountAll({
    where: whereClause,
    limit: take,
    offset,
    order: [['scheduled_date', 'ASC']],
    include: [
      {
        model: Contact,
        as: 'contact',
        attributes: ['id', 'first_name', 'last_name', 'company']
      },
      {
        model: Deal,
        as: 'deal',
        attributes: ['id', 'name', 'amount']
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name']
      }
    ]
  });

  const response = getPagingData(activities, page as string, limit as string);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: response
  });
});

// @desc    Get activity by ID
// @route   GET /api/activities/:id
// @access  Private
export const getActivityById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const activity = await Activity.findByPk(id, {
    include: [
      {
        model: Contact,
        as: 'contact',
        attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
      },
      {
        model: Deal,
        as: 'deal',
        attributes: ['id', 'name', 'stage', 'amount']
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }
    ]
  });

  if (!activity) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Activity')
    });
  }

  // Check permission
  if (req.user.role === 'agent' && activity.user_id !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { activity }
  });
});

// @desc    Update activity
// @route   PUT /api/activities/:id
// @access  Private
export const updateActivity = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const activity = await Activity.findByPk(id);

  if (!activity) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Activity')
    });
  }

  // Check permission
  if (req.user.role === 'agent' && activity.user_id !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  // Can't update completed activities
  if (activity.status === ACTIVITY_STATUS.COMPLETED) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Cannot update completed activities'
    });
  }

  await activity.update(updates);

  // Reschedule reminder if date changed
  if (updates.scheduled_date && new Date(updates.scheduled_date) > new Date()) {
    await scheduleActivityReminder(activity.id, updates.scheduled_date, activity.user_id);
  }

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity_type: ENTITY_TYPES.ACTIVITY,
    entity_id: activity.id,
    details: `Updated activity: ${activity.subject}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.UPDATED('Activity'),
    data: { activity }
  });
});

// @desc    Complete activity
// @route   POST /api/activities/:id/complete
// @access  Private
export const completeActivity = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { outcome, duration } = req.body;

  const activity = await Activity.findByPk(id, {
    include: [
      {
        model: Contact,
        as: 'contact'
      },
      {
        model: Deal,
        as: 'deal'
      }
    ]
  });

  if (!activity) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Activity')
    });
  }

  // Check permission
  if (req.user.role === 'agent' && activity.user_id !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  // Can't complete already completed activities
  if (activity.status === ACTIVITY_STATUS.COMPLETED) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Activity already completed'
    });
  }

  await activity.update({
    status: ACTIVITY_STATUS.COMPLETED,
    completed_date: new Date(),
    outcome: outcome || activity.outcome,
    duration: duration || activity.duration
  });

  // If activity is linked to a deal, maybe update deal based on outcome
  if (activity.deal && outcome) {
    // Logic to update deal based on activity outcome
  }

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity_type: ENTITY_TYPES.ACTIVITY,
    entity_id: activity.id,
    details: `Completed activity: ${activity.subject}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Activity completed successfully',
    data: { activity }
  });
});

// @desc    Delete activity
// @route   DELETE /api/activities/:id
// @access  Private
export const deleteActivity = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const activity = await Activity.findByPk(id);

  if (!activity) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Activity')
    });
  }

  // Check permission
  if (req.user.role === 'agent' && activity.user_id !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  await activity.destroy();

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.DELETE,
    entity_type: ENTITY_TYPES.ACTIVITY,
    entity_id: parseInt(id),
    details: `Deleted activity: ${activity.subject}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.DELETED('Activity')
  });
});

// @desc    Get today's activities
// @route   GET /api/activities/today
// @access  Private
export const getTodayActivities = catchAsync(async (req: Request, res: Response) => {
  const { user_id } = req.query;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  let whereClause: any = {
    scheduled_date: {
      [Op.between]: [startOfDay, endOfDay]
    }
  };

  if (user_id) {
    whereClause.user_id = user_id;
  } else if (req.user.role === 'agent') {
    whereClause.user_id = req.user.id;
  }

  const activities = await Activity.findAll({
    where: whereClause,
    include: [
      {
        model: Contact,
        as: 'contact',
        attributes: ['first_name', 'last_name', 'company']
      }
    ],
    order: [['scheduled_date', 'ASC']]
  });

  const summary = {
    total: activities.length,
    completed: activities.filter(a => a.status === ACTIVITY_STATUS.COMPLETED).length,
    scheduled: activities.filter(a => a.status === ACTIVITY_STATUS.SCHEDULED).length,
    overdue: activities.filter(a => a.status === ACTIVITY_STATUS.SCHEDULED && new Date(a.scheduled_date) < new Date()).length
  };

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      date: new Date().toISOString().split('T')[0],
      activities,
      summary
    }
  });
});

// @desc    Get upcoming activities
// @route   GET /api/activities/upcoming
// @access  Private
export const getUpcomingActivities = catchAsync(async (req: Request, res: Response) => {
  const { days = 7, user_id } = req.query;

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + Number(days));
  endDate.setHours(23, 59, 59, 999);

  let whereClause: any = {
    scheduled_date: {
      [Op.between]: [startDate, endDate]
    },
    status: ACTIVITY_STATUS.SCHEDULED
  };

  if (user_id) {
    whereClause.user_id = user_id;
  } else if (req.user.role === 'agent') {
    whereClause.user_id = req.user.id;
  }

  const activities = await Activity.findAll({
    where: whereClause,
    include: [
      {
        model: Contact,
        as: 'contact',
        attributes: ['first_name', 'last_name', 'company']
      }
    ],
    order: [['scheduled_date', 'ASC']]
  });

  // Group by date
  const groupedByDate: { [key: string]: any[] } = {};
  
  activities.forEach(activity => {
    const dateKey = activity.scheduled_date.toISOString().split('T')[0];
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(activity);
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      range: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      activities,
      grouped_by_date: groupedByDate
    }
  });
});
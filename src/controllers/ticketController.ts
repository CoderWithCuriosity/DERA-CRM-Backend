import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { Ticket, TicketComment, Contact, User, AuditLog } from '../models';
import { 
  HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES, 
  TICKET_STATUS, PRIORITIES, TICKET_STATUS_DISPLAY, TICKET_STATUS_COLORS,
  AUDIT_ACTIONS, ENTITY_TYPES, TIME 
} from '../config/constants';
import catchAsync from '../utils/catchAsync';
import { getPagination, getPagingData } from '../utils/pagination';
import { sendEmail } from '../services/emailService';
import { checkSLA, updateSLAMetrics } from '../services/slaService';

// @desc    Create ticket
// @route   POST /api/tickets
// @access  Private
export const createTicket = catchAsync(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.VALIDATION_FAILED,
      errors: errors.array()
    });
  }

  const { subject, description, contact_id, priority, due_date, assigned_to } = req.body;

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

  // Calculate SLA based on priority
  const slaResponseTime = getSLAResponseTime(priority as string);
  const slaResolutionTime = getSLAResolutionTime(priority as string);

  const ticket = await Ticket.create({
    subject,
    description,
    contact_id,
    user_id: req.user.id,
    assigned_to: assigned_to || null,
    priority: priority || PRIORITIES.MEDIUM,
    status: TICKET_STATUS.NEW,
    due_date,
    sla_response_due: new Date(Date.now() + slaResponseTime),
    sla_resolution_due: due_date ? new Date(due_date) : new Date(Date.now() + slaResolutionTime)
  });

  // Fetch created ticket with associations
  const createdTicket = await Ticket.findByPk(ticket.id, {
    include: [
      {
        model: Contact,
        as: 'contact',
        attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
      },
      {
        model: User,
        as: 'createdBy',
        attributes: ['id', 'first_name', 'last_name']
      }
    ]
  });

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.CREATE,
    entity_type: ENTITY_TYPES.TICKET,
    entity_id: ticket.id,
    details: `Created ticket: ${ticket.ticket_number}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  // Send notification email if assigned
  if (assigned_to) {
    const assignee = await User.findByPk(assigned_to);
    if (assignee) {
      await sendEmail({
        to: assignee.email,
        subject: `New Ticket Assigned: ${ticket.ticket_number}`,
        template: 'ticketAssigned',
        data: {
          first_name: assignee.first_name,
          ticket_number: ticket.ticket_number,
          subject: ticket.subject,
          priority: ticket.priority,
          contact_name: contact.fullName,
          ticket_url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
        }
      });
    }
  }

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: SUCCESS_MESSAGES.CREATED('Ticket'),
    data: { 
      ticket: createdTicket,
      sla: {
        response_due: ticket.sla_response_due,
        resolution_due: ticket.sla_resolution_due
      }
    }
  });
});

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Private
export const getTickets = catchAsync(async (req: Request, res: Response) => {
  const { 
    page, limit, status, priority, assigned_to, contact_id, search 
  } = req.query;

  const { limit: take, offset } = getPagination(page as string, limit as string);

  let whereClause: any = {};

  if (status) {
    whereClause.status = status;
  }

  if (priority) {
    whereClause.priority = priority;
  }

  if (assigned_to) {
    whereClause.assigned_to = assigned_to;
  }

  if (contact_id) {
    whereClause.contact_id = contact_id;
  }

  if (search) {
    whereClause = {
      ...whereClause,
      [Op.or]: [
        { subject: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { ticket_number: { [Op.iLike]: `%${search}%` } }
      ]
    };
  }

  // Role-based filtering
  if (req.user.role === 'agent') {
    whereClause = {
      ...whereClause,
      [Op.or]: [
        { user_id: req.user.id },
        { assigned_to: req.user.id }
      ]
    };
  }

  const tickets = await Ticket.findAndCountAll({
    where: whereClause,
    limit: take,
    offset,
    order: [['created_at', 'DESC']],
    include: [
      {
        model: Contact,
        as: 'contact',
        attributes: ['id', 'first_name', 'last_name', 'email']
      },
      {
        model: User,
        as: 'assignedTo',
        attributes: ['id', 'first_name', 'last_name']
      },
      {
        model: TicketComment,
        as: 'comments',
        attributes: ['id'],
        required: false,
        separate: true,
        limit: 1
      }
    ]
  });

  // Enhance tickets with counts and SLA status
  const enhancedTickets = tickets.rows.map(ticket => {
    const ticketData = ticket.toJSON();
    return {
      ...ticketData,
      comment_count: ticketData.comments?.length || 0,
      sla_breach: ticket.isOverdue,
      response_time: ticket.responseTime
    };
  });

  // Get summary statistics
  const summary = await getTicketSummary(whereClause);

  const response = getPagingData(
    { count: tickets.count, rows: enhancedTickets },
    page as string,
    limit as string
  );

  response.summary = summary;

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: response
  });
});

// @desc    Get ticket by ID
// @route   GET /api/tickets/:id
// @access  Private
export const getTicketById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const ticket = await Ticket.findByPk(id, {
    include: [
      {
        model: Contact,
        as: 'contact',
        attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
      },
      {
        model: User,
        as: 'createdBy',
        attributes: ['id', 'first_name', 'last_name']
      },
      {
        model: User,
        as: 'assignedTo',
        attributes: ['id', 'first_name', 'last_name', 'email']
      },
      {
        model: TicketComment,
        as: 'comments',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'avatar']
          }
        ],
        order: [['created_at', 'ASC']]
      }
    ]
  });

  if (!ticket) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Ticket')
    });
  }

  // Check permission
  if (req.user.role === 'agent' && 
      ticket.user_id !== req.user.id && 
      ticket.assigned_to !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  // Calculate SLA metrics
  const slaMetrics = {
    response_time: ticket.responseTime,
    response_due: ticket.sla_response_due,
    response_breached: ticket.sla_response_due ? new Date() > new Date(ticket.sla_response_due) : false,
    resolution_due: ticket.sla_resolution_due,
    resolution_breached: ticket.isOverdue
  };

  // Log view
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.VIEW,
    entity_type: ENTITY_TYPES.TICKET,
    entity_id: ticket.id,
    details: `Viewed ticket: ${ticket.ticket_number}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { 
      ticket,
      sla: slaMetrics,
      time_spent: {
        total: ticket.resolutionTime,
        breached: ticket.isOverdue
      }
    }
  });
});

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private
export const updateTicket = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const ticket = await Ticket.findByPk(id);

  if (!ticket) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Ticket')
    });
  }

  // Check permission
  if (req.user.role === 'agent' && 
      ticket.user_id !== req.user.id && 
      ticket.assigned_to !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  // Can't update resolved/closed tickets
  if (ticket.status === TICKET_STATUS.RESOLVED || ticket.status === TICKET_STATUS.CLOSED) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Cannot update resolved or closed tickets'
    });
  }

  // Update SLA if priority or due date changes
  if (updates.priority && updates.priority !== ticket.priority) {
    updates.sla_response_due = new Date(Date.now() + getSLAResponseTime(updates.priority));
  }

  if (updates.due_date && updates.due_date !== ticket.due_date) {
    updates.sla_resolution_due = new Date(updates.due_date);
  }

  await ticket.update(updates);

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity_type: ENTITY_TYPES.TICKET,
    entity_id: ticket.id,
    details: `Updated ticket: ${ticket.ticket_number}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.UPDATED('Ticket'),
    data: { 
      ticket,
      sla: {
        response_due: ticket.sla_response_due,
        resolution_due: ticket.sla_resolution_due
      }
    }
  });
});

// @desc    Update ticket status
// @route   PATCH /api/tickets/:id/status
// @access  Private
export const updateTicketStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, resolution_notes } = req.body;

  const ticket = await Ticket.findByPk(id);

  if (!ticket) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Ticket')
    });
  }

  // Check permission
  if (req.user.role === 'agent' && 
      ticket.user_id !== req.user.id && 
      ticket.assigned_to !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  await ticket.update({ 
    status,
    resolved_at: status === TICKET_STATUS.RESOLVED ? new Date() : ticket.resolved_at
  });

  // Add resolution notes as internal comment
  if (resolution_notes && status === TICKET_STATUS.RESOLVED) {
    await TicketComment.create({
      ticket_id: ticket.id,
      user_id: req.user.id,
      comment: `Resolution: ${resolution_notes}`,
      is_internal: true
    });
  }

  // If resolved, notify creator
  if (status === TICKET_STATUS.RESOLVED) {
    const creator = await User.findByPk(ticket.user_id);
    const contact = await Contact.findByPk(ticket.contact_id);
    
    if (creator) {
      await sendEmail({
        to: creator.email,
        subject: `Ticket Resolved: ${ticket.ticket_number}`,
        template: 'ticketResolved',
        data: {
          first_name: creator.first_name,
          ticket_number: ticket.ticket_number,
          subject: ticket.subject,
          contact_name: contact?.fullName,
          resolution_time: ticket.resolutionTime,
          ticket_url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
        }
      });
    }
  }

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity_type: ENTITY_TYPES.TICKET,
    entity_id: ticket.id,
    details: `Updated ticket status to ${status}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.UPDATED('Ticket status'),
    data: { 
      ticket,
      resolution_time: ticket.resolutionTime
    }
  });
});

// @desc    Assign ticket
// @route   POST /api/tickets/:id/assign
// @access  Private
export const assignTicket = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { assigned_to } = req.body;

  const ticket = await Ticket.findByPk(id, {
    include: [
      {
        model: Contact,
        as: 'contact'
      }
    ]
  });

  if (!ticket) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Ticket')
    });
  }

  // Check permission (only admins/managers can assign)
  if (req.user.role === 'agent') {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  const previousAssignee = ticket.assigned_to;
  await ticket.update({ assigned_to });

  // Send notification to new assignee
  if (assigned_to) {
    const assignee = await User.findByPk(assigned_to);
    if (assignee) {
      await sendEmail({
        to: assignee.email,
        subject: `Ticket Assigned: ${ticket.ticket_number}`,
        template: 'ticketAssigned',
        data: {
          first_name: assignee.first_name,
          ticket_number: ticket.ticket_number,
          subject: ticket.subject,
          priority: ticket.priority,
          contact_name: ticket.contact?.fullName,
          ticket_url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
        }
      });
    }
  }

  // Add assignment comment
  await TicketComment.create({
    ticket_id: ticket.id,
    user_id: req.user.id,
    comment: `Assigned to ${assigned_to ? (await User.findByPk(assigned_to))?.fullName : 'unassigned'}`,
    is_internal: true
  });

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity_type: ENTITY_TYPES.TICKET,
    entity_id: ticket.id,
    details: `Assigned ticket to user ${assigned_to}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.UPDATED('Ticket assignment'),
    data: { 
      ticket,
      assigned_user: assigned_to ? await User.findByPk(assigned_to, { attributes: ['id', 'first_name', 'last_name', 'email'] }) : null
    }
  });
});

// @desc    Add ticket comment
// @route   POST /api/tickets/:id/comments
// @access  Private
export const addTicketComment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { comment, is_internal } = req.body;

  const ticket = await Ticket.findByPk(id);

  if (!ticket) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Ticket')
    });
  }

  // Check permission
  if (req.user.role === 'agent' && 
      ticket.user_id !== req.user.id && 
      ticket.assigned_to !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  // Update ticket status if it's new and this is a response
  if (ticket.status === TICKET_STATUS.NEW && !is_internal) {
    await ticket.update({ status: TICKET_STATUS.OPEN });
  }

  const ticketComment = await TicketComment.create({
    ticket_id: parseInt(id),
    user_id: req.user.id,
    comment,
    is_internal: is_internal || false
  });

  // Fetch created comment with user info
  const createdComment = await TicketComment.findByPk(ticketComment.id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'avatar']
      }
    ]
  });

  // Send email notification to relevant parties (unless internal)
  if (!is_internal) {
    const contact = await Contact.findByPk(ticket.contact_id);
    const creator = await User.findByPk(ticket.user_id);
    const assignee = ticket.assigned_to ? await User.findByPk(ticket.assigned_to) : null;

    const recipients = new Set();
    if (creator && creator.id !== req.user.id) recipients.add(creator.email);
    if (assignee && assignee.id !== req.user.id) recipients.add(assignee.email);

    // In production, queue these emails
    for (const email of recipients) {
      await sendEmail({
        to: email,
        subject: `New Comment on Ticket ${ticket.ticket_number}`,
        template: 'ticketComment',
        data: {
          first_name: (await User.findOne({ where: { email } }))?.first_name,
          ticket_number: ticket.ticket_number,
          subject: ticket.subject,
          comment_author: req.user.fullName,
          comment,
          ticket_url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
        }
      });
    }
  }

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: SUCCESS_MESSAGES.CREATED('Comment'),
    data: { comment: createdComment }
  });
});

// @desc    Get ticket comments
// @route   GET /api/tickets/:id/comments
// @access  Private
export const getTicketComments = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { include_internal } = req.query;

  const ticket = await Ticket.findByPk(id);

  if (!ticket) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Ticket')
    });
  }

  // Check permission
  if (req.user.role === 'agent' && 
      ticket.user_id !== req.user.id && 
      ticket.assigned_to !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  let whereClause: any = { ticket_id: id };

  // Only show internal comments to staff
  if (req.user.role === 'agent' && include_internal !== 'true') {
    whereClause.is_internal = false;
  }

  const comments = await TicketComment.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'avatar']
      }
    ],
    order: [['created_at', 'ASC']]
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { comments, total: comments.length }
  });
});

// @desc    Delete ticket
// @route   DELETE /api/tickets/:id
// @access  Private
export const deleteTicket = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const ticket = await Ticket.findByPk(id);

  if (!ticket) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Ticket')
    });
  }

  // Only admins can delete tickets
  if (req.user.role !== 'admin') {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  await ticket.destroy();

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.DELETE,
    entity_type: ENTITY_TYPES.TICKET,
    entity_id: parseInt(id),
    details: `Deleted ticket: ${ticket.ticket_number}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.DELETED('Ticket')
  });
});

// @desc    Get SLA report
// @route   GET /api/tickets/sla/report
// @access  Private/Admin/Manager
export const getSLAReport = catchAsync(async (req: Request, res: Response) => {
  const { start_date, end_date } = req.query;

  const start = start_date ? new Date(start_date as string) : new Date(Date.now() - 30 * TIME.DAY);
  const end = end_date ? new Date(end_date as string) : new Date();

  const tickets = await Ticket.findAll({
    where: {
      created_at: {
        [Op.between]: [start, end]
      }
    },
    include: [
      {
        model: User,
        as: 'assignedTo',
        attributes: ['id', 'first_name', 'last_name']
      }
    ]
  });

  // Calculate SLA metrics
  const responseTimes: number[] = [];
  const resolutionTimes: number[] = [];
  let responseBreaches = 0;
  let resolutionBreaches = 0;

  tickets.forEach(ticket => {
    if (ticket.responseTime) {
      responseTimes.push(ticket.responseTime);
    }
    if (ticket.resolutionTime) {
      resolutionTimes.push(ticket.resolutionTime);
    }
    if (ticket.sla_response_due && new Date() > new Date(ticket.sla_response_due)) {
      responseBreaches++;
    }
    if (ticket.isOverdue) {
      resolutionBreaches++;
    }
  });

  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
    : 0;
  
  const avgResolutionTime = resolutionTimes.length > 0 
    ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length 
    : 0;

  // Group by priority
  const byPriority: any = {};
  Object.values(PRIORITIES).forEach(priority => {
    const priorityTickets = tickets.filter(t => t.priority === priority);
    const priorityResponseTimes = priorityTickets.map(t => t.responseTime).filter(Boolean);
    const priorityResolutionTimes = priorityTickets.map(t => t.resolutionTime).filter(Boolean);
    
    byPriority[priority] = {
      response_compliance: priorityResponseTimes.length > 0 
        ? (priorityResponseTimes.filter(t => t <= getSLAResponseTime(priority) / 60000).length / priorityResponseTimes.length) * 100 
        : 100,
      resolution_compliance: priorityResolutionTimes.length > 0 
        ? (priorityResolutionTimes.filter(t => t <= getSLAResolutionTime(priority) / 60000).length / priorityResolutionTimes.length) * 100 
        : 100
    };
  });

  // Daily breaches
  const dailyBreaches = [];
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dayTickets = tickets.filter(t => 
      t.created_at.toDateString() === currentDate.toDateString()
    );
    
    dailyBreaches.push({
      date: currentDate.toISOString().split('T')[0],
      response_breaches: dayTickets.filter(t => t.sla_response_due && new Date() > new Date(t.sla_response_due)).length,
      resolution_breaches: dayTickets.filter(t => t.isOverdue).length
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      response_times: {
        average: avgResponseTime,
        median: calculateMedian(responseTimes),
        min: Math.min(...responseTimes, 0),
        max: Math.max(...responseTimes, 0),
        breached: responseBreaches,
        total: tickets.length,
        compliance_rate: ((tickets.length - responseBreaches) / tickets.length) * 100
      },
      resolution_times: {
        average: avgResolutionTime,
        median: calculateMedian(resolutionTimes),
        min: Math.min(...resolutionTimes, 0),
        max: Math.max(...resolutionTimes, 0),
        breached: resolutionBreaches,
        total: tickets.filter(t => t.status === TICKET_STATUS.RESOLVED).length,
        compliance_rate: ((tickets.filter(t => t.status === TICKET_STATUS.RESOLVED).length - resolutionBreaches) / tickets.filter(t => t.status === TICKET_STATUS.RESOLVED).length) * 100
      },
      by_priority: byPriority,
      daily_breaches: dailyBreaches
    }
  });
});

// Helper functions
function getSLAResponseTime(priority: string): number {
  switch (priority) {
    case PRIORITIES.URGENT:
      return 1 * TIME.HOUR; // 1 hour
    case PRIORITIES.HIGH:
      return 4 * TIME.HOUR; // 4 hours
    case PRIORITIES.MEDIUM:
      return 8 * TIME.HOUR; // 8 hours
    case PRIORITIES.LOW:
      return 24 * TIME.HOUR; // 24 hours
    default:
      return 8 * TIME.HOUR;
  }
}

function getSLAResolutionTime(priority: string): number {
  switch (priority) {
    case PRIORITIES.URGENT:
      return 4 * TIME.HOUR; // 4 hours
    case PRIORITIES.HIGH:
      return 24 * TIME.HOUR; // 1 day
    case PRIORITIES.MEDIUM:
      return 48 * TIME.HOUR; // 2 days
    case PRIORITIES.LOW:
      return 120 * TIME.HOUR; // 5 days
    default:
      return 48 * TIME.HOUR;
  }
}

function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = numbers.sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

async function getTicketSummary(whereClause: any) {
  const byStatus = await Ticket.findAll({
    where: whereClause,
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('status')), 'count']
    ],
    group: ['status']
  });

  const byPriority = await Ticket.findAll({
    where: whereClause,
    attributes: [
      'priority',
      [sequelize.fn('COUNT', sequelize.col('priority')), 'count']
    ],
    group: ['priority']
  });

  const statusSummary: any = {};
  byStatus.forEach(s => {
    statusSummary[s.status] = parseInt(s.getDataValue('count'));
  });

  const prioritySummary: any = {};
  byPriority.forEach(p => {
    prioritySummary[p.priority] = parseInt(p.getDataValue('count'));
  });

  return {
    by_status: statusSummary,
    by_priority: prioritySummary
  };
}
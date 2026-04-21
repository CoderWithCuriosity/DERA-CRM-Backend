import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import { Ticket, TicketComment, Contact, User, AuditLog } from '../models';
import {
  HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES,
  TICKET_STATUS, PRIORITIES,
  AUDIT_ACTIONS, ENTITY_TYPES, TIME
} from '../config/constants';
import catchAsync from '../utils/catchAsync';
import { getPagination, getPagingData } from '../utils/pagination';
import { sendEmail } from '../services/emailService';

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    fullName?: string;
  };
}

// @desc    Create ticket
// @route   POST /api/tickets
// @access  Private
export const createTicket = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // Check authentication
  if (!req.user?.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated'
    });
  }

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
  void slaResponseTime;
  const slaResolutionTime = getSLAResolutionTime(priority as string);
  void slaResolutionTime;

    // Generate ticket number
  const year = new Date().getFullYear();
  const [countResult] = await sequelize.query(
    `SELECT COUNT(*) as count FROM tickets WHERE EXTRACT(YEAR FROM created_at) = :year`,
    {
      replacements: { year },
      type: 'SELECT'
    }
  );
  const count = parseInt((countResult as any).count) || 0;
  const nextNumber = count + 1;
  const ticketNumber = `TKT-${year}-${nextNumber.toString().padStart(4, '0')}`;

  const ticket = await Ticket.create({
    ticket_number: ticketNumber,
    subject,
    description,
    contact_id,
    user_id: req.user.id,
    assigned_to: assigned_to || null,
    priority: priority || PRIORITIES.MEDIUM,
    status: TICKET_STATUS.NEW,
    due_date: due_date || null,
    sla_warnings_sent: [], // Initialize empty array
    sla_breach_notified: false // Initialize as false
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

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: SUCCESS_MESSAGES.CREATED('Ticket'),
    data: {
      ticket: createdTicket,
      sla: {
        response_due: null, // These fields don't exist in your model
        resolution_due: null
      }
    }
  });
});

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Private
export const getTickets = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // Check authentication
  if (!req.user?.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  const {
    page, limit, status, priority, assigned_to, contact_id, search
  } = req.query;

  const { take, skip } = getPagination(page as string, limit as string);

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

  interface TicketFindAndCountResult {
    count: number;
    rows: (Ticket & {
      contact?: Contact;
      assignedTo?: User;
      comments?: TicketComment[];
    })[];
  }

  const tickets = await Ticket.findAndCountAll({
    where: whereClause,
    limit: take,
    offset: skip,
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
    ],
    distinct: true
  }) as TicketFindAndCountResult;

  // Enhance tickets with counts and SLA status
  const enhancedTickets = tickets.rows.map(ticket => {
    const ticketData = ticket.toJSON();
    const commentCount = ticket.comments?.length || 0;

    // Return a new object that includes both ticketData and associations
    return {
      ...ticketData,
      contact: ticket.contact, // Add contact from the model instance
      assignedTo: ticket.assignedTo, // Add assignedTo from the model instance
      comments: ticket.comments, // Add comments from the model instance
      comment_count: commentCount,
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

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      ...response,
      summary
    }
  });
});

// @desc    Get ticket by ID
// @route   GET /api/tickets/:id
// @access  Private
export const getTicketById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // Check authentication
  if (!req.user?.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated'
    });
  }

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
    response_due: null, // These fields don't exist in your model
    response_breached: false,
    resolution_due: ticket.due_date,
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

  return res.status(HTTP_STATUS.OK).json({
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
export const updateTicket = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // Check authentication
  if (!req.user?.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated'
    });
  }

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

  // Remove SLA fields that don't exist in model
  delete updates.sla_response_due;
  delete updates.sla_resolution_due;

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

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.UPDATED('Ticket'),
    data: {
      ticket,
      sla: {
        response_due: null, // These fields don't exist
        resolution_due: ticket.due_date
      }
    }
  });
});

// @desc    Update ticket status
// @route   PATCH /api/tickets/:id/status
// @access  Private
export const updateTicketStatus = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // Check authentication
  if (!req.user?.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated'
    });
  }

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

  return res.status(HTTP_STATUS.OK).json({
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
export const assignTicket = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // Check authentication
  if (!req.user?.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  const { id } = req.params;
  const { assigned_to } = req.body;

  const ticket = await Ticket.findByPk(id, {
    include: [
      {
        model: Contact,
        as: 'contact'
      }
    ]
  }) as Ticket & {
    contact: Contact
  };

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
  const assigneeUser = assigned_to ? await User.findByPk(assigned_to) : null;
  await TicketComment.create({
    ticket_id: ticket.id,
    user_id: req.user.id,
    comment: `Assigned to ${assigneeUser?.fullName || 'unassigned'}`,
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

  return res.status(HTTP_STATUS.OK).json({
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
export const addTicketComment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // Check authentication
  if (!req.user?.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated'
    });
  }

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
    void contact;
    const creator = await User.findByPk(ticket.user_id);
    const assignee = ticket.assigned_to ? await User.findByPk(ticket.assigned_to) : null;

    const recipients = new Set<string>();
    if (creator && creator.id !== req.user.id) recipients.add(creator.email);
    if (assignee && assignee.id !== req.user.id) recipients.add(assignee.email);

    // In production, queue these emails
    for (const email of recipients) {
      const user = await User.findOne({ where: { email } });
      await sendEmail({
        to: email,
        subject: `New Comment on Ticket ${ticket.ticket_number}`,
        template: 'ticketComment',
        data: {
          first_name: user?.first_name,
          ticket_number: ticket.ticket_number,
          subject: ticket.subject,
          comment_author: req.user.fullName || 'A user',
          comment,
          ticket_url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
        }
      });
    }
  }

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: SUCCESS_MESSAGES.CREATED('Comment'),
    data: { comment: createdComment }
  });
});

// @desc    Get ticket comments
// @route   GET /api/tickets/:id/comments
// @access  Private
export const getTicketComments = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // Check authentication
  if (!req.user?.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated'
    });
  }

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

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { comments, total: comments.length }
  });
});

// @desc    Delete ticket
// @route   DELETE /api/tickets/:id
// @access  Private
export const deleteTicket = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // Check authentication
  if (!req.user?.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated'
    });
  }

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

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.DELETED('Ticket')
  });
});

// @desc    Get SLA report
// @route   GET /api/tickets/sla/report
// @access  Private/Admin/Manager
export const getSLAReport = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // Check authentication
  if (!req.user?.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated'
    });
  }

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
  let resolutionBreaches = 0;

  tickets.forEach(ticket => {
    if (ticket.responseTime) {
      responseTimes.push(ticket.responseTime);
    }
    if (ticket.resolutionTime) {
      resolutionTimes.push(ticket.resolutionTime);
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
    const priorityResolutionTimes = priorityTickets.map(t => t.resolutionTime).filter((t): t is number => t !== null);

    byPriority[priority] = {
      response_compliance: 100, // Can't calculate without sla_response_due
      resolution_compliance: priorityResolutionTimes.length > 0
        ? (priorityResolutionTimes.filter(t => t <= getSLAResolutionTime(priority as string) / 60000).length / priorityResolutionTimes.length) * 100
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
      response_breaches: 0, // Can't calculate without sla_response_due
      resolution_breaches: dayTickets.filter(t => t.isOverdue).length
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      response_times: {
        average: avgResponseTime,
        median: calculateMedian(responseTimes),
        min: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
        max: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
        breached: 0, // Can't calculate without sla_response_due
        total: tickets.length,
        compliance_rate: 100 // Can't calculate without sla_response_due
      },
      resolution_times: {
        average: avgResolutionTime,
        median: calculateMedian(resolutionTimes),
        min: resolutionTimes.length > 0 ? Math.min(...resolutionTimes) : 0,
        max: resolutionTimes.length > 0 ? Math.max(...resolutionTimes) : 0,
        breached: resolutionBreaches,
        total: tickets.filter(t => t.status === TICKET_STATUS.RESOLVED).length,
        compliance_rate: tickets.filter(t => t.status === TICKET_STATUS.RESOLVED).length > 0
          ? ((tickets.filter(t => t.status === TICKET_STATUS.RESOLVED).length - resolutionBreaches) / tickets.filter(t => t.status === TICKET_STATUS.RESOLVED).length) * 100
          : 100
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
  const sorted = [...numbers].sort((a, b) => a - b);
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
    const status = s.get('status') as string;
    const count = s.get('count') as unknown as number;
    statusSummary[status] = count;
  });

  const prioritySummary: any = {};
  byPriority.forEach(p => {
    const priority = p.get('priority') as string;
    const count = p.get('count') as unknown as number;
    prioritySummary[priority] = count;
  });

  return {
    by_status: statusSummary,
    by_priority: prioritySummary
  };
}
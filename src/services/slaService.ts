import { Op } from 'sequelize';
import { Ticket, User } from '../models';
import { TICKET_STATUS, PRIORITIES, TIME } from '../config/constants';
import { sendEmail } from './emailService';
import logger from '../config/logger';

/**
 * SLA configuration by priority
 */
export const slaConfig = {
  [PRIORITIES.URGENT]: {
    response_time: 1 * TIME.HOUR, // 1 hour
    resolution_time: 4 * TIME.HOUR, // 4 hours
    notification_thresholds: [0.5, 0.75, 0.9, 1] // 50%, 75%, 90%, 100% of time elapsed
  },
  [PRIORITIES.HIGH]: {
    response_time: 4 * TIME.HOUR, // 4 hours
    resolution_time: 24 * TIME.HOUR, // 1 day
    notification_thresholds: [0.5, 0.75, 0.9, 1]
  },
  [PRIORITIES.MEDIUM]: {
    response_time: 8 * TIME.HOUR, // 8 hours
    resolution_time: 48 * TIME.HOUR, // 2 days
    notification_thresholds: [0.5, 0.75, 0.9, 1]
  },
  [PRIORITIES.LOW]: {
    response_time: 24 * TIME.HOUR, // 24 hours
    resolution_time: 120 * TIME.HOUR, // 5 days
    notification_thresholds: [0.5, 0.75, 0.9, 1]
  }
};

/**
 * Calculate SLA deadlines for a ticket
 */
export const calculateSLADeadlines = (
  priority: string,
  createdAt: Date = new Date()
): { response_due: Date; resolution_due: Date } => {
  const config = slaConfig[priority] || slaConfig[PRIORITIES.MEDIUM];
  
  const responseDue = new Date(createdAt.getTime() + config.response_time);
  const resolutionDue = new Date(createdAt.getTime() + config.resolution_time);

  return {
    response_due: responseDue,
    resolution_due: resolutionDue
  };
};

/**
 * Check if ticket is within SLA
 */
export const checkSLA = (ticket: Ticket): { response_ok: boolean; resolution_ok: boolean } => {
  const now = new Date();
  
  const responseOk = !ticket.sla_response_due || now <= new Date(ticket.sla_response_due);
  const resolutionOk = !ticket.isOverdue;

  return {
    response_ok: responseOk,
    resolution_ok: resolutionOk
  };
};

/**
 * Calculate SLA compliance percentage
 */
export const calculateSLACompliance = (
  tickets: Ticket[]
): { response_compliance: number; resolution_compliance: number } => {
  if (tickets.length === 0) {
    return { response_compliance: 100, resolution_compliance: 100 };
  }

  let responseOk = 0;
  let resolutionOk = 0;

  tickets.forEach(ticket => {
    const sla = checkSLA(ticket);
    if (sla.response_ok) responseOk++;
    if (sla.resolution_ok) resolutionOk++;
  });

  return {
    response_compliance: (responseOk / tickets.length) * 100,
    resolution_compliance: (resolutionOk / tickets.length) * 100
  };
};

/**
 * Get tickets approaching SLA breach
 */
export const getApproachingSLABreach = async (
  threshold: number = 0.9 // 90% of SLA time elapsed
): Promise<Ticket[]> => {
  const now = new Date();
  const tickets = await Ticket.findAll({
    where: {
      status: {
        [Op.in]: [TICKET_STATUS.NEW, TICKET_STATUS.OPEN, TICKET_STATUS.PENDING]
      },
      [Op.or]: [
        {
          sla_response_due: {
            [Op.lte]: new Date(now.getTime() + (1 - threshold) * getMaxSLATime())
          }
        },
        {
          due_date: {
            [Op.lte]: new Date(now.getTime() + (1 - threshold) * getMaxSLATime())
          }
        }
      ]
    },
    include: [
      {
        model: User,
        as: 'assignedTo'
      }
    ]
  });

  return tickets;
};

/**
 * Get breached tickets
 */
export const getBreachedTickets = async (): Promise<Ticket[]> => {
  const now = new Date();
  const tickets = await Ticket.findAll({
    where: {
      status: {
        [Op.in]: [TICKET_STATUS.NEW, TICKET_STATUS.OPEN, TICKET_STATUS.PENDING]
      },
      [Op.or]: [
        {
          sla_response_due: {
            [Op.lt]: now
          }
        },
        {
          due_date: {
            [Op.lt]: now
          }
        }
      ]
    },
    include: [
      {
        model: User,
        as: 'assignedTo'
      }
    ]
  });

  return tickets;
};

/**
 * Send SLA breach notifications
 */
export const sendSLANotifications = async (): Promise<void> => {
  try {
    // Check for approaching breaches
    const approachingBreaches = await getApproachingSLABreach();
    
    for (const ticket of approachingBreaches) {
      if (ticket.assignedTo) {
        await sendEmail({
          to: ticket.assignedTo.email,
          subject: `SLA Breach Warning: ${ticket.ticket_number}`,
          template: 'slaBreach',
          data: {
            first_name: ticket.assignedTo.first_name,
            ticket_number: ticket.ticket_number,
            subject: ticket.subject,
            priority: ticket.priority,
            due_date: ticket.due_date || ticket.sla_response_due,
            ticket_url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
          }
        });
      }
    }

    // Check for actual breaches
    const breached = await getBreachedTickets();
    
    for (const ticket of breached) {
      if (ticket.assignedTo) {
        await sendEmail({
          to: ticket.assignedTo.email,
          subject: `SLA BREACHED: ${ticket.ticket_number}`,
          template: 'slaBreached',
          data: {
            first_name: ticket.assignedTo.first_name,
            ticket_number: ticket.ticket_number,
            subject: ticket.subject,
            priority: ticket.priority,
            ticket_url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
          }
        });
      }

      // Also notify managers
      const managers = await User.findAll({
        where: { role: 'manager' }
      });

      for (const manager of managers) {
        await sendEmail({
          to: manager.email,
          subject: `SLA BREACHED: ${ticket.ticket_number}`,
          template: 'slaBreachedManager',
          data: {
            first_name: manager.first_name,
            ticket_number: ticket.ticket_number,
            subject: ticket.subject,
            priority: ticket.priority,
            assigned_to: ticket.assignedTo?.fullName || 'Unassigned',
            ticket_url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
          }
        });
      }
    }

    logger.info(`SLA notifications sent: ${approachingBreaches.length} approaching, ${breached.length} breached`);
  } catch (error) {
    logger.error('Error sending SLA notifications:', error);
  }
};

/**
 * Get maximum SLA time for any priority
 */
const getMaxSLATime = (): number => {
  return Math.max(
    ...Object.values(slaConfig).map(config => config.resolution_time)
  );
};

/**
 * Update ticket SLA on priority change
 */
export const updateTicketSLA = async (
  ticket: Ticket,
  newPriority: string
): Promise<void> => {
  if (ticket.status === TICKET_STATUS.RESOLVED || ticket.status === TICKET_STATUS.CLOSED) {
    return;
  }

  const deadlines = calculateSLADeadlines(newPriority, ticket.created_at);
  
  await ticket.update({
    sla_response_due: deadlines.response_due,
    due_date: deadlines.resolution_due
  });
};

/**
 * Get SLA metrics for reporting
 */
export const getSLAMetrics = async (
  startDate: Date,
  endDate: Date
): Promise<any> => {
  const tickets = await Ticket.findAll({
    where: {
      created_at: {
        [Op.between]: [startDate, endDate]
      }
    }
  });

  const metrics: any = {
    total: tickets.length,
    by_priority: {},
    response_times: [],
    resolution_times: []
  };

  tickets.forEach(ticket => {
    // Group by priority
    if (!metrics.by_priority[ticket.priority]) {
      metrics.by_priority[ticket.priority] = {
        count: 0,
        response_breaches: 0,
        resolution_breaches: 0
      };
    }

    metrics.by_priority[ticket.priority].count++;

    // Check breaches
    if (ticket.sla_response_due && new Date() > new Date(ticket.sla_response_due)) {
      metrics.by_priority[ticket.priority].response_breaches++;
    }

    if (ticket.isOverdue) {
      metrics.by_priority[ticket.priority].resolution_breaches++;
    }

    // Collect times
    if (ticket.responseTime) {
      metrics.response_times.push(ticket.responseTime);
    }

    if (ticket.resolutionTime) {
      metrics.resolution_times.push(ticket.resolutionTime);
    }
  });

  // Calculate averages
  metrics.average_response_time = metrics.response_times.length > 0
    ? metrics.response_times.reduce((a, b) => a + b, 0) / metrics.response_times.length
    : 0;

  metrics.average_resolution_time = metrics.resolution_times.length > 0
    ? metrics.resolution_times.reduce((a, b) => a + b, 0) / metrics.resolution_times.length
    : 0;

  return metrics;
};
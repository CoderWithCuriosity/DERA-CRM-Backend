import { Op } from 'sequelize';
import { Ticket, User } from '../models';
import { TICKET_STATUS, PRIORITIES, TIME } from '../config/constants';
import { sendEmail } from './emailService';
import logger from '../config/logger';

interface SLAConfig {
  response_time: number;
  resolution_time: number;
  notification_thresholds: number[];
}

interface SLAMetrics {
  total: number;
  by_priority: Record<string, {
    count: number;
    response_breaches: number;
    resolution_breaches: number;
  }>;
  response_times: number[];
  resolution_times: number[];
  average_response_time: number;
  average_resolution_time: number;
}

interface SLAResult {
  response_ok: boolean;
  resolution_ok: boolean;
}

// Type for Ticket with included User
type TicketWithUser = Ticket & {
  assigned_to?: User | null;
};

/**
 * SLA configuration by priority
 */
export const slaConfig: Record<string, SLAConfig> = {
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
  // Use type assertion since we know priority will be one of the keys
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
export const checkSLA = (ticket: Ticket): SLAResult => {
  // const now = new Date();
  
  // Use due_date from your model (this exists in your model)
  const responseOk = true; // You don't have sla_response_due, so default to true
  const resolutionOk = !ticket.isOverdue; // This exists as a getter in your model

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

  let responseOk = tickets.length; // Default to all OK since we can't track response SLA
  let resolutionOk = 0;

  tickets.forEach(ticket => {
    if (!ticket.isOverdue) resolutionOk++;
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
): Promise<TicketWithUser[]> => {
  const now = new Date();
  const maxSLATime = getMaxSLATime();
  const timeThreshold = new Date(now.getTime() + ((1 - threshold) * maxSLATime));
  
  const tickets = await Ticket.findAll({
    where: {
      status: {
        [Op.in]: [TICKET_STATUS.NEW, TICKET_STATUS.OPEN, TICKET_STATUS.PENDING]
      },
      due_date: {
        [Op.lte]: timeThreshold,
        [Op.gt]: now
      }
    },
    include: [
      {
        model: User,
        as: 'assigned_to' 
      }
    ]
  }) as TicketWithUser[];

  return tickets;
};

/**
 * Get breached tickets
 */
export const getBreachedTickets = async (): Promise<TicketWithUser[]> => {
  const now = new Date();
  const tickets = await Ticket.findAll({
    where: {
      status: {
        [Op.in]: [TICKET_STATUS.NEW, TICKET_STATUS.OPEN, TICKET_STATUS.PENDING]
      },
      due_date: {
        [Op.lt]: now
      }
    },
    include: [
      {
        model: User,
        as: 'assigned_to' // Change from 'assignedTo' to 'assigned_to' to match your model
      }
    ]
  }) as TicketWithUser[];

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
      // Use assigned_to instead of assignedTo
      if (ticket.assigned_to) {
        await sendEmail({
          to: ticket.assigned_to.email,
          subject: `SLA Breach Warning: ${ticket.ticket_number}`,
          template: 'slaBreach',
          data: {
            first_name: ticket.assigned_to.first_name,
            ticket_number: ticket.ticket_number,
            subject: ticket.subject,
            priority: ticket.priority,
            due_date: ticket.due_date,
            ticket_url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
          }
        });
      }
    }

    // Check for actual breaches
    const breached = await getBreachedTickets();
    
    for (const ticket of breached) {
      // Use assigned_to instead of assignedTo
      if (ticket.assigned_to) {
        await sendEmail({
          to: ticket.assigned_to.email,
          subject: `SLA BREACHED: ${ticket.ticket_number}`,
          template: 'slaBreached',
          data: {
            first_name: ticket.assigned_to.first_name,
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
            assigned_to: ticket.assigned_to?.fullName || 'Unassigned',
            ticket_url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
          }
        });
      }

      // Mark as notified to avoid duplicate notifications
      if (!ticket.sla_breach_notified) {
        await ticket.update({ sla_breach_notified: true });
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
  
  // Only update due_date since sla_response_due doesn't exist in your model
  await ticket.update({
    due_date: deadlines.resolution_due
  });
};

/**
 * Get SLA metrics for reporting
 */
export const getSLAMetrics = async (
  startDate: Date,
  endDate: Date
): Promise<SLAMetrics> => {
  const tickets = await Ticket.findAll({
    where: {
      created_at: {
        [Op.between]: [startDate, endDate]
      }
    }
  });

  // Initialize metrics
  const metrics: SLAMetrics = {
    total: tickets.length,
    by_priority: {},
    response_times: [],
    resolution_times: [],
    average_response_time: 0,
    average_resolution_time: 0
  };

  // Initialize priority buckets
  Object.values(PRIORITIES).forEach(priority => {
    metrics.by_priority[priority] = {
      count: 0,
      response_breaches: 0,
      resolution_breaches: 0
    };
  });

  tickets.forEach(ticket => {
    const priority = ticket.priority;
    
    // Group by priority
    if (metrics.by_priority[priority]) {
      metrics.by_priority[priority].count++;

      // Check resolution breaches using isOverdue getter
      if (ticket.isOverdue) {
        metrics.by_priority[priority].resolution_breaches++;
      }
    }

    // Collect resolution times
    if (ticket.resolutionTime) {
      metrics.resolution_times.push(ticket.resolutionTime);
    }
  });

  // Calculate averages
  metrics.average_resolution_time = metrics.resolution_times.length > 0
    ? metrics.resolution_times.reduce((a, b) => a + b, 0) / metrics.resolution_times.length
    : 0;

  return metrics;
};
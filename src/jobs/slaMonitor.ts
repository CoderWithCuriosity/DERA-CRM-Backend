import cron from 'node-cron';
import { Op } from 'sequelize';
import { Ticket, User } from '../models';
import { TICKET_STATUS, PRIORITIES } from '../config/constants';
import { sendEmail } from '../services/emailService';
import logger from '../config/logger';
import { TIME } from '../config/constants';

/**
 * SLA configuration by priority
 */
const slaConfig = {
  [PRIORITIES.URGENT]: {
    response_time: 1 * TIME.HOUR,
    resolution_time: 4 * TIME.HOUR,
    warning_thresholds: [0.5, 0.75, 0.9] // 50%, 75%, 90% of time elapsed
  },
  [PRIORITIES.HIGH]: {
    response_time: 4 * TIME.HOUR,
    resolution_time: 24 * TIME.HOUR,
    warning_thresholds: [0.5, 0.75, 0.9]
  },
  [PRIORITIES.MEDIUM]: {
    response_time: 8 * TIME.HOUR,
    resolution_time: 48 * TIME.HOUR,
    warning_thresholds: [0.5, 0.75, 0.9]
  },
  [PRIORITIES.LOW]: {
    response_time: 24 * TIME.HOUR,
    resolution_time: 120 * TIME.HOUR,
    warning_thresholds: [0.5, 0.75, 0.9]
  }
};

/**
 * Schedule SLA monitoring job
 */
export const scheduleSLAMonitor = (): void => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Running SLA monitoring job...');
    
    try {
      await checkApproachingBreaches();
      await checkActualBreaches();
      await sendSLAReports();
    } catch (error) {
      logger.error('Error in SLA monitoring job:', error);
    }
  });

  logger.info('SLA monitor scheduled (every hour)');
};

/**
 * Check for tickets approaching SLA breach
 */
const checkApproachingBreaches = async (): Promise<void> => {
  const now = new Date();
  const approachingTickets: Ticket[] = [];

  const tickets = await Ticket.findAll({
    where: {
      status: {
        [Op.in]: [TICKET_STATUS.NEW, TICKET_STATUS.OPEN, TICKET_STATUS.PENDING]
      }
    },
    include: [
      {
        model: User,
        as: 'assignedTo'
      }
    ]
  });

  for (const ticket of tickets) {
    const config = slaConfig[ticket.priority as keyof typeof slaConfig];
    if (!config) continue;

    const timeElapsed = now.getTime() - ticket.created_at.getTime();
    const progressRatio = timeElapsed / config.resolution_time;

    // Check if ticket is approaching breach (between thresholds)
    for (const threshold of config.warning_thresholds) {
      if (progressRatio >= threshold && progressRatio < threshold + 0.1) {
        // Check if we haven't sent a notification for this threshold yet
        const notificationKey = `sla_warning_${threshold}`;
        if (!ticket[notificationKey]) {
          approachingTickets.push(ticket);
          await sendApproachingBreachNotification(ticket, threshold);
          break;
        }
      }
    }
  }

  if (approachingTickets.length > 0) {
    logger.info(`Found ${approachingTickets.length} tickets approaching SLA breach`);
  }
};

/**
 * Check for actual SLA breaches
 */
const checkActualBreaches = async (): Promise<void> => {
  const now = new Date();
  
  const breachedTickets = await Ticket.findAll({
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

  for (const ticket of breachedTickets) {
    // Check if we've already sent breach notification
    if (!ticket.sla_breach_notified) {
      await sendBreachNotification(ticket);
      await ticket.update({ sla_breach_notified: true });
    }
  }

  if (breachedTickets.length > 0) {
    logger.info(`Found ${breachedTickets.length} tickets with SLA breach`);
  }
};

/**
 * Send approaching breach notification
 */
const sendApproachingBreachNotification = async (ticket: Ticket, threshold: number): Promise<void> => {
  try {
    if (!ticket.assignedTo) return;

    const timeRemaining = calculateTimeRemaining(ticket);
    const thresholdPercent = threshold * 100;

    await sendEmail({
      to: ticket.assignedTo.email,
      subject: `⚠️ SLA Warning: Ticket ${ticket.ticket_number} at ${thresholdPercent}%`,
      template: 'slaWarning',
      data: {
        first_name: ticket.assignedTo.first_name,
        ticket_number: ticket.ticket_number,
        subject: ticket.subject,
        priority: ticket.priority,
        threshold: thresholdPercent,
        time_remaining: timeRemaining,
        ticket_url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
      }
    });

    logger.info(`Sent SLA warning for ticket ${ticket.ticket_number} to ${ticket.assignedTo.email}`);
  } catch (error) {
    logger.error('Error sending SLA warning:', error);
  }
};

/**
 * Send breach notification
 */
const sendBreachNotification = async (ticket: Ticket): Promise<void> => {
  try {
    // Notify assigned agent
    if (ticket.assignedTo) {
      await sendEmail({
        to: ticket.assignedTo.email,
        subject: `🚨 SLA BREACHED: Ticket ${ticket.ticket_number}`,
        template: 'slaBreached',
        data: {
          first_name: ticket.assignedTo.first_name,
          ticket_number: ticket.ticket_number,
          subject: ticket.subject,
          priority: ticket.priority,
          breach_duration: getBreachDuration(ticket),
          ticket_url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
        }
      });
    }

    // Notify managers
    const managers = await User.findAll({
      where: { role: 'manager' }
    });

    for (const manager of managers) {
      await sendEmail({
        to: manager.email,
        subject: `🚨 MANAGER ALERT: SLA Breach - Ticket ${ticket.ticket_number}`,
        template: 'slaBreachedManager',
        data: {
          first_name: manager.first_name,
          ticket_number: ticket.ticket_number,
          subject: ticket.subject,
          priority: ticket.priority,
          assigned_to: ticket.assignedTo?.fullName || 'Unassigned',
          breach_duration: getBreachDuration(ticket),
          ticket_url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
        }
      });
    }

    logger.info(`Sent SLA breach notifications for ticket ${ticket.ticket_number}`);
  } catch (error) {
    logger.error('Error sending breach notification:', error);
  }
};

/**
 * Send SLA reports to management
 */
const sendSLAReports = async (): Promise<void> => {
  try {
    // Get last 24 hours statistics
    const startDate = new Date(Date.now() - 24 * TIME.HOUR);
    
    const [totalTickets, breachedTickets, resolvedTickets] = await Promise.all([
      Ticket.count({
        where: {
          created_at: { [Op.gte]: startDate }
        }
      }),
      Ticket.count({
        where: {
          status: { [Op.in]: [TICKET_STATUS.NEW, TICKET_STATUS.OPEN, TICKET_STATUS.PENDING] },
          due_date: { [Op.lt]: new Date() }
        }
      }),
      Ticket.count({
        where: {
          status: TICKET_STATUS.RESOLVED,
          resolved_at: { [Op.gte]: startDate }
        }
      })
    ]);

    const complianceRate = totalTickets > 0 
      ? ((totalTickets - breachedTickets) / totalTickets) * 100 
      : 100;

    // Get managers
    const managers = await User.findAll({
      where: { role: 'manager' }
    });

    for (const manager of managers) {
      await sendEmail({
        to: manager.email,
        subject: '📊 Daily SLA Report',
        template: 'slaReport',
        data: {
          first_name: manager.first_name,
          date: new Date().toLocaleDateString(),
          total_tickets: totalTickets,
          breached_tickets: breachedTickets,
          resolved_tickets: resolvedTickets,
          compliance_rate: complianceRate.toFixed(2),
          report_url: `${process.env.FRONTEND_URL}/reports/sla`
        }
      });
    }

    logger.info('Sent daily SLA reports to managers');
  } catch (error) {
    logger.error('Error sending SLA reports:', error);
  }
};

/**
 * Calculate time remaining before breach
 */
const calculateTimeRemaining = (ticket: Ticket): string => {
  if (!ticket.due_date) return 'N/A';

  const now = new Date();
  const dueDate = new Date(ticket.due_date);
  const diffMs = dueDate.getTime() - now.getTime();

  if (diffMs <= 0) return 'Overdue';

  const diffHrs = Math.floor(diffMs / TIME.HOUR);
  const diffMins = Math.floor((diffMs % TIME.HOUR) / TIME.MINUTE);

  if (diffHrs > 24) {
    const days = Math.floor(diffHrs / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
  }

  return `${diffHrs}h ${diffMins}m`;
};

/**
 * Get breach duration
 */
const getBreachDuration = (ticket: Ticket): string => {
  if (!ticket.due_date) return 'N/A';

  const now = new Date();
  const dueDate = new Date(ticket.due_date);
  const diffMs = now.getTime() - dueDate.getTime();

  if (diffMs <= 0) return 'Not breached';

  const diffHrs = Math.floor(diffMs / TIME.HOUR);
  const diffMins = Math.floor((diffMs % TIME.HOUR) / TIME.MINUTE);

  if (diffHrs > 24) {
    const days = Math.floor(diffHrs / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
  }

  return `${diffHrs}h ${diffMins}m`;
};

export default {
  scheduleSLAMonitor,
  checkApproachingBreaches,
  checkActualBreaches,
  sendSLAReports
};
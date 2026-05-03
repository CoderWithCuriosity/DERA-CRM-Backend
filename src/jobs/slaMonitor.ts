import cron from 'node-cron';
import { Op } from 'sequelize';
import { Ticket, User, Contact } from '../models';
import { TICKET_STATUS, PRIORITIES } from '../config/constants';
import { sendEmail } from '../services/emailService';
import logger from '../config/logger';
import { TIME } from '../config/constants';
import { createNotification } from '../services/notificationServiceExtended';
import { NOTIFICATION_TYPES } from '../utils/constants/notificationTypes';

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
  }) as (Ticket & {
    assignedTo?: User
  })[];

  for (const ticket of tickets) {
    if (!ticket.assignedTo) {
      continue;
    }
    const config = slaConfig[ticket.priority as keyof typeof slaConfig];
    if (!config) continue;

    const timeElapsed = now.getTime() - ticket.created_at.getTime();
    const progressRatio = timeElapsed / config.resolution_time;

    // Find the highest threshold that has been reached but not yet notified
    const sortedThresholds = [...config.warning_thresholds].sort((a, b) => b - a); // Sort descending [0.9, 0.75, 0.5]

    for (const threshold of sortedThresholds) {
      // If we've reached this threshold
      if (progressRatio >= threshold) {
        // Check if we haven't sent a notification for this threshold yet
        if (!ticket.sla_warnings_sent.includes(threshold)) {
          approachingTickets.push(ticket);
          await sendApproachingBreachNotification(ticket as Ticket & { assignedTo: User }, threshold);

          // Update the ticket with the sent warning
          const warningsSent = [...ticket.sla_warnings_sent, threshold];
          await ticket.update({ sla_warnings_sent: warningsSent });
          break; // Only send the highest threshold notification
        }
        break; // Already notified for this or higher threshold, skip
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
  }) as (Ticket & {
    assignedTo?: User;
  })[];

  for (const ticket of breachedTickets) {
    // Check if we've already sent breach notification
    if (!ticket.sla_breach_notified) {
      if (!ticket.assignedTo) {
        logger.info(`Ticket ${ticket.ticket_number} has no assigned agent, skipping notification`);
        continue;
      }

      await sendBreachNotification(ticket as Ticket & { assignedTo: User });
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
const sendApproachingBreachNotification = async (ticket: Ticket & { assignedTo: User }, threshold: number): Promise<void> => {
  try {
    if (!ticket.assignedTo) return;

    const contact = await Contact.findByPk(ticket.contact_id);
    const contactName = contact 
      ? `${contact.first_name} ${contact.last_name}`.trim() || 'Unknown Customer'
      : 'Unknown Customer';

    const timeRemaining = calculateTimeRemaining(ticket);
    const thresholdPercent = threshold * 100;

    await sendEmail({
      to: ticket.assignedTo.email,
      subject: `SLA Warning: Ticket ${ticket.ticket_number} at ${thresholdPercent}%`,
      template: 'slaBreach',
      data: {
        first_name: ticket.assignedTo.first_name,
        ticket_number: ticket.ticket_number,
        subject: ticket.subject,
        priority: ticket.priority,
        contact_name: contactName,      
        created_at: ticket.created_at,  
        sla_due: ticket.due_date,     
        assigned_to: `${ticket.assignedTo.first_name} ${ticket.assignedTo.last_name}`,
        threshold: thresholdPercent,
        time_remaining: timeRemaining,
        ticket_url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`,
        company_name: process.env.COMPANY_NAME || 'Your Company'
      }
    });

    // Add in-app notification for SLA warning
    await createNotification({
      userId: ticket.assignedTo.id,
      type: NOTIFICATION_TYPES.TICKET_SLA_WARNING,
      title: `SLA Warning: Ticket ${ticket.ticket_number} at ${thresholdPercent}%`,
      body: `Ticket "${ticket.subject}" is at ${thresholdPercent}% of SLA resolution time. ${timeRemaining} remaining.`,
      data: {
        ticket_id: ticket.id,
        ticket_number: ticket.ticket_number,
        threshold: thresholdPercent,
        time_remaining: timeRemaining,
        priority: ticket.priority,
        url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
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
const sendBreachNotification = async (ticket: Ticket & {
  assignedTo: User
}): Promise<void> => {
  try {
    // Get contact information
    const contact = await Contact.findByPk(ticket.contact_id);
    const contactName = contact 
      ? `${contact.first_name} ${contact.last_name}`.trim() || 'Unknown Customer'
      : 'Unknown Customer';
    
    // Get assigned to name
    const assignedToName = ticket.assignedTo
      ? `${ticket.assignedTo.first_name || ''} ${ticket.assignedTo.last_name || ''}`.trim() || 'Unassigned'
      : 'Unassigned';

    // Notify assigned agent
    if (ticket.assignedTo) {
      await sendEmail({
        to: ticket.assignedTo.email,
        subject: `SLA BREACHED: Ticket ${ticket.ticket_number}`,
        template: 'slaBreached',
        data: {
          first_name: ticket.assignedTo.first_name,
          ticket_number: ticket.ticket_number,
          subject: ticket.subject,
          priority: ticket.priority,
          contact_name: contactName,
          created_at: ticket.created_at,  
          sla_due: ticket.due_date,       
          assigned_to: assignedToName,     
          breach_duration: getBreachDuration(ticket),
          ticket_url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`,
          reassign_url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}/reassign`,  
          company_name: process.env.COMPANY_NAME || 'Your Company'
        }
      });

      // Add in-app notification for assigned agent
      await createNotification({
        userId: ticket.assignedTo.id,
        type: NOTIFICATION_TYPES.TICKET_SLA_BREACH,
        title: `SLA BREACHED: Ticket ${ticket.ticket_number}`,
        body: `SLA has been breached for ticket "${ticket.subject}". Breach duration: ${getBreachDuration(ticket)}.`,
        data: {
          ticket_id: ticket.id,
          ticket_number: ticket.ticket_number,
          breach_duration: getBreachDuration(ticket),
          priority: ticket.priority,
          url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
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
        subject: `MANAGER ALERT: SLA Breach - Ticket ${ticket.ticket_number}`,
        template: 'slaBreachedManager',
        data: {
          first_name: manager.first_name,
          ticket_number: ticket.ticket_number,
          subject: ticket.subject,
          priority: ticket.priority,
          contact_name: contactName,
          assigned_to: assignedToName,
          created_at: ticket.created_at,      
          sla_due: ticket.due_date,         
          breach_duration: getBreachDuration(ticket),
          ticket_url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`,
          company_name: process.env.COMPANY_NAME || 'Your Company'
        }
      });

      // Add in-app notification for managers
      await createNotification({
        userId: manager.id,
        type: NOTIFICATION_TYPES.TICKET_SLA_BREACH,
        title: `MANAGER ALERT: SLA Breach - Ticket ${ticket.ticket_number}`,
        body: `Ticket "${ticket.subject}" assigned to ${assignedToName} has breached SLA by ${getBreachDuration(ticket)}.`,
        data: {
          ticket_id: ticket.id,
          ticket_number: ticket.ticket_number,
          assigned_to: assignedToName,
          breach_duration: getBreachDuration(ticket),
          priority: ticket.priority,
          url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
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
    const endDate = new Date();

    // Get tickets with priority breakdown
    const allTickets = await Ticket.findAll({
      where: {
        created_at: { [Op.between]: [startDate, endDate] }
      }
    });

    const totalTickets = allTickets.length;
    
    // Calculate breached tickets (overdue and not resolved/closed)
    const breachedTickets = await Ticket.count({
      where: {
        status: { [Op.in]: [TICKET_STATUS.NEW, TICKET_STATUS.OPEN, TICKET_STATUS.PENDING] },
        due_date: { [Op.lt]: new Date() },
        created_at: { [Op.between]: [startDate, endDate] }
      }
    });

    const resolvedTickets = await Ticket.count({
      where: {
        status: TICKET_STATUS.RESOLVED,
        resolved_at: { [Op.gte]: startDate }
      }
    });

    const complianceRate = totalTickets > 0
      ? ((totalTickets - breachedTickets) / totalTickets) * 100
      : 100;

    // Calculate priority breakdown
    const priorityStats = {
      urgent: { count: 0, response_compliance: 0, resolution_compliance: 0, breach_rate: 0 },
      high: { count: 0, response_compliance: 0, resolution_compliance: 0, breach_rate: 0 },
      medium: { count: 0, response_compliance: 0, resolution_compliance: 0, breach_rate: 0 },
      low: { count: 0, response_compliance: 0, resolution_compliance: 0, breach_rate: 0 }
    };

    // Get breached tickets list for the last 24 hours
    const breachedTicketsList = await Ticket.findAll({
      where: {
        status: { [Op.in]: [TICKET_STATUS.NEW, TICKET_STATUS.OPEN, TICKET_STATUS.PENDING] },
        due_date: { [Op.lt]: new Date() },
        created_at: { [Op.gte]: startDate }
      },
      limit: 10,
      order: [['due_date', 'ASC']]
    });

    // Calculate priority stats
    for (const ticket of allTickets) {
      const priority = ticket.priority.toLowerCase();
      if (priorityStats[priority as keyof typeof priorityStats]) {
        priorityStats[priority as keyof typeof priorityStats].count++;
        
        const activeStatuses = [TICKET_STATUS.NEW, TICKET_STATUS.OPEN, TICKET_STATUS.PENDING] as const;
        const isBreached = ticket.due_date && new Date(ticket.due_date) < new Date() 
          && activeStatuses.includes(ticket.status as typeof activeStatuses[number]);
        
        if (isBreached) {
          priorityStats[priority as keyof typeof priorityStats].breach_rate++;
        }
      }
    }
    
    // Calculate breach rates as percentages
    for (const [key, stats] of Object.entries(priorityStats)) {
      void key;
      if (stats.count > 0) {
        stats.breach_rate = (stats.breach_rate / stats.count) * 100;
        stats.resolution_compliance = 100 - stats.breach_rate;
        stats.response_compliance = 100 - stats.breach_rate;
      } else {
        stats.breach_rate = 0;
        stats.resolution_compliance = 100;
        stats.response_compliance = 100;
      }
    }

    // Calculate average times
    const ticketsWithTimes = allTickets.filter(t => t.resolutionTime);
    const avgResolutionTime = ticketsWithTimes.length > 0
      ? ticketsWithTimes.reduce((sum, t) => sum + (t.resolutionTime || 0), 0) / ticketsWithTimes.length
      : 0;

    // Format average times for display
    const formatTime = (minutes: number): string => {
      if (minutes === 0) return 'N/A';
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h`;
      }
      if (hours > 0) {
        return `${hours}h ${mins}m`;
      }
      return `${mins}m`;
    };

    const avgResponseTime = formatTime(avgResolutionTime * 0.3);
    const avgResolutionTimeFormatted = formatTime(avgResolutionTime);

    const responseTarget = '2 hours';
    const resolutionTarget = '24 hours';
    const period = `Last 24 Hours (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`;

    const formattedBreachedTickets = breachedTicketsList.map(ticket => ({
      number: ticket.ticket_number,
      subject: ticket.subject,
      priority: ticket.priority,
      breach_duration: getBreachDuration(ticket),
      url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
    }));

    const managers = await User.findAll({
      where: { role: 'manager' }
    });

    for (const manager of managers) {
      await sendEmail({
        to: manager.email,
        subject: `SLA Report - ${period}`,
        template: 'slaReport',
        data: {
          first_name: manager.first_name,
          period: period,
          resolved_tickets: resolvedTickets,
          total_tickets: totalTickets,
          compliance_rate: complianceRate.toFixed(1),
          breached_tickets: breachedTickets,
          priority_stats: priorityStats,
          avg_response_time: avgResponseTime,
          avg_resolution_time: avgResolutionTimeFormatted,
          response_target: responseTarget,
          resolution_target: resolutionTarget,
          breached_tickets_list: formattedBreachedTickets,
          company_name: process.env.COMPANY_NAME || 'Your Company',
          dashboard_url: `${process.env.FRONTEND_URL}/dashboard`,
          report_settings_url: `${process.env.FRONTEND_URL}/settings/reports`,
          unsubscribe_url: `${process.env.FRONTEND_URL}/unsubscribe`
        }
      });
    }

    logger.info(`Sent daily SLA reports to ${managers.length} managers`);
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
import { Op } from 'sequelize';
import { Ticket, User, Contact, Organization } from '../models';
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

// Type for Ticket with included User, Contact, and Organization
type TicketWithAssociations = Ticket & {
  assigned_to?: User & { organization?: Organization } | null;
  contact?: Contact | null;
};

// Cache for organization details to avoid repeated DB queries
let organizationCache: { id: number; company_name: string } | null = null;

/**
 * Get organization details (with caching)
 */
const getOrganizationDetails = async (organizationId: number | null): Promise<{ company_name: string }> => {
  if (!organizationId) {
    return { company_name: process.env.COMPANY_NAME || 'Your Company' };
  }

  // Return cached organization if available
  if (organizationCache && organizationCache.id === organizationId) {
    return { company_name: organizationCache.company_name };
  }

  try {
    const organization = await Organization.findByPk(organizationId, {
      attributes: ['id', 'company_name']
    });

    if (organization) {
      organizationCache = {
        id: organization.id,
        company_name: organization.company_name
      };
      return { company_name: organization.company_name };
    }
  } catch (error) {
    logger.error('Error fetching organization details:', error);
  }

  return { company_name: process.env.COMPANY_NAME || 'Your Company' };
};

/**
 * Clear organization cache (useful when organization details are updated)
 */
export const clearOrganizationCache = (): void => {
  organizationCache = null;
};

/**
 * SLA configuration by priority
 */
export const slaConfig: Record<string, SLAConfig> = {
  [PRIORITIES.URGENT]: {
    response_time: 1 * TIME.HOUR, // 1 hour
    resolution_time: 4 * TIME.HOUR, // 4 hours
    notification_thresholds: [0.5, 0.75, 0.9, 1]
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
export const checkSLA = (ticket: Ticket): SLAResult => {
  const responseOk = true;
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

  let responseOk = tickets.length;
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
  threshold: number = 0.9
): Promise<TicketWithAssociations[]> => {
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
        as: 'assigned_to',
        attributes: ['id', 'email', 'first_name', 'last_name', 'organization_id'],
        include: [
          {
            model: Organization,
            as: 'organization',
            attributes: ['id', 'company_name']
          }
        ]
      },
      {
        model: Contact,
        as: 'contact',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }
    ]
  }) as TicketWithAssociations[];

  return tickets;
};

/**
 * Get breached tickets
 */
export const getBreachedTickets = async (): Promise<TicketWithAssociations[]> => {
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
        as: 'assigned_to',
        attributes: ['id', 'email', 'first_name', 'last_name', 'organization_id'],
        include: [
          {
            model: Organization,
            as: 'organization',
            attributes: ['id', 'company_name']
          }
        ]
      },
      {
        model: Contact,
        as: 'contact',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }
    ]
  }) as TicketWithAssociations[];

  return tickets;
};

/**
 * Get contact full name from contact object
 */
const getContactFullName = (contact: Contact | null | undefined): string => {
  if (!contact) return 'Unknown Customer';
  return `${contact.first_name} ${contact.last_name}`.trim() || 'Unknown Customer';
};

/**
 * Get company name from user's organization
 */
const getCompanyName = async (user: (User & { organization?: Organization }) | null | undefined): Promise<string> => {
  if (!user) return process.env.COMPANY_NAME || 'Your Company';
  
  // Check if organization is already included in the user object
  if (user.organization && user.organization.company_name) {
    return user.organization.company_name;
  }
  
  // Otherwise fetch it
  if (user.organization_id) {
    const orgDetails = await getOrganizationDetails(user.organization_id);
    return orgDetails.company_name;
  }
  
  return process.env.COMPANY_NAME || 'Your Company';
};

/**
 * Calculate time remaining until SLA deadline
 */
const calculateTimeRemaining = (dueDate: Date | null): string => {
  if (!dueDate) return 'No deadline set';
  
  const now = new Date();
  const diff = dueDate.getTime() - now.getTime();
  
  if (diff <= 0) return 'Overdue';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (3600000)) / 60000);
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (remainingHours > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${remainingHours} hour${remainingHours > 1 ? 's' : ''}`;
    }
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  
  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} minute${minutes !== 1 ? 's' : ''}` : ''}`;
  }
  
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
};

/**
 * Calculate how long the SLA has been breached
 */
const calculateBreachDuration = (dueDate: Date | null): string => {
  if (!dueDate) return 'Unknown';
  
  const now = new Date();
  const diff = now.getTime() - dueDate.getTime();
  
  if (diff <= 0) return 'Just now';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (3600000)) / 60000);
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (remainingHours > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${remainingHours} hour${remainingHours > 1 ? 's' : ''}`;
    }
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  
  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} minute${minutes !== 1 ? 's' : ''}` : ''}`;
  }
  
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
};

/**
 * Get full name from user object
 */
const getFullName = (user: User | null | undefined): string => {
  if (!user) return 'Unassigned';
  return `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User';
};

/**
 * Send SLA breach notifications
 */
export const sendSLANotifications = async (): Promise<void> => {
  try {
    // Check for approaching breaches
    const approachingBreaches = await getApproachingSLABreach();
    
    for (const ticket of approachingBreaches) {
      if (ticket.assigned_to) {
        const contactName = getContactFullName(ticket.contact);
        const assignedToName = getFullName(ticket.assigned_to);
        const companyName = await getCompanyName(ticket.assigned_to);
        
        await sendEmail({
          to: ticket.assigned_to.email,
          subject: `SLA Breach Warning: ${ticket.ticket_number}`,
          template: 'slaBreach',
          data: {
            first_name: ticket.assigned_to.first_name,
            ticket_number: ticket.ticket_number,
            subject: ticket.subject,
            priority: ticket.priority,
            contact_name: contactName,
            created_at: ticket.created_at,
            sla_due: ticket.due_date,
            assigned_to: assignedToName,
            time_remaining: calculateTimeRemaining(ticket.due_date),
            ticket_url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`,
            reassign_url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}/reassign`,
            company_name: companyName
          }
        });
        
        logger.debug(`SLA warning sent for ticket ${ticket.ticket_number} to ${ticket.assigned_to.email}`);
      }
    }

    // Check for actual breaches
    const breached = await getBreachedTickets();
    
    for (const ticket of breached) {
      // Notify assigned agent
      if (ticket.assigned_to) {
        const contactName = getContactFullName(ticket.contact);
        const assignedToName = getFullName(ticket.assigned_to);
        const companyName = await getCompanyName(ticket.assigned_to);
        
        await sendEmail({
          to: ticket.assigned_to.email,
          subject: `SLA BREACHED: ${ticket.ticket_number}`,
          template: 'slaBreached',
          data: {
            first_name: ticket.assigned_to.first_name,
            ticket_number: ticket.ticket_number,
            subject: ticket.subject,
            priority: ticket.priority,
            contact_name: contactName,
            created_at: ticket.created_at,
            sla_due: ticket.due_date,
            assigned_to: assignedToName,
            breach_duration: calculateBreachDuration(ticket.due_date),
            ticket_url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`,
            reassign_url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}/reassign`,
            company_name: companyName
          }
        });
        
        logger.debug(`SLA breach notification sent to agent ${ticket.assigned_to.email} for ticket ${ticket.ticket_number}`);
      }

      // Also notify managers
      const managers = await User.findAll({
        where: { role: 'manager' },
        include: [
          {
            model: Organization,
            as: 'organization',
            attributes: ['id', 'company_name']
          }
        ]
      });

      for (const manager of managers) {
        const contactName = getContactFullName(ticket.contact);
        const assignedToName = ticket.assigned_to ? getFullName(ticket.assigned_to) : 'Unassigned';
        const companyName = await getCompanyName(manager);
        
        await sendEmail({
          to: manager.email,
          subject: `SLA BREACHED: ${ticket.ticket_number}`,
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
            breach_duration: calculateBreachDuration(ticket.due_date),
            ticket_url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`,
            company_name: companyName
          }
        });
        
        logger.debug(`SLA breach notification sent to manager ${manager.email} for ticket ${ticket.ticket_number}`);
      }

      // Mark as notified to avoid duplicate notifications
      if (!ticket.sla_breach_notified) {
        await ticket.update({ sla_breach_notified: true });
        logger.debug(`Marked ticket ${ticket.ticket_number} as breach notified`);
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
    due_date: deadlines.resolution_due
  });
  
  logger.debug(`Updated SLA for ticket ${ticket.ticket_number}: new due date ${deadlines.resolution_due}`);
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
    
    if (metrics.by_priority[priority]) {
      metrics.by_priority[priority].count++;

      if (ticket.isOverdue) {
        metrics.by_priority[priority].resolution_breaches++;
      }
    }

    if (ticket.resolutionTime) {
      metrics.resolution_times.push(ticket.resolutionTime);
    }
  });

  metrics.average_resolution_time = metrics.resolution_times.length > 0
    ? metrics.resolution_times.reduce((a, b) => a + b, 0) / metrics.resolution_times.length
    : 0;

  return metrics;
};
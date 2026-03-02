import { Op, fn, col, literal } from 'sequelize';
import { Contact, Deal, Activity, Ticket, User, sequelize } from '../models';
import { 
  DEAL_STAGES, DEAL_STATUS, TICKET_STATUS, 
  TIME, ACTIVITY_STATUS 
} from '../config/constants';

/**
 * Dashboard summary interface
 */
export interface DashboardSummary {
  total_contacts: number;
  new_contacts_today: number;
  open_deals: number;
  total_pipeline_value: number;
  weighted_pipeline_value: number;
  deals_won_this_month: number;
  deals_lost_this_month: number;
  win_rate: number;
  new_tickets: number;
  open_tickets: number;
  overdue_tickets: number;
  tickets_resolved_today: number;
}

/**
 * Sales chart data interface
 */
export interface SalesChartData {
  labels: string[];
  won_deals: number[];
  lost_deals: number[];
}

/**
 * Pipeline chart data interface
 */
export interface PipelineChartData {
  stages: Array<{
    name: string;
    count: number;
    value: number;
    weighted_value: number;
    color: string;
  }>;
  total_value: number;
  weighted_value: number;
}

/**
 * Ticket chart data interface
 */
export interface TicketChartData {
  days: number;
  data: Array<{
    date: string;
    new: number;
    resolved: number;
  }>;
  totals: {
    new: number;
    resolved: number;
    open: number;
  };
}

/**
 * Get dashboard summary
 */
export const getDashboardSummary = async (
  userId?: number,
  userRole?: string
): Promise<DashboardSummary> => {
  // Build where clauses based on role
  let contactWhere: any = {};
  let dealWhere: any = {};
  let ticketWhere: any = {};

  if (userId && userRole === 'agent') {
    contactWhere.user_id = userId;
    dealWhere.user_id = userId;
    ticketWhere = {
      [Op.or]: [
        { user_id: userId },
        { assigned_to: userId }
      ]
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalContacts,
    newContactsToday,
    openDeals,
    totalPipelineValue,
    weightedPipelineValue,
    dealsWonThisMonth,
    dealsLostThisMonth,
    newTickets,
    openTickets,
    overdueTickets,
    ticketsResolvedToday
  ] = await Promise.all([
    Contact.count({ where: contactWhere }),
    Contact.count({
      where: {
        ...contactWhere,
        created_at: { [Op.gte]: today }
      }
    }),
    Deal.count({
      where: {
        ...dealWhere,
        status: DEAL_STATUS.OPEN
      }
    }),
    Deal.sum('amount', {
      where: {
        ...dealWhere,
        status: DEAL_STATUS.OPEN
      }
    }),
    Deal.findAll({
      where: {
        ...dealWhere,
        status: DEAL_STATUS.OPEN
      },
      attributes: ['amount', 'probability']
    }).then(deals => 
      deals.reduce((sum, deal) => sum + (deal.amount * deal.probability / 100), 0)
    ),
    Deal.count({
      where: {
        ...dealWhere,
        stage: DEAL_STAGES.WON,
        actual_close_date: { [Op.gte]: firstDayOfMonth }
      }
    }),
    Deal.count({
      where: {
        ...dealWhere,
        stage: DEAL_STAGES.LOST,
        actual_close_date: { [Op.gte]: firstDayOfMonth }
      }
    }),
    Ticket.count({
      where: {
        ...ticketWhere,
        status: TICKET_STATUS.NEW
      }
    }),
    Ticket.count({
      where: {
        ...ticketWhere,
        status: { [Op.in]: [TICKET_STATUS.NEW, TICKET_STATUS.OPEN, TICKET_STATUS.PENDING] }
      }
    }),
    Ticket.count({
      where: {
        ...ticketWhere,
        status: { [Op.in]: [TICKET_STATUS.NEW, TICKET_STATUS.OPEN, TICKET_STATUS.PENDING] },
        due_date: { [Op.lt]: new Date() }
      }
    }),
    Ticket.count({
      where: {
        ...ticketWhere,
        status: TICKET_STATUS.RESOLVED,
        resolved_at: { [Op.gte]: today }
      }
    })
  ]);

  const winRate = dealsWonThisMonth + dealsLostThisMonth > 0
    ? (dealsWonThisMonth / (dealsWonThisMonth + dealsLostThisMonth)) * 100
    : 0;

  return {
    total_contacts: totalContacts || 0,
    new_contacts_today: newContactsToday || 0,
    open_deals: openDeals || 0,
    total_pipeline_value: totalPipelineValue || 0,
    weighted_pipeline_value: weightedPipelineValue || 0,
    deals_won_this_month: dealsWonThisMonth || 0,
    deals_lost_this_month: dealsLostThisMonth || 0,
    win_rate: winRate,
    new_tickets: newTickets || 0,
    open_tickets: openTickets || 0,
    overdue_tickets: overdueTickets || 0,
    tickets_resolved_today: ticketsResolvedToday || 0
  };
};

/**
 * Get sales chart data
 */
export const getSalesChartData = async (
  whereClause: any = {},
  period: string = 'month',
  year: number = new Date().getFullYear()
): Promise<SalesChartData> => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const wonDeals = [];
  const lostDeals = [];

  for (let i = 0; i < 12; i++) {
    const startDate = new Date(year, i, 1);
    const endDate = new Date(year, i + 1, 0);

    const won = await Deal.sum('amount', {
      where: {
        ...whereClause,
        stage: DEAL_STAGES.WON,
        actual_close_date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    const lost = await Deal.sum('amount', {
      where: {
        ...whereClause,
        stage: DEAL_STAGES.LOST,
        actual_close_date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    wonDeals.push(won || 0);
    lostDeals.push(lost || 0);
  }

  return {
    labels: months,
    won_deals: wonDeals,
    lost_deals: lostDeals
  };
};

/**
 * Get pipeline chart data
 */
export const getPipelineChartData = async (
  whereClause: any = {}
): Promise<PipelineChartData> => {
  const stages = [
    { name: 'Lead', field: DEAL_STAGES.LEAD, color: '#3B82F6' },
    { name: 'Qualified', field: DEAL_STAGES.QUALIFIED, color: '#8B5CF6' },
    { name: 'Proposal', field: DEAL_STAGES.PROPOSAL, color: '#F59E0B' },
    { name: 'Negotiation', field: DEAL_STAGES.NEGOTIATION, color: '#EF4444' }
  ];

  const stageData = [];

  for (const stage of stages) {
    const deals = await Deal.findAll({
      where: {
        ...whereClause,
        stage: stage.field
      },
      attributes: ['amount', 'probability']
    });

    const totalValue = deals.reduce((sum, deal) => sum + deal.amount, 0);
    const weightedValue = deals.reduce((sum, deal) => sum + (deal.amount * deal.probability / 100), 0);

    stageData.push({
      name: stage.name,
      count: deals.length,
      value: totalValue,
      weighted_value: weightedValue,
      color: stage.color
    });
  }

  const totalValue = stageData.reduce((sum, stage) => sum + stage.value, 0);
  const weightedValue = stageData.reduce((sum, stage) => sum + stage.weighted_value, 0);

  return {
    stages: stageData,
    total_value: totalValue,
    weighted_value: weightedValue
  };
};

/**
 * Get ticket chart data
 */
export const getTicketChartData = async (
  whereClause: any = {},
  days: number = 7
): Promise<TicketChartData> => {
  const data = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const newTickets = await Ticket.count({
      where: {
        ...whereClause,
        created_at: {
          [Op.between]: [date, nextDate]
        }
      }
    });

    const resolvedTickets = await Ticket.count({
      where: {
        ...whereClause,
        status: TICKET_STATUS.RESOLVED,
        resolved_at: {
          [Op.between]: [date, nextDate]
        }
      }
    });

    data.push({
      date: date.toISOString().split('T')[0],
      new: newTickets,
      resolved: resolvedTickets
    });
  }

  const totals = {
    new: data.reduce((sum, d) => sum + d.new, 0),
    resolved: data.reduce((sum, d) => sum + d.resolved, 0),
    open: await Ticket.count({
      where: {
        ...whereClause,
        status: {
          [Op.in]: [TICKET_STATUS.NEW, TICKET_STATUS.OPEN, TICKET_STATUS.PENDING]
        }
      }
    })
  };

  return {
    days,
    data,
    totals
  };
};

/**
 * Get recent activities
 */
export const getRecentActivities = async (
  userId?: number,
  limit: number = 10
): Promise<any[]> => {
  let whereClause: any = {};

  if (userId) {
    whereClause.user_id = userId;
  }

  const activities = await Activity.findAll({
    where: whereClause,
    limit,
    order: [['created_at', 'DESC']],
    include: [
      {
        model: Contact,
        as: 'contact',
        attributes: ['id', 'first_name', 'last_name', 'company']
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name']
      },
      {
        model: Deal,
        as: 'deal',
        attributes: ['id', 'name']
      }
    ]
  });

  return activities;
};

/**
 * Get task list (upcoming activities)
 */

export const getTaskList = async (
  userId?: number,
  limit: number = 5
): Promise<any[]> => {
  let whereClause: any = {
    status: ACTIVITY_STATUS.SCHEDULED,
    scheduled_date: {
      [Op.gte]: new Date()
    }
  };

  if (userId) {
    whereClause.user_id = userId;
  }

  const tasks = await Activity.findAll({
    where: whereClause,
    limit,
    order: [['scheduled_date', 'ASC']],
    include: [
      {
        model: Contact,
        as: 'contact',
        attributes: ['first_name', 'last_name']
      }
    ]
  });

  return tasks.map(task => ({
    id: task.id,
    type: task.type,
    description: task.subject,
    due_date: task.scheduled_date,
    priority: getTaskPriority(task),
    contact: task.contact ? `${task.contact.first_name} ${task.contact.last_name}` : null
  }));
};

/**
 * Get task priority based on due date
 */
const getTaskPriority = (task: Activity): string => {
  const now = new Date();
  const dueDate = new Date(task.scheduled_date);
  const hoursDiff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursDiff < 24) return 'high';
  if (hoursDiff < 72) return 'medium';
  return 'low';
};

/**
 * Get top performers
 */
export const getTopPerformers = async (limit: number = 5): Promise<any[]> => {
  const users = await User.findAll({
    where: { role: 'agent' },
    attributes: ['id', 'first_name', 'last_name']
  });

  const performers = await Promise.all(
    users.map(async (user) => {
      const dealsWon = await Deal.count({
        where: {
          user_id: user.id,
          stage: DEAL_STAGES.WON
        }
      });

      const dealsValue = await Deal.sum('amount', {
        where: {
          user_id: user.id,
          stage: DEAL_STAGES.WON
        }
      });

      const ticketsResolved = await Ticket.count({
        where: {
          assigned_to: user.id,
          status: TICKET_STATUS.RESOLVED
        }
      });

      return {
        user_id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        deals_won: dealsWon || 0,
        deals_value: dealsValue || 0,
        tickets_resolved: ticketsResolved || 0
      };
    })
  );

  return performers
    .sort((a, b) => b.deals_value - a.deals_value)
    .slice(0, limit);
};

/**
 * Get activity summary
 */
export const getActivitySummary = async (userId?: number): Promise<any> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let whereClause: any = {};

  if (userId) {
    whereClause.user_id = userId;
  }

  const [todayCount, upcomingCount, overdueCount] = await Promise.all([
    Activity.count({
      where: {
        ...whereClause,
        scheduled_date: {
          [Op.between]: [today, tomorrow]
        }
      }
    }),
    Activity.count({
      where: {
        ...whereClause,
        status: ACTIVITY_STATUS.SCHEDULED,
        scheduled_date: {
          [Op.gt]: tomorrow
        }
      }
    }),
    Activity.count({
      where: {
        ...whereClause,
        status: ACTIVITY_STATUS.SCHEDULED,
        scheduled_date: {
          [Op.lt]: new Date()
        }
      }
    })
  ]);

  return {
    today: todayCount,
    upcoming: upcomingCount,
    overdue: overdueCount
  };
};
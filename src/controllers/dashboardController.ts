import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Contact, Deal, Activity, Ticket, User } from '../models';
import {
  HTTP_STATUS, DEAL_STAGES, DEAL_STATUS, TICKET_STATUS
} from '../config/constants';
import catchAsync from '../utils/catchAsync';

// @desc    Get dashboard data
// @route   GET /api/dashboard
// @access  Private
export const getDashboard = catchAsync(async (req: Request, res: Response) => {
  const { user_id } = req.query;

  // Build where clauses based on role
  let contactWhere: any = {};
  let dealWhere: any = {};
  let ticketWhere: any = {};
  let activityWhere: any = {};

  if (user_id && (req.user.role === 'admin' || req.user.role === 'manager')) {
    contactWhere.user_id = user_id;
    dealWhere.user_id = user_id;
    activityWhere.user_id = user_id;
    ticketWhere = {
      [Op.or]: [
        { user_id },
        { assigned_to: user_id }
      ]
    };
  } else if (req.user.role === 'agent') {
    contactWhere.user_id = req.user.id;
    dealWhere.user_id = req.user.id;
    activityWhere.user_id = req.user.id;
    ticketWhere = {
      [Op.or]: [
        { user_id: req.user.id },
        { assigned_to: req.user.id }
      ]
    };
  }

  // Get summary statistics
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
        created_at: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
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
        actual_close_date: {
          [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    }),
    Deal.count({
      where: {
        ...dealWhere,
        stage: DEAL_STAGES.LOST,
        actual_close_date: {
          [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
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
        status: {
          [Op.in]: [TICKET_STATUS.NEW, TICKET_STATUS.OPEN, TICKET_STATUS.PENDING]
        }
      }
    }),
    Ticket.count({
      where: {
        ...ticketWhere,
        status: {
          [Op.in]: [TICKET_STATUS.NEW, TICKET_STATUS.OPEN, TICKET_STATUS.PENDING]
        },
        due_date: {
          [Op.lt]: new Date()
        }
      }
    }),
    Ticket.count({
      where: {
        ...ticketWhere,
        status: TICKET_STATUS.RESOLVED,
        resolved_at: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })
  ]);

  // Get sales chart data (last 12 months)
  const salesChart = await getSalesChartData(dealWhere);

  // Get pipeline value chart
  const pipelineValueChart = await getPipelineChartData(dealWhere);

  // Get ticket volume chart (last 7 days)
  const ticketVolumeChart = await getTicketChartData(ticketWhere);

  // Get recent activities
  const recentActivities = await Activity.findAll({
    where: activityWhere,
    limit: 10,
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
      }
    ]
  });

  // Get task list (upcoming activities)
  const taskList = await Activity.findAll({
    where: {
      ...activityWhere,
      status: 'scheduled',
      scheduled_date: {
        [Op.gte]: new Date()
      }
    },
    limit: 5,
    order: [['scheduled_date', 'ASC']],
    include: [
      {
        model: Contact,
        as: 'contact',
        attributes: ['first_name', 'last_name']
      }
    ]
  }) as (Activity & {
    contact: Contact
  })[];

  // Get top performers (admin/manager only)
  let topPerformers: any[] = [];
  if (req.user.role === 'admin' || req.user.role === 'manager') {
    topPerformers = await getTopPerformers();
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      summary: {
        total_contacts: totalContacts || 0,
        new_contacts_today: newContactsToday || 0,
        open_deals: openDeals || 0,
        total_pipeline_value: totalPipelineValue || 0,
        weighted_pipeline_value: weightedPipelineValue || 0,
        deals_won_this_month: dealsWonThisMonth || 0,
        deals_lost_this_month: dealsLostThisMonth || 0,
        win_rate: dealsWonThisMonth + dealsLostThisMonth > 0
          ? (dealsWonThisMonth / (dealsWonThisMonth + dealsLostThisMonth)) * 100
          : 0,
        new_tickets: newTickets || 0,
        open_tickets: openTickets || 0,
        overdue_tickets: overdueTickets || 0,
        tickets_resolved_today: ticketsResolvedToday || 0
      },
      sales_chart: salesChart,
      pipeline_value_chart: pipelineValueChart,
      ticket_volume_chart: ticketVolumeChart,
      recent_activities: recentActivities,
      task_list: taskList.map(task => ({
        id: task.id,
        type: task.type,
        description: task.subject,
        due_date: task.scheduled_date,
        priority: task.type === 'call' ? 'high' : 'medium',
        contact: task.contact ? `${task.contact.first_name} ${task.contact.last_name}` : null
      })),
      top_performers: topPerformers
    }
  });
});

// @desc    Get sales chart data
// @route   GET /api/dashboard/sales-chart
// @access  Private
export const getSalesChart = catchAsync(async (req: Request, res: Response) => {
  const { period = 'month', year = new Date().getFullYear() } = req.query;

  let dealWhere: any = {};

  if (req.user.role === 'agent') {
    dealWhere.user_id = req.user.id;
  }

  const data = await getSalesChartData(dealWhere, period as string, parseInt(year as string));

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data
  });
});

// @desc    Get pipeline chart data
// @route   GET /api/dashboard/pipeline-chart
// @access  Private
export const getPipelineChart = catchAsync(async (req: Request, res: Response) => {
  let dealWhere: any = { status: DEAL_STATUS.OPEN };

  if (req.user.role === 'agent') {
    dealWhere.user_id = req.user.id;
  }

  const data = await getPipelineChartData(dealWhere);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data
  });
});

// @desc    Get ticket chart data
// @route   GET /api/dashboard/ticket-chart
// @access  Private
export const getTicketChart = catchAsync(async (req: Request, res: Response) => {
  const { days = 7 } = req.query;

  let ticketWhere: any = {};

  if (req.user.role === 'agent') {
    ticketWhere = {
      [Op.or]: [
        { user_id: req.user.id },
        { assigned_to: req.user.id }
      ]
    };
  }

  const data = await getTicketChartData(ticketWhere, parseInt(days as string));

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data
  });
});

// Helper functions
async function getSalesChartData(whereClause: any, _period: string = 'month', year: number = new Date().getFullYear()) {
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
}

async function getPipelineChartData(whereClause: any) {
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
}

async function getTicketChartData(whereClause: any, days: number = 7) {
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
}

async function getTopPerformers() {
  const users = await User.findAll({
    where: { role: 'agent' },
    attributes: ['id', 'first_name', 'last_name'],
    include: [
      {
        model: Deal,
        as: 'ownedDeals',
        where: { stage: DEAL_STAGES.WON },
        required: false,
        attributes: []
      },
      {
        model: Ticket,
        as: 'assignedTickets',
        where: { status: TICKET_STATUS.RESOLVED },
        required: false,
        attributes: []
      }
    ]
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

  return performers.sort((a, b) => b.deals_value - a.deals_value).slice(0, 5);
}
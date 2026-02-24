import cron from 'node-cron';
import { Op } from 'sequelize';
import { User, Activity, Ticket, Deal, Contact } from '../models';
import { ACTIVITY_STATUS, TICKET_STATUS, DEAL_STAGES, TIME } from '../config/constants';
import { sendEmail } from '../services/emailService';
import logger from '../config/logger';
import { 
  startOfWeek, endOfWeek, startOfDay, endOfDay,
  formatDate, diffInDays 
} from '../utils/helpers/dateHelpers';

/**
 * Schedule weekly summary job
 */
export const scheduleWeeklySummary = (): void => {
  // Run every Monday at 9 AM
  cron.schedule('0 9 * * 1', async () => {
    logger.info('Running weekly summary job...');
    
    try {
      await sendWeeklySummaries();
    } catch (error) {
      logger.error('Error in weekly summary job:', error);
    }
  });

  logger.info('Weekly summary scheduled for Monday at 9 AM');
};

/**
 * Send weekly summaries to all users
 */
const sendWeeklySummaries = async (): Promise<void> => {
  const users = await User.findAll({
    where: {
      settings: {
        notifications: true
      }
    }
  });

  logger.info(`Sending weekly summaries to ${users.length} users`);

  for (const user of users) {
    try {
      const summary = await generateUserSummary(user.id);
      await sendSummaryEmail(user, summary);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      logger.error(`Failed to send summary to user ${user.id}:`, error);
    }
  }
};

/**
 * Generate summary for a specific user
 */
const generateUserSummary = async (userId: number): Promise<any> => {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(weekEnd);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

  // Get current week stats
  const [
    newContacts,
    activitiesCompleted,
    dealsWon,
    dealsLost,
    ticketsResolved,
    pipelineStages
  ] = await Promise.all([
    Contact.count({
      where: {
        user_id: userId,
        created_at: {
          [Op.between]: [weekStart, weekEnd]
        }
      }
    }),
    Activity.count({
      where: {
        user_id: userId,
        status: ACTIVITY_STATUS.COMPLETED,
        completed_date: {
          [Op.between]: [weekStart, weekEnd]
        }
      }
    }),
    Deal.count({
      where: {
        user_id: userId,
        stage: DEAL_STAGES.WON,
        actual_close_date: {
          [Op.between]: [weekStart, weekEnd]
        }
      }
    }),
    Deal.count({
      where: {
        user_id: userId,
        stage: DEAL_STAGES.LOST,
        actual_close_date: {
          [Op.between]: [weekStart, weekEnd]
        }
      }
    }),
    Ticket.count({
      where: {
        [Op.or]: [
          { user_id: userId },
          { assigned_to: userId }
        ],
        status: TICKET_STATUS.RESOLVED,
        resolved_at: {
          [Op.between]: [weekStart, weekEnd]
        }
      }
    }),
    Deal.findAll({
      where: {
        user_id: userId,
        status: 'open'
      },
      attributes: ['stage', 'amount', 'probability']
    })
  ]);

  // Get last week stats for comparison
  const [
    lastWeekContacts,
    lastWeekDealsWon,
    lastWeekDealsValue
  ] = await Promise.all([
    Contact.count({
      where: {
        user_id: userId,
        created_at: {
          [Op.between]: [lastWeekStart, lastWeekEnd]
        }
      }
    }),
    Deal.count({
      where: {
        user_id: userId,
        stage: DEAL_STAGES.WON,
        actual_close_date: {
          [Op.between]: [lastWeekStart, lastWeekEnd]
        }
      }
    }),
    Deal.sum('amount', {
      where: {
        user_id: userId,
        stage: DEAL_STAGES.WON,
        actual_close_date: {
          [Op.between]: [lastWeekStart, lastWeekEnd]
        }
      }
    })
  ]);

  // Calculate pipeline stages
  const stageMap = new Map();
  let totalPipeline = 0;
  let weightedPipeline = 0;

  pipelineStages.forEach(deal => {
    const stage = deal.stage;
    const current = stageMap.get(stage) || { count: 0, value: 0 };
    stageMap.set(stage, {
      count: current.count + 1,
      value: current.value + deal.amount
    });
    totalPipeline += deal.amount;
    weightedPipeline += deal.amount * (deal.probability / 100);
  });

  const pipelineStagesData = Array.from(stageMap.entries()).map(([stage, data]) => ({
    name: stage,
    count: data.count,
    value: data.value,
    percentage: totalPipeline > 0 ? (data.value / totalPipeline) * 100 : 0,
    color: getStageColor(stage)
  }));

  // Calculate changes
  const contactChange = lastWeekContacts > 0 
    ? ((newContacts - lastWeekContacts) / lastWeekContacts) * 100 
    : newContacts > 0 ? 100 : 0;

  const valueChange = lastWeekDealsValue > 0
    ? ((dealsWon - lastWeekDealsWon) / lastWeekDealsWon) * 100
    : dealsWon > 0 ? 100 : 0;

  // Get upcoming tasks for next week
  const nextWeekStart = new Date(weekEnd);
  nextWeekStart.setDate(nextWeekStart.getDate() + 1);
  const nextWeekEnd = new Date(nextWeekStart);
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);

  const upcomingTasks = await Activity.findAll({
    where: {
      user_id: userId,
      status: ACTIVITY_STATUS.SCHEDULED,
      scheduled_date: {
        [Op.between]: [nextWeekStart, nextWeekEnd]
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
  });

  return {
    start_date: formatDate(weekStart, 'MMM DD'),
    end_date: formatDate(weekEnd, 'MMM DD'),
    new_contacts: newContacts,
    contact_change: Math.round(contactChange),
    activities_completed: activitiesCompleted,
    deals_won: dealsWon,
    deals_lost: dealsLost,
    deals_value: dealsWon > 0 ? await getDealsValue(userId, weekStart, weekEnd) : 0,
    value_change: Math.round(valueChange),
    loss_rate: dealsWon + dealsLost > 0 
      ? Math.round((dealsLost / (dealsWon + dealsLost)) * 100)
      : 0,
    tickets_resolved: ticketsResolved,
    open_tickets: await getOpenTickets(userId),
    overdue_tickets: await getOverdueTickets(userId),
    pipeline_stages: pipelineStagesData,
    total_pipeline: totalPipeline,
    weighted_pipeline: weightedPipeline,
    upcoming_tasks: upcomingTasks.map(task => ({
      title: task.subject,
      due_date: formatDate(task.scheduled_date, 'MMM DD'),
      priority: getTaskPriority(task),
      contact: task.contact ? `${task.contact.first_name} ${task.contact.last_name}` : null
    })),
    dashboard_url: `${process.env.FRONTEND_URL}/dashboard`,
    reports_url: `${process.env.FRONTEND_URL}/reports`
  };
};

/**
 * Send summary email to user
 */
const sendSummaryEmail = async (user: User, summary: any): Promise<void> => {
  await sendEmail({
    to: user.email,
    subject: `Your Weekly Summary - ${summary.start_date} to ${summary.end_date}`,
    template: 'weeklySummary',
    data: {
      first_name: user.first_name,
      company_name: process.env.COMPANY_NAME || 'DERA CRM',
      ...summary
    }
  });

  logger.debug(`Weekly summary sent to ${user.email}`);
};

/**
 * Get total value of won deals in period
 */
const getDealsValue = async (userId: number, startDate: Date, endDate: Date): Promise<number> => {
  const result = await Deal.sum('amount', {
    where: {
      user_id: userId,
      stage: DEAL_STAGES.WON,
      actual_close_date: {
        [Op.between]: [startDate, endDate]
      }
    }
  });
  return result || 0;
};

/**
 * Get count of open tickets
 */
const getOpenTickets = async (userId: number): Promise<number> => {
  return Ticket.count({
    where: {
      [Op.or]: [
        { user_id: userId },
        { assigned_to: userId }
      ],
      status: {
        [Op.in]: [TICKET_STATUS.NEW, TICKET_STATUS.OPEN, TICKET_STATUS.PENDING]
      }
    }
  });
};

/**
 * Get count of overdue tickets
 */
const getOverdueTickets = async (userId: number): Promise<number> => {
  return Ticket.count({
    where: {
      [Op.or]: [
        { user_id: userId },
        { assigned_to: userId }
      ],
      status: {
        [Op.in]: [TICKET_STATUS.NEW, TICKET_STATUS.OPEN, TICKET_STATUS.PENDING]
      },
      due_date: {
        [Op.lt]: new Date()
      }
    }
  });
};

/**
 * Get stage color
 */
const getStageColor = (stage: string): string => {
  const colors: Record<string, string> = {
    lead: '#3B82F6',
    qualified: '#8B5CF6',
    proposal: '#F59E0B',
    negotiation: '#EF4444',
    won: '#10B981',
    lost: '#6B7280'
  };
  return colors[stage] || '#6B7280';
};

/**
 * Get task priority
 */
const getTaskPriority = (task: Activity): string => {
  const now = new Date();
  const dueDate = new Date(task.scheduled_date);
  const daysDiff = diffInDays(dueDate, now);

  if (daysDiff <= 2) return 'high';
  if (daysDiff <= 5) return 'medium';
  return 'low';
};

/**
 * Send summary on demand (for testing)
 */
export const sendSummaryNow = async (userId?: number): Promise<void> => {
  if (userId) {
    const user = await User.findByPk(userId);
    if (user) {
      const summary = await generateUserSummary(userId);
      await sendSummaryEmail(user, summary);
      logger.info(`Manual summary sent to user ${userId}`);
    }
  } else {
    await sendWeeklySummaries();
  }
};

export default {
  scheduleWeeklySummary,
  sendWeeklySummaries,
  sendSummaryNow
};
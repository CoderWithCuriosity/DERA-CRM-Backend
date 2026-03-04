import cron from 'node-cron';
import { Op } from 'sequelize';
import { User, Activity, Ticket, Deal, Contact } from '../models';
import { ACTIVITY_STATUS, TICKET_STATUS, DEAL_STAGES, TIME } from '../config/constants';
import { sendEmail } from '../services/emailService';
import logger from '../config/logger';
import { startOfDay, endOfDay, formatDate } from '../utils/helpers/dateHelpers';

/**
 * Schedule daily digest job
 */
export const scheduleDailyDigest = (): void => {
  // Run daily at 8 AM
  cron.schedule('0 8 * * *', async () => {
    logger.info('Running daily digest job...');

    try {
      await sendDailyDigests();
    } catch (error) {
      logger.error('Error in daily digest job:', error);
    }
  });

  logger.info('Daily digest scheduled for 8 AM daily');
};

/**
 * Send daily digests to all users
 */
const sendDailyDigests = async (): Promise<void> => {
  const users = await User.findAll({
    where: {
      settings: {
        notifications: true
      }
    }
  });

  logger.info(`Sending daily digests to ${users.length} users`);

  for (const user of users) {
    try {
      const digest = await generateUserDigest(user.id);
      await sendDigestEmail(user, digest);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      logger.error(`Failed to send digest to user ${user.id}:`, error);
    }
  }
};

/**
 * Generate digest for a specific user
 */
const generateUserDigest = async (userId: number): Promise<any> => {
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  const tomorrowStart = new Date(today);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);

  // Get today's tasks
  const todaysTasks = await Activity.findAll({
    where: {
      user_id: userId,
      scheduled_date: {
        [Op.between]: [todayStart, todayEnd]
      }
    },
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

  // Get meetings today
  const todaysMeetings = todaysTasks.filter(t => t.type === 'meeting');

  // Get new leads from yesterday
  const yesterdayStart = new Date(today);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  yesterdayStart.setHours(0, 0, 0, 0);

  const yesterdayEnd = new Date(yesterdayStart);
  yesterdayEnd.setHours(23, 59, 59, 999);

  const newLeads = await Contact.count({
    where: {
      user_id: userId,
      status: 'lead',
      created_at: {
        [Op.between]: [yesterdayStart, yesterdayEnd]
      }
    }
  });

  // Get open tickets
  const openTickets = await Ticket.count({
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

  // Get deals at risk (stalled or overdue)
  const atRiskDeals = await Deal.findAll({
    where: {
      user_id: userId,
      status: 'open',
      stage: {
        [Op.notIn]: [DEAL_STAGES.WON, DEAL_STAGES.LOST]
      },
      expected_close_date: {
        [Op.lt]: new Date(Date.now() + 7 * TIME.DAY) // Next 7 days
      }
    },
    limit: 5,
    order: [['expected_close_date', 'ASC']]
  });

  // Get urgent tickets (high priority or overdue)
  const urgentTickets = await Ticket.findAll({
    where: {
      [Op.and]: [
        // User filter
        {
          [Op.or]: [
            { user_id: userId },
            { assigned_to: userId }
          ]
        },
        // Status filter
        {
          status: {
            [Op.in]: [TICKET_STATUS.NEW, TICKET_STATUS.OPEN, TICKET_STATUS.PENDING]
          }
        },
        // Urgent criteria - combined OR
        {
          [Op.or]: [
            { priority: { [Op.in]: ['high', 'urgent'] } },
            {
              due_date: {
                [Op.lt]: new Date(Date.now() + 24 * TIME.HOUR)
              }
            }
          ]
        }
      ]
    },
    include: [
    {
      model: Contact,
      as: 'contact',
      attributes: ['fullName', 'first_name', 'last_name', 'email']
    }
  ],
    limit: 5,
    order: [
      ['priority', 'DESC'],
      ['due_date', 'ASC']
    ]
  }) as (Ticket & {
    contact: Contact
  })[];

  // Format tasks for display
  const formattedTasks = todaysTasks.map(task => ({
    time: formatDate(task.scheduled_date, 'HH:mm'),
    title: task.subject,
    type: task.type,
    contact: task.contact ? `${task.contact.first_name} ${task.contact.last_name}` : null,
    priority: getTaskPriority(task)
  }));

  // Format meetings
  const formattedMeetings = todaysMeetings.map(meeting => ({
    time: formatDate(meeting.scheduled_date, 'HH:mm'),
    title: meeting.subject,
    contact: meeting.contact ? `${meeting.contact.first_name} ${meeting.contact.last_name}` : null,
    duration: meeting.duration || 30
  }));

  // Format at risk deals
  const formattedDeals = atRiskDeals.map(deal => ({
    name: deal.name,
    amount: deal.amount,
    stage: deal.stage,
    probability: deal.probability,
    expected_close: formatDate(deal.expected_close_date!, 'MMM DD, YYYY')
  }));

  // Format urgent tickets
  const formattedTickets = urgentTickets.map(ticket => ({
    number: ticket.ticket_number,
    subject: ticket.subject,
    customer: ticket.contact?.fullName || 'Unknown',
    priority: ticket.priority,
    due_time: ticket.due_date ? formatDate(ticket.due_date, 'HH:mm') : 'No due date'
  }));

  return {
    tasks_today: formattedTasks.length,
    meetings_today: formattedMeetings.length,
    new_leads: newLeads,
    open_tickets: openTickets,
    todays_tasks: formattedTasks.slice(0, 5), // Top 5 tasks
    todays_meetings: formattedMeetings,
    at_risk_deals: formattedDeals,
    urgent_tickets: formattedTickets,
    dashboard_url: `${process.env.FRONTEND_URL}/dashboard`,
    calendar_url: `${process.env.FRONTEND_URL}/calendar`,
    settings_url: `${process.env.FRONTEND_URL}/settings/notifications`
  };
};

/**
 * Send digest email to user
 */
const sendDigestEmail = async (user: User, digest: any): Promise<void> => {
  await sendEmail({
    to: user.email,
    subject: `Your Daily Digest - ${formatDate(new Date(), 'MMMM DD, YYYY')}`,
    template: 'dailyDigest',
    data: {
      first_name: user.first_name,
      current_date: formatDate(new Date(), 'dddd, MMMM DD, YYYY'),
      ...digest
    }
  });

  logger.debug(`Daily digest sent to ${user.email}`);
};

/**
 * Get task priority based on due date
 */
const getTaskPriority = (task: Activity): string => {
  const now = new Date();
  const dueDate = new Date(task.scheduled_date);
  const hoursDiff = (dueDate.getTime() - now.getTime()) / TIME.HOUR;

  if (hoursDiff < 24) return 'high';
  if (hoursDiff < 72) return 'medium';
  return 'low';
};

/**
 * Send digest on demand (for testing)
 */
export const sendDigestNow = async (userId?: number): Promise<void> => {
  if (userId) {
    const user = await User.findByPk(userId);
    if (user) {
      const digest = await generateUserDigest(userId);
      await sendDigestEmail(user, digest);
      logger.info(`Manual digest sent to user ${userId}`);
    }
  } else {
    await sendDailyDigests();
  }
};

export default {
  scheduleDailyDigest,
  sendDailyDigests,
  sendDigestNow
};
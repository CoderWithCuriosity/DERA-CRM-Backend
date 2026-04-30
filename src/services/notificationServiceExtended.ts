import { Notification, User, UserNotificationPreference, Message, MessageParticipant } from '../models';
import { sendEmail } from './emailService';
import logger from '../config/logger';
import { MESSAGE_PARTICIPANT_STATUS } from '../config/constants';

export interface CreateNotificationData {
  userId: number;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Create a notification for a user
 */
export const createNotification = async (data: CreateNotificationData): Promise<Notification> => {
  const notification = await Notification.create({
    user_id: data.userId,
    type: data.type,
    title: data.title,
    body: data.body,
    data: data.data || {}
  });

  // Check if user wants email notifications for this type
  const preferences = await UserNotificationPreference.findOne({
    where: {
      user_id: data.userId,
      type: data.type
    }
  });

  const user = await User.findByPk(data.userId);
  
  if (preferences?.email_enabled !== false && user?.email) {
    try {
      await sendEmail({
        to: user.email,
        subject: data.title,
        template: 'notification',
        data: {
          first_name: user.first_name,
          title: data.title,
          body: data.body,
          action_url: data.data?.url || `${process.env.FRONTEND_URL}/notifications`
        }
      });
    } catch (error) {
      logger.error('Failed to send notification email:', error);
    }
  }

  return notification;
};

/**
 * Create notifications for multiple users
 */
export const createBulkNotifications = async (
  notifications: CreateNotificationData[]
): Promise<Notification[]> => {
  const results: Notification[] = [];
  
  for (const notif of notifications) {
    const created = await createNotification(notif);
    results.push(created);
  }
  
  return results;
};

/**
 * Get user's notifications
 */
export const getUserNotifications = async (
  userId: number,
  page: number = 1,
  limit: number = 20,
  unreadOnly: boolean = false
): Promise<{ rows: Notification[]; count: number; unreadCount: number }> => {
  const offset = (page - 1) * limit;
  
  const whereClause: any = { user_id: userId };
  if (unreadOnly) {
    whereClause.read_at = null;
  }
  
  const [notifications, unreadCount] = await Promise.all([
    Notification.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    }),
    Notification.count({
      where: {
        user_id: userId,
        read_at: null
      }
    })
  ]);
  
  return {
    rows: notifications.rows,
    count: notifications.count,
    unreadCount
  };
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (userId: number, notificationId: number): Promise<boolean> => {
  const result = await Notification.update(
    { read_at: new Date() },
    {
      where: {
        id: notificationId,
        user_id: userId
      }
    }
  );
  
  return result[0] > 0;
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (userId: number): Promise<number> => {
  const [affectedCount] = await Notification.update(
    { read_at: new Date() },
    {
      where: {
        user_id: userId,
        read_at: null
      }
    }
  );
  
  return affectedCount;
};

/**
 * Delete notification
 */
export const deleteNotification = async (userId: number, notificationId: number): Promise<boolean> => {
  const result = await Notification.destroy({
    where: {
      id: notificationId,
      user_id: userId
    }
  });
  
  return result > 0;
};

/**
 * Get user's notification preferences
 */
export const getUserNotificationPreferences = async (userId: number): Promise<UserNotificationPreference[]> => {
  return UserNotificationPreference.findAll({
    where: { user_id: userId }
  });
};

/**
 * Update user's notification preference
 */
export const updateNotificationPreference = async (
  userId: number,
  type: string,
  emailEnabled: boolean,
  inAppEnabled: boolean
): Promise<UserNotificationPreference> => {
  const [preference, created] = await UserNotificationPreference.findOrCreate({
    where: { user_id: userId, type },
    defaults: {
      user_id: userId,
      type,
      email_enabled: emailEnabled,
      in_app_enabled: inAppEnabled
    }
  });
  
  if (!created) {
    await preference.update({
      email_enabled: emailEnabled,
      in_app_enabled: inAppEnabled
    });
  }
  
  return preference;
};

/**
 * Create message and notify participants
 */
export const createMessageWithNotifications = async (
  subject: string | null,
  body: string,
  sentBy: number,
  participantIds: number[],
  parentId: number | null = null,
  isPrivate: boolean = false
): Promise<Message> => {
  // Create the message
  const message = await Message.create({
    subject,
    body,
    sent_by: sentBy,
    parent_id: parentId,
    is_private: isPrivate
  });
  
  // Create participants
  const participants = participantIds.map(userId => ({
    message_id: message.id,
    user_id: userId,
    can_receive: true,
    status: MESSAGE_PARTICIPANT_STATUS.ACTIVE
  }));
  
  await MessageParticipant.bulkCreate(participants);
  
  // Get sender info
  const sender = await User.findByPk(sentBy);
  const senderName = sender ? `${sender.first_name} ${sender.last_name}` : 'Someone';
  
  // Create notifications for each participant (except sender)
  const notifications: CreateNotificationData[] = [];
  
  for (const userId of participantIds) {
    if (userId === sentBy) continue;
    
    // Check if user wants to receive messages from this sender
    const canReceive = await canUserReceiveMessage(userId, sentBy);
    if (!canReceive) continue;
    
    notifications.push({
      userId,
      type: 'message_received',
      title: subject || 'New Message',
      body: subject 
        ? `${senderName}: ${subject}`
        : `${senderName} sent you a message: ${body.substring(0, 100)}${body.length > 100 ? '...' : ''}`,
      data: {
        message_id: message.id,
        sender_id: sentBy,
        sender_name: senderName,
        subject: subject,
        is_private: isPrivate,
        url: `${process.env.FRONTEND_URL}/messages/${message.id}`
      }
    });
  }
  
  await createBulkNotifications(notifications);
  
  return message;
};

/**
 * Check if a user can receive messages from another user
 */
export const canUserReceiveMessage = async (receiverId: number, _senderId: number): Promise<boolean> => {
  // Check if receiver has blocked sender or set privacy preferences
  const preference = await UserNotificationPreference.findOne({
    where: {
      user_id: receiverId,
      type: 'message_received'
    }
  });
  
  // If no preference, default to true
  if (!preference) return true;
  
  return preference.in_app_enabled;
};

export default {
  createNotification,
  createBulkNotifications,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUserNotificationPreferences,
  updateNotificationPreference,
  createMessageWithNotifications
};
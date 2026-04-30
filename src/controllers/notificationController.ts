import { Request, Response } from 'express';
import { Notification, UserNotificationPreference } from '../models';
import {
  HTTP_STATUS,
  SUCCESS_MESSAGES
} from '../config/constants';
import catchAsync from '../utils/catchAsync';
import { getPagination, getPagingData } from '../utils/pagination';

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, unread_only } = req.query;
  
  const { take, skip } = getPagination(page as string, limit as string);
  
  let whereClause: any = { user_id: req.user.id };
  
  if (unread_only === 'true') {
    whereClause.read_at = null;
  }
  
  const [notifications, unreadCount] = await Promise.all([
    Notification.findAndCountAll({
      where: whereClause,
      limit: take,
      offset: skip,
      order: [['created_at', 'DESC']]
    }),
    Notification.count({
      where: {
        user_id: req.user.id,
        read_at: null
      }
    })
  ]);
  
  const response = getPagingData(notifications, page as string, limit as string);
  
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      ...response,
      unread_count: unreadCount
    }
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const notification = await Notification.findOne({
    where: {
      id,
      user_id: req.user.id
    }
  });
  
  if (!notification) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Notification not found'
    });
  }
  
  await notification.update({ read_at: new Date() });
  
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.UPDATED('Notification')
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
  await Notification.update(
    { read_at: new Date() },
    {
      where: {
        user_id: req.user.id,
        read_at: null
      }
    }
  );
  
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const result = await Notification.destroy({
    where: {
      id,
      user_id: req.user.id
    }
  });
  
  if (result === 0) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Notification not found'
    });
  }
  
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.DELETED('Notification')
  });
});

// @desc    Get notification preferences
// @route   GET /api/notifications/preferences
// @access  Private
export const getPreferences = catchAsync(async (req: Request, res: Response) => {
  const preferences = await UserNotificationPreference.findAll({
    where: { user_id: req.user.id }
  });
  
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { preferences }
  });
});

// @desc    Update notification preferences
// @route   PUT /api/notifications/preferences
// @access  Private
export const updatePreferences = catchAsync(async (req: Request, res: Response) => {
  const { preferences } = req.body;
  
  for (const pref of preferences) {
    const [existing] = await UserNotificationPreference.findOrCreate({
      where: {
        user_id: req.user.id,
        type: pref.type
      },
      defaults: {
        user_id: req.user.id,
        type: pref.type,
        email_enabled: pref.email_enabled !== false,
        in_app_enabled: pref.in_app_enabled !== false
      }
    });
    
    if (existing) {
      await existing.update({
        email_enabled: pref.email_enabled,
        in_app_enabled: pref.in_app_enabled
      });
    }
  }
  
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.UPDATED('Notification preferences')
  });
});
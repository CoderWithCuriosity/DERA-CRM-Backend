import { Router } from 'express';
import { param, query } from 'express-validator';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences
} from '../controllers/notificationController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(protect);

// Get notifications
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('unread_only').optional().isBoolean()
  ],
  validate,
  getNotifications
);

// Get preferences
router.get('/preferences', getPreferences);

// Update preferences
router.put('/preferences', updatePreferences);

// Mark all as read
router.put('/read-all', markAllAsRead);

// Mark single as read
router.put(
  '/:id/read',
  [
    param('id').isInt().withMessage('Invalid notification ID')
  ],
  validate,
  markAsRead
);

// Delete notification
router.delete(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid notification ID')
  ],
  validate,
  deleteNotification
);

export default router;
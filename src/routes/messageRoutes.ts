import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  sendMessage,
  getMessages,
  getMessageById,
  replyToMessage,
  updateMessagePrivacy,
  hideMessage,
  getUnreadCount
} from '../controllers/messageController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(protect);

// Get unread count
router.get('/unread/count', getUnreadCount);

// Get messages
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('folder').optional().isIn(['inbox', 'sent', 'all', 'trash'])
  ],
  validate,
  getMessages
);

// Send message
router.post(
  '/',
  [
    body('body').notEmpty().trim().withMessage('Message body is required'),
    body('recipient_ids').isArray({ min: 1 }).withMessage('At least one recipient is required'),
    body('recipient_ids.*').isInt().withMessage('Invalid recipient ID'),
    body('subject').optional().trim(),
    body('parent_id').optional().isInt(),
    body('is_private').optional().isBoolean()
  ],
  validate,
  sendMessage
);

// Get message by ID
router.get(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid message ID')
  ],
  validate,
  getMessageById
);

// Reply to message
router.post(
  '/:id/reply',
  [
    param('id').isInt().withMessage('Invalid message ID'),
    body('body').notEmpty().trim().withMessage('Reply body is required'),
    body('is_private').optional().isBoolean()
  ],
  validate,
  replyToMessage
);

// Update privacy settings
router.put(
  '/:id/privacy',
  [
    param('id').isInt().withMessage('Invalid message ID'),
    body('can_receive').isBoolean().withMessage('can_receive must be boolean')
  ],
  validate,
  updateMessagePrivacy
);

// Hide/delete message
router.delete(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid message ID')
  ],
  validate,
  hideMessage
);

export default router;
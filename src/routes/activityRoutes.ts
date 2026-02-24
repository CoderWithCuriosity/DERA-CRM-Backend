import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  completeActivity,
  deleteActivity,
  getTodayActivities,
  getUpcomingActivities
} from '../controllers/activityController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { ACTIVITY_TYPES, ACTIVITY_STATUS } from '../config/constants';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/activities
 * @desc    Create a new activity
 * @access  Private
 */
router.post(
  '/',
  [
    body('type').isIn(Object.values(ACTIVITY_TYPES)).withMessage('Valid activity type is required'),
    body('subject').notEmpty().trim().withMessage('Subject is required'),
    body('description').optional().trim(),
    body('contact_id').optional().isInt(),
    body('deal_id').optional().isInt(),
    body('scheduled_date').isISO8601().toDate().withMessage('Valid scheduled date is required'),
    body('duration').optional().isInt({ min: 1 }).toInt(),
    body('user_id').optional().isInt()
  ],
  validate,
  createActivity
);

/**
 * @route   GET /api/activities
 * @desc    Get all activities
 * @access  Private
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('type').optional().isIn(Object.values(ACTIVITY_TYPES)),
    query('contact_id').optional().isInt(),
    query('deal_id').optional().isInt(),
    query('user_id').optional().isInt(),
    query('status').optional().isIn(Object.values(ACTIVITY_STATUS)),
    query('date_from').optional().isISO8601().toDate(),
    query('date_to').optional().isISO8601().toDate()
  ],
  validate,
  getActivities
);

/**
 * @route   GET /api/activities/today
 * @desc    Get today's activities
 * @access  Private
 */
router.get(
  '/today',
  [
    query('user_id').optional().isInt()
  ],
  validate,
  getTodayActivities
);

/**
 * @route   GET /api/activities/upcoming
 * @desc    Get upcoming activities
 * @access  Private
 */
router.get(
  '/upcoming',
  [
    query('days').optional().isInt({ min: 1, max: 30 }).toInt(),
    query('user_id').optional().isInt()
  ],
  validate,
  getUpcomingActivities
);

/**
 * @route   GET /api/activities/:id
 * @desc    Get activity by ID
 * @access  Private
 */
router.get(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid activity ID')
  ],
  validate,
  getActivityById
);

/**
 * @route   PUT /api/activities/:id
 * @desc    Update activity
 * @access  Private
 */
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid activity ID'),
    body('type').optional().isIn(Object.values(ACTIVITY_TYPES)),
    body('subject').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('scheduled_date').optional().isISO8601().toDate(),
    body('duration').optional().isInt({ min: 1 }).toInt()
  ],
  validate,
  updateActivity
);

/**
 * @route   POST /api/activities/:id/complete
 * @desc    Mark activity as completed
 * @access  Private
 */
router.post(
  '/:id/complete',
  [
    param('id').isInt().withMessage('Invalid activity ID'),
    body('outcome').optional().trim(),
    body('duration').optional().isInt({ min: 1 }).toInt()
  ],
  validate,
  completeActivity
);

/**
 * @route   DELETE /api/activities/:id
 * @desc    Delete activity
 * @access  Private
 */
router.delete(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid activity ID')
  ],
  validate,
  deleteActivity
);

export default router;
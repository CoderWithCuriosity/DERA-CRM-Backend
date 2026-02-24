import { body, param, query } from 'express-validator';
import { ACTIVITY_TYPES, ACTIVITY_STATUS } from '../../config/constants';

/**
 * Create activity validation
 */
export const createActivityValidation = [
  body('type')
    .isIn(Object.values(ACTIVITY_TYPES))
    .withMessage('Valid activity type is required'),
  
  body('subject')
    .notEmpty()
    .withMessage('Subject is required')
    .trim()
    .isLength({ max: 255 })
    .withMessage('Subject cannot exceed 255 characters'),
  
  body('description')
    .optional()
    .trim(),
  
  body('contact_id')
    .optional()
    .isInt()
    .withMessage('Invalid contact ID')
    .toInt(),
  
  body('deal_id')
    .optional()
    .isInt()
    .withMessage('Invalid deal ID')
    .toInt(),
  
  body('scheduled_date')
    .isISO8601()
    .withMessage('Valid scheduled date is required')
    .toDate(),
  
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive number')
    .toInt(),
  
  body('user_id')
    .optional()
    .isInt()
    .withMessage('Invalid user ID')
    .toInt()
];

/**
 * Get activities validation
 */
export const getActivitiesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('type')
    .optional()
    .isIn(Object.values(ACTIVITY_TYPES))
    .withMessage('Invalid activity type'),
  
  query('contact_id')
    .optional()
    .isInt()
    .withMessage('Invalid contact ID')
    .toInt(),
  
  query('deal_id')
    .optional()
    .isInt()
    .withMessage('Invalid deal ID')
    .toInt(),
  
  query('user_id')
    .optional()
    .isInt()
    .withMessage('Invalid user ID')
    .toInt(),
  
  query('status')
    .optional()
    .isIn(Object.values(ACTIVITY_STATUS))
    .withMessage('Invalid status'),
  
  query('date_from')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .toDate(),
  
  query('date_to')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .toDate()
];

/**
 * Get activity by ID validation
 */
export const getActivityByIdValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid activity ID')
    .toInt()
];

/**
 * Update activity validation
 */
export const updateActivityValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid activity ID')
    .toInt(),
  
  body('type')
    .optional()
    .isIn(Object.values(ACTIVITY_TYPES))
    .withMessage('Invalid activity type'),
  
  body('subject')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Subject cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Subject cannot exceed 255 characters'),
  
  body('description')
    .optional()
    .trim(),
  
  body('scheduled_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .toDate(),
  
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive number')
    .toInt()
];

/**
 * Complete activity validation
 */
export const completeActivityValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid activity ID')
    .toInt(),
  
  body('outcome')
    .optional()
    .trim(),
  
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive number')
    .toInt()
];

/**
 * Delete activity validation
 */
export const deleteActivityValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid activity ID')
    .toInt()
];

/**
 * Get today's activities validation
 */
export const getTodayActivitiesValidation = [
  query('user_id')
    .optional()
    .isInt()
    .withMessage('Invalid user ID')
    .toInt()
];

/**
 * Get upcoming activities validation
 */
export const getUpcomingActivitiesValidation = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Days must be between 1 and 30')
    .toInt(),
  
  query('user_id')
    .optional()
    .isInt()
    .withMessage('Invalid user ID')
    .toInt()
];
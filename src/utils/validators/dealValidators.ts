import { body, param, query } from 'express-validator';
import { DEAL_STAGES, DEAL_STATUS } from '../../config/constants';

/**
 * Create deal validation
 */
export const createDealValidation = [
  body('name')
    .notEmpty()
    .withMessage('Deal name is required')
    .trim()
    .isLength({ max: 255 })
    .withMessage('Deal name cannot exceed 255 characters'),
  
  body('contact_id')
    .isInt()
    .withMessage('Valid contact ID is required')
    .toInt(),
  
  body('stage')
    .optional()
    .isIn(Object.values(DEAL_STAGES))
    .withMessage('Invalid stage'),
  
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number')
    .toFloat(),
  
  body('probability')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Probability must be between 0 and 100')
    .toInt(),
  
  body('expected_close_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .toDate(),
  
  body('notes')
    .optional()
    .trim(),
  
  body('user_id')
    .optional()
    .isInt()
    .withMessage('Invalid user ID')
    .toInt()
];

/**
 * Get deals validation
 */
export const getDealsValidation = [
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
  
  query('stage')
    .optional()
    .isIn(Object.values(DEAL_STAGES))
    .withMessage('Invalid stage'),
  
  query('status')
    .optional()
    .isIn(Object.values(DEAL_STATUS))
    .withMessage('Invalid status'),
  
  query('user_id')
    .optional()
    .isInt()
    .withMessage('Invalid user ID')
    .toInt(),
  
  query('contact_id')
    .optional()
    .isInt()
    .withMessage('Invalid contact ID')
    .toInt(),
  
  query('search')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term too long'),
  
  query('date_from')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .toDate(),
  
  query('date_to')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .toDate(),
  
  query('min_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be a positive number')
    .toFloat(),
  
  query('max_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum amount must be a positive number')
    .toFloat()
];

/**
 * Get deal by ID validation
 */
export const getDealByIdValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid deal ID')
    .toInt()
];

/**
 * Update deal validation
 */
export const updateDealValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid deal ID')
    .toInt(),
  
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Deal name cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Deal name cannot exceed 255 characters'),
  
  body('stage')
    .optional()
    .isIn(Object.values(DEAL_STAGES))
    .withMessage('Invalid stage'),
  
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number')
    .toFloat(),
  
  body('probability')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Probability must be between 0 and 100')
    .toInt(),
  
  body('expected_close_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .toDate(),
  
  body('notes')
    .optional()
    .trim()
];

/**
 * Update deal stage validation
 */
export const updateDealStageValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid deal ID')
    .toInt(),
  
  body('stage')
    .isIn(Object.values(DEAL_STAGES))
    .withMessage('Valid stage is required'),
  
  body('actual_close_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .toDate()
];

/**
 * Mark deal as won validation
 */
export const markDealAsWonValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid deal ID')
    .toInt(),
  
  body('actual_close_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .toDate(),
  
  body('notes')
    .optional()
    .trim()
];

/**
 * Mark deal as lost validation
 */
export const markDealAsLostValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid deal ID')
    .toInt(),
  
  body('actual_close_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .toDate(),
  
  body('notes')
    .optional()
    .trim(),
  
  body('loss_reason')
    .optional()
    .isIn(['competitor_price', 'competitor_features', 'budget', 'timing', 'other'])
    .withMessage('Invalid loss reason')
];

/**
 * Delete deal validation
 */
export const deleteDealValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid deal ID')
    .toInt()
];
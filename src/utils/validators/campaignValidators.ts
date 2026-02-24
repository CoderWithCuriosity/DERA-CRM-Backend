import { body, param, query } from 'express-validator';
import { CAMPAIGN_STATUS } from '../../config/constants';

/**
 * Create campaign validation
 */
export const createCampaignValidation = [
  body('name')
    .notEmpty()
    .withMessage('Campaign name is required')
    .trim()
    .isLength({ max: 255 })
    .withMessage('Campaign name cannot exceed 255 characters'),
  
  body('template_id')
    .isInt()
    .withMessage('Valid template ID is required')
    .toInt(),
  
  body('target_list')
    .isObject()
    .withMessage('Target list is required'),
  
  body('target_list.contact_ids')
    .optional()
    .isArray()
    .withMessage('Contact IDs must be an array'),
  
  body('target_list.contact_ids.*')
    .optional()
    .isInt()
    .withMessage('Invalid contact ID'),
  
  body('target_list.filters')
    .optional()
    .isObject()
    .withMessage('Filters must be an object'),
  
  body('scheduled_at')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .toDate()
];

/**
 * Get campaigns validation
 */
export const getCampaignsValidation = [
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
  
  query('status')
    .optional()
    .isIn(Object.values(CAMPAIGN_STATUS))
    .withMessage('Invalid status'),
  
  query('search')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term too long')
];

/**
 * Get campaign by ID validation
 */
export const getCampaignByIdValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid campaign ID')
    .toInt()
];

/**
 * Update campaign validation
 */
export const updateCampaignValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid campaign ID')
    .toInt(),
  
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Campaign name cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Campaign name cannot exceed 255 characters'),
  
  body('scheduled_at')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .toDate()
];

/**
 * Send campaign validation
 */
export const sendCampaignValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid campaign ID')
    .toInt(),
  
  body('send_immediately')
    .optional()
    .isBoolean()
    .withMessage('send_immediately must be a boolean')
    .toBoolean()
];

/**
 * Cancel campaign validation
 */
export const cancelCampaignValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid campaign ID')
    .toInt()
];

/**
 * Send test email validation
 */
export const sendTestEmailValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid campaign ID')
    .toInt(),
  
  body('test_email')
    .isEmail()
    .withMessage('Valid test email is required')
    .normalizeEmail(),
  
  body('test_data')
    .optional()
    .isObject()
    .withMessage('Test data must be an object')
];

/**
 * Get campaign analytics validation
 */
export const getCampaignAnalyticsValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid campaign ID')
    .toInt()
];

/**
 * Duplicate campaign validation
 */
export const duplicateCampaignValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid campaign ID')
    .toInt()
];
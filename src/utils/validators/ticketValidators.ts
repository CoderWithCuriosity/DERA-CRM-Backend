import { body, param, query } from 'express-validator';
import { TICKET_STATUS, PRIORITIES } from '../../config/constants';

/**
 * Create ticket validation
 */
export const createTicketValidation = [
  body('subject')
    .notEmpty()
    .withMessage('Subject is required')
    .trim()
    .isLength({ max: 255 })
    .withMessage('Subject cannot exceed 255 characters'),
  
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .trim(),
  
  body('contact_id')
    .isInt()
    .withMessage('Valid contact ID is required')
    .toInt(),
  
  body('priority')
    .optional()
    .isIn(Object.values(PRIORITIES))
    .withMessage('Invalid priority'),
  
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .toDate(),
  
  body('assigned_to')
    .optional()
    .isInt()
    .withMessage('Invalid user ID')
    .toInt()
];

/**
 * Get tickets validation
 */
export const getTicketsValidation = [
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
    .isIn(Object.values(TICKET_STATUS))
    .withMessage('Invalid status'),
  
  query('priority')
    .optional()
    .isIn(Object.values(PRIORITIES))
    .withMessage('Invalid priority'),
  
  query('assigned_to')
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
    .withMessage('Search term too long')
];

/**
 * Get ticket by ID validation
 */
export const getTicketByIdValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid ticket ID')
    .toInt()
];

/**
 * Update ticket validation
 */
export const updateTicketValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid ticket ID')
    .toInt(),
  
  body('subject')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Subject cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Subject cannot exceed 255 characters'),
  
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty'),
  
  body('priority')
    .optional()
    .isIn(Object.values(PRIORITIES))
    .withMessage('Invalid priority'),
  
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .toDate()
];

/**
 * Update ticket status validation
 */
export const updateTicketStatusValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid ticket ID')
    .toInt(),
  
  body('status')
    .isIn(Object.values(TICKET_STATUS))
    .withMessage('Valid status is required'),
  
  body('resolution_notes')
    .optional()
    .trim()
];

/**
 * Assign ticket validation
 */
export const assignTicketValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid ticket ID')
    .toInt(),
  
  body('assigned_to')
    .optional()
    .isInt()
    .withMessage('Invalid user ID')
    .toInt()
];

/**
 * Add comment validation
 */
export const addCommentValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid ticket ID')
    .toInt(),
  
  body('comment')
    .notEmpty()
    .withMessage('Comment is required')
    .trim(),
  
  body('is_internal')
    .optional()
    .isBoolean()
    .withMessage('is_internal must be a boolean')
    .toBoolean()
];

/**
 * Get comments validation
 */
export const getCommentsValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid ticket ID')
    .toInt(),
  
  query('include_internal')
    .optional()
    .isBoolean()
    .withMessage('include_internal must be a boolean')
    .toBoolean()
];

/**
 * Delete ticket validation
 */
export const deleteTicketValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid ticket ID')
    .toInt()
];

/**
 * Get SLA report validation
 */
export const getSLAReportValidation = [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format')
    .toDate(),
  
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .toDate()
];
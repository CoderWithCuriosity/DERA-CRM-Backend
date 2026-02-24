import { body, param, query } from 'express-validator';
import { CONTACT_STATUS, CONTACT_SOURCES } from '../../config/constants';

/**
 * Create contact validation
 */
export const createContactValidation = [
  body('first_name')
    .notEmpty()
    .withMessage('First name is required')
    .trim()
    .isLength({ max: 100 })
    .withMessage('First name cannot exceed 100 characters'),
  
  body('last_name')
    .notEmpty()
    .withMessage('Last name is required')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Last name cannot exceed 100 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  
  body('company')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Company name cannot exceed 255 characters'),
  
  body('job_title')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Job title cannot exceed 255 characters'),
  
  body('status')
    .optional()
    .isIn(Object.values(CONTACT_STATUS))
    .withMessage('Invalid status'),
  
  body('source')
    .optional()
    .isIn(Object.values(CONTACT_SOURCES))
    .withMessage('Invalid source'),
  
  body('notes')
    .optional()
    .trim(),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each tag cannot exceed 50 characters')
];

/**
 * Get contacts validation
 */
export const getContactsValidation = [
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
    .isIn(Object.values(CONTACT_STATUS))
    .withMessage('Invalid status'),
  
  query('tag')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Tag too long'),
  
  query('search')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term too long'),
  
  query('sort_by')
    .optional()
    .isIn(['created_at', 'first_name', 'last_name', 'email', 'company'])
    .withMessage('Invalid sort field'),
  
  query('sort_order')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be ASC or DESC')
];

/**
 * Get contact by ID validation
 */
export const getContactByIdValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid contact ID')
    .toInt()
];

/**
 * Update contact validation
 */
export const updateContactValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid contact ID')
    .toInt(),
  
  body('first_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('First name cannot exceed 100 characters'),
  
  body('last_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Last name cannot exceed 100 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  
  body('company')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Company name cannot exceed 255 characters'),
  
  body('job_title')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Job title cannot exceed 255 characters'),
  
  body('status')
    .optional()
    .isIn(Object.values(CONTACT_STATUS))
    .withMessage('Invalid status'),
  
  body('source')
    .optional()
    .isIn(Object.values(CONTACT_SOURCES))
    .withMessage('Invalid source'),
  
  body('notes')
    .optional()
    .trim(),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

/**
 * Delete contact validation
 */
export const deleteContactValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid contact ID')
    .toInt()
];

/**
 * Add tag validation
 */
export const addTagValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid contact ID')
    .toInt(),
  
  body('tag')
    .notEmpty()
    .withMessage('Tag is required')
    .trim()
    .isLength({ max: 50 })
    .withMessage('Tag cannot exceed 50 characters')
];

/**
 * Remove tag validation
 */
export const removeTagValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid contact ID')
    .toInt(),
  
  param('tag')
    .notEmpty()
    .withMessage('Tag is required')
    .isString()
    .trim()
];

/**
 * Import contacts validation
 */
export const importContactsValidation = [
  body('column_mapping')
    .optional()
    .isObject()
    .withMessage('Column mapping must be an object')
];
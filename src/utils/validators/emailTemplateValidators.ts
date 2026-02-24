import { body, param, query } from 'express-validator';

/**
 * Create email template validation
 */
export const createEmailTemplateValidation = [
  body('name')
    .notEmpty()
    .withMessage('Template name is required')
    .trim()
    .isLength({ max: 255 })
    .withMessage('Template name cannot exceed 255 characters'),
  
  body('subject')
    .notEmpty()
    .withMessage('Email subject is required')
    .trim()
    .isLength({ max: 255 })
    .withMessage('Subject cannot exceed 255 characters'),
  
  body('body')
    .notEmpty()
    .withMessage('Email body is required'),
  
  body('variables')
    .optional()
    .isArray()
    .withMessage('Variables must be an array'),
  
  body('variables.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each variable cannot exceed 50 characters')
];

/**
 * Get email templates validation
 */
export const getEmailTemplatesValidation = [
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
  
  query('search')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term too long')
];

/**
 * Get email template by ID validation
 */
export const getEmailTemplateByIdValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid template ID')
    .toInt()
];

/**
 * Update email template validation
 */
export const updateEmailTemplateValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid template ID')
    .toInt(),
  
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Template name cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Template name cannot exceed 255 characters'),
  
  body('subject')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Email subject cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Subject cannot exceed 255 characters'),
  
  body('body')
    .optional()
    .notEmpty()
    .withMessage('Email body cannot be empty'),
  
  body('variables')
    .optional()
    .isArray()
    .withMessage('Variables must be an array')
];

/**
 * Delete email template validation
 */
export const deleteEmailTemplateValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid template ID')
    .toInt()
];

/**
 * Preview email template validation
 */
export const previewEmailTemplateValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid template ID')
    .toInt(),
  
  body('test_data')
    .optional()
    .isObject()
    .withMessage('Test data must be an object')
];

/**
 * Duplicate email template validation
 */
export const duplicateEmailTemplateValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid template ID')
    .toInt()
];
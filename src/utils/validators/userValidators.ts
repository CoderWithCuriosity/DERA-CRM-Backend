import { body, param, query } from 'express-validator';
import { USER_ROLES } from '../../config/constants';

/**
 * Update profile validation
 */
export const updateProfileValidation = [
  body('first_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  
  body('last_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
];

/**
 * Get users validation
 */
export const getUsersValidation = [
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
  
  query('role')
    .optional()
    .isIn(Object.values(USER_ROLES))
    .withMessage('Invalid role'),
  
  query('search')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term too long')
];

/**
 * Get user by ID validation
 */
export const getUserByIdValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid user ID')
    .toInt()
];

/**
 * Update user role validation
 */
export const updateUserRoleValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid user ID')
    .toInt(),
  
  body('role')
    .isIn(Object.values(USER_ROLES))
    .withMessage('Invalid role')
];

/**
 * Delete user validation
 */
export const deleteUserValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid user ID')
    .toInt()
];
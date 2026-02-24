import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  removeAvatar,
  getUsers,
  getUserById,
  updateUserRole,
  deleteUser
} from '../controllers/userController';
import { protect, restrictTo } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { avatarUpload } from '../config/fileUpload';
import { USER_ROLES } from '../config/constants';
import { uploadLimiter } from '../config/rateLimit';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put(
  '/profile',
  [
    body('first_name').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('last_name').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email')
  ],
  validate,
  updateProfile
);

/**
 * @route   PUT /api/users/change-password
 * @desc    Change current user password
 * @access  Private
 */
router.put(
  '/change-password',
  [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
      .withMessage('New password must contain at least one letter and one number')
  ],
  validate,
  changePassword
);

/**
 * @route   POST /api/users/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post(
  '/avatar',
  uploadLimiter,
  avatarUpload.single('avatar'),
  uploadAvatar
);

/**
 * @route   DELETE /api/users/avatar
 * @desc    Remove user avatar
 * @access  Private
 */
router.delete('/avatar', removeAvatar);

// Admin/Manager only routes
router.use(restrictTo(USER_ROLES.ADMIN, USER_ROLES.MANAGER));

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private/Admin/Manager
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('role').optional().isIn(Object.values(USER_ROLES)),
    query('search').optional().isString().trim()
  ],
  validate,
  getUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private/Admin/Manager
 */
router.get(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid user ID')
  ],
  validate,
  getUserById
);

// Admin only routes
router.use(restrictTo(USER_ROLES.ADMIN));

/**
 * @route   PUT /api/users/:id/role
 * @desc    Update user role
 * @access  Private/Admin
 */
router.put(
  '/:id/role',
  [
    param('id').isInt().withMessage('Invalid user ID'),
    body('role').isIn(Object.values(USER_ROLES)).withMessage('Invalid role')
  ],
  validate,
  updateUserRole
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid user ID')
  ],
  validate,
  deleteUser
);

export default router;
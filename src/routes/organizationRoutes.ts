import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  getOrganizationSettings,
  updateOrganizationSettings,
  uploadCompanyLogo,
  removeCompanyLogo,
  getOrganizationUsers,
  inviteUser,
  getBillingInfo
} from '../controllers/organizationController';
import { protect, restrictTo } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { logoUpload } from '../config/fileUpload';
import { USER_ROLES } from '../config/constants';
import { uploadLimiter } from '../config/rateLimit';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/organization/settings
 * @desc    Get organization settings
 * @access  Private
 */
router.get('/settings', getOrganizationSettings);

/**
 * @route   PUT /api/organization/settings
 * @desc    Update organization settings
 * @access  Private/Admin
 */
router.put(
  '/settings',
  restrictTo('admin'),
  [
    body('company_name').optional().trim().notEmpty(),
    body('company_email').optional().isEmail().normalizeEmail(),
    body('company_phone').optional().isMobilePhone('any'),
    body('company_address').optional().trim(),
    body('website').optional().isURL(),
    body('timezone').optional().isString(),
    body('date_format').optional().isString(),
    body('currency').optional().isLength({ min: 3, max: 3 }).isString()
  ],
  validate,
  updateOrganizationSettings
);

/**
 * @route   POST /api/organization/logo
 * @desc    Upload company logo
 * @access  Private/Admin
 */
router.post(
  '/logo',
  restrictTo('admin'),
  uploadLimiter,
  logoUpload.single('logo'),
  uploadCompanyLogo
);

/**
 * @route   DELETE /api/organization/logo
 * @desc    Remove company logo
 * @access  Private/Admin
 */
router.delete(
  '/logo',
  restrictTo('admin'),
  removeCompanyLogo
);

/**
 * @route   GET /api/organization/users
 * @desc    Get organization users
 * @access  Private/Admin/Manager
 */
router.get(
  '/users',
  restrictTo('admin', 'manager'),
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('role').optional().isIn(Object.values(USER_ROLES)),
    query('search').optional().isString().trim()
  ],
  validate,
  getOrganizationUsers
);

/**
 * @route   POST /api/organization/invite
 * @desc    Invite user to organization
 * @access  Private/Admin
 */
router.post(
  '/invite',
  restrictTo('admin'),
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('first_name').notEmpty().trim().withMessage('First name is required'),
    body('last_name').notEmpty().trim().withMessage('Last name is required'),
    body('role').isIn(Object.values(USER_ROLES)).withMessage('Valid role is required')
  ],
  validate,
  inviteUser
);

/**
 * @route   GET /api/organization/billing
 * @desc    Get billing information
 * @access  Private/Admin
 */
router.get(
  '/billing',
  restrictTo('admin'),
  getBillingInfo
);

export default router;
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
  importContacts,
  getImportStatus,
  exportContacts,
  addTag,
  removeTag,
  getAllTags
} from '../controllers/contactController';
import { protect, restrictTo } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { importUpload } from '../config/fileUpload';
import { CONTACT_STATUS, CONTACT_SOURCES } from '../config/constants';
import { uploadLimiter, exportLimiter } from '../config/rateLimit';
import { avatarUpload } from '../config/fileUpload';
import { uploadContactAvatar, deleteContactAvatar } from '../controllers/contactController';
import attachmentRoutes from './attachmentRoutes';

const router = Router();

// All routes require authentication
router.use(protect);


// Avatar upload (single file)
router.post(
  '/:id/avatar',
  protect,
  avatarUpload.single('avatar'),
  uploadContactAvatar
);

// Delete avatar
router.delete(
  '/:id/avatar',
  protect,
  deleteContactAvatar
);

router.use('/:contactId/attachments', attachmentRoutes);

/**
 * @route   POST /api/contacts
 * @desc    Create a new contact
 * @access  Private
 */
router.post(
  '/',
  [
    body('first_name').notEmpty().trim().withMessage('First name is required'),
    body('last_name').notEmpty().trim().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('phone').optional().isMobilePhone('any').withMessage('Please provide a valid phone number'),
    body('company').optional().trim(),
    body('job_title').optional().trim(),
    body('status').optional().isIn(Object.values(CONTACT_STATUS)),
    body('source').optional().isIn(Object.values(CONTACT_SOURCES)),
    body('notes').optional().trim(),
    body('tags').optional().isArray(),
    body('tags.*').optional().isString().trim()
  ],
  validate,
  createContact
);

/**
 * @route   GET /api/contacts
 * @desc    Get all contacts
 * @access  Private
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isIn(Object.values(CONTACT_STATUS)),
    query('tag').optional().isString(),
    query('search').optional().isString().trim(),
    query('sort_by').optional().isIn(['created_at', 'first_name', 'last_name', 'email', 'company']),
    query('sort_order').optional().isIn(['ASC', 'DESC'])
  ],
  validate,
  getContacts
);

/**
 * @route   GET /api/contacts/tags/all
 * @desc    Get all tags
 * @access  Private
 */
router.get('/tags/all', getAllTags);

/**
 * @route   POST /api/contacts/import
 * @desc    Import contacts from CSV
 * @access  Private
 */
router.post(
  '/import',
  uploadLimiter,
  restrictTo('admin', 'manager'),
  importUpload.single('file'),
  importContacts
);

/**
 * @route   GET /api/contacts/import/:import_id/status
 * @desc    Get import status
 * @access  Private
 */
router.get(
  '/import/:import_id/status',
  restrictTo('admin', 'manager'),
  [
    param('import_id').isUUID().withMessage('Invalid import ID')
  ],
  validate,
  getImportStatus
);

/**
 * @route   GET /api/contacts/export
 * @desc    Export contacts
 * @access  Private
 */
router.get(
  '/export',
  exportLimiter,
  [
    query('format').optional().isIn(['csv', 'excel']).withMessage('Format must be csv or excel'),
    query('fields').optional().isString(),
    query('status').optional().isIn(Object.values(CONTACT_STATUS)),
    query('tag').optional().isString()
  ],
  validate,
  exportContacts
);

/**
 * @route   GET /api/contacts/:id
 * @desc    Get contact by ID
 * @access  Private
 */
router.get(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid contact ID')
  ],
  validate,
  getContactById
);

/**
 * @route   PUT /api/contacts/:id
 * @desc    Update contact
 * @access  Private
 */
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid contact ID'),
    body('first_name').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('last_name').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail(),
    body('phone').optional().isMobilePhone('any'),
    body('company').optional().trim(),
    body('job_title').optional().trim(),
    body('status').optional().isIn(Object.values(CONTACT_STATUS)),
    body('source').optional().isIn(Object.values(CONTACT_SOURCES)),
    body('notes').optional().trim(),
    body('tags').optional().isArray()
  ],
  validate,
  updateContact
);

/**
 * @route   DELETE /api/contacts/:id
 * @desc    Delete contact
 * @access  Private
 */
router.delete(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid contact ID')
  ],
  validate,
  deleteContact
);

/**
 * @route   POST /api/contacts/:id/tags
 * @desc    Add tag to contact
 * @access  Private
 */
router.post(
  '/:id/tags',
  [
    param('id').isInt().withMessage('Invalid contact ID'),
    body('tag').notEmpty().trim().withMessage('Tag is required')
  ],
  validate,
  addTag
);

/**
 * @route   DELETE /api/contacts/:id/tags/:tag
 * @desc    Remove tag from contact
 * @access  Private
 */
router.delete(
  '/:id/tags/:tag',
  [
    param('id').isInt().withMessage('Invalid contact ID'),
    param('tag').notEmpty().withMessage('Tag is required')
  ],
  validate,
  removeTag
);

export default router;
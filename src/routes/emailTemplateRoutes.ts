import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createEmailTemplate,
  getEmailTemplates,
  getEmailTemplateById,
  updateEmailTemplate,
  deleteEmailTemplate,
  previewEmailTemplate,
  duplicateEmailTemplate
} from '../controllers/emailTemplateController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/email-templates
 * @desc    Create a new email template
 * @access  Private
 */
router.post(
  '/',
  [
    body('name').notEmpty().trim().withMessage('Template name is required'),
    body('subject').notEmpty().trim().withMessage('Email subject is required'),
    body('body').notEmpty().withMessage('Email body is required'),
    body('variables').optional().isArray()
  ],
  validate,
  createEmailTemplate
);

/**
 * @route   GET /api/email-templates
 * @desc    Get all email templates
 * @access  Private
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().isString().trim()
  ],
  validate,
  getEmailTemplates
);

/**
 * @route   GET /api/email-templates/:id
 * @desc    Get email template by ID
 * @access  Private
 */
router.get(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid template ID')
  ],
  validate,
  getEmailTemplateById
);

/**
 * @route   PUT /api/email-templates/:id
 * @desc    Update email template
 * @access  Private
 */
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid template ID'),
    body('name').optional().trim().notEmpty(),
    body('subject').optional().trim().notEmpty(),
    body('body').optional().notEmpty(),
    body('variables').optional().isArray()
  ],
  validate,
  updateEmailTemplate
);

/**
 * @route   POST /api/email-templates/:id/preview
 * @desc    Preview email template with test data
 * @access  Private
 */
router.post(
  '/:id/preview',
  [
    param('id').isInt().withMessage('Invalid template ID'),
    body('test_data').optional().isObject()
  ],
  validate,
  previewEmailTemplate
);

/**
 * @route   POST /api/email-templates/:id/duplicate
 * @desc    Duplicate email template
 * @access  Private
 */
router.post(
  '/:id/duplicate',
  [
    param('id').isInt().withMessage('Invalid template ID')
  ],
  validate,
  duplicateEmailTemplate
);

/**
 * @route   DELETE /api/email-templates/:id
 * @desc    Delete email template
 * @access  Private
 */
router.delete(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid template ID')
  ],
  validate,
  deleteEmailTemplate
);

export default router;
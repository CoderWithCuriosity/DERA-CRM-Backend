import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  sendCampaign,
  cancelCampaign,
  sendTestEmail,
  getCampaignAnalytics,
  duplicateCampaign
} from '../controllers/campaignController';
import { protect, restrictTo } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { CAMPAIGN_STATUS } from '../config/constants';
import { campaignLimiter } from '../config/rateLimit';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/campaigns
 * @desc    Create a new campaign
 * @access  Private
 */
router.post(
  '/',
  [
    body('name').notEmpty().trim().withMessage('Campaign name is required'),
    body('template_id').isInt().withMessage('Valid template ID is required'),
    body('target_list').isObject().withMessage('Target list is required'),
    body('target_list.contact_ids').optional().isArray(),
    body('target_list.filters').optional().isObject(),
    body('scheduled_at').optional().isISO8601().toDate()
  ],
  validate,
  createCampaign
);

/**
 * @route   GET /api/campaigns
 * @desc    Get all campaigns
 * @access  Private
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isIn(Object.values(CAMPAIGN_STATUS)),
    query('search').optional().isString().trim()
  ],
  validate,
  getCampaigns
);

/**
 * @route   GET /api/campaigns/:id
 * @desc    Get campaign by ID
 * @access  Private
 */
router.get(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid campaign ID')
  ],
  validate,
  getCampaignById
);

/**
 * @route   GET /api/campaigns/:id/analytics
 * @desc    Get campaign analytics
 * @access  Private
 */
router.get(
  '/:id/analytics',
  [
    param('id').isInt().withMessage('Invalid campaign ID')
  ],
  validate,
  getCampaignAnalytics
);

/**
 * @route   PUT /api/campaigns/:id
 * @desc    Update campaign
 * @access  Private
 */
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid campaign ID'),
    body('name').optional().trim().notEmpty(),
    body('scheduled_at').optional().isISO8601().toDate()
  ],
  validate,
  updateCampaign
);

/**
 * @route   POST /api/campaigns/:id/send
 * @desc    Send campaign
 * @access  Private
 */
router.post(
  '/:id/send',
  campaignLimiter,
  [
    param('id').isInt().withMessage('Invalid campaign ID'),
    body('send_immediately').optional().isBoolean().toBoolean()
  ],
  validate,
  sendCampaign
);

/**
 * @route   POST /api/campaigns/:id/cancel
 * @desc    Cancel campaign
 * @access  Private
 */
router.post(
  '/:id/cancel',
  [
    param('id').isInt().withMessage('Invalid campaign ID')
  ],
  validate,
  cancelCampaign
);

/**
 * @route   POST /api/campaigns/:id/test
 * @desc    Send test email
 * @access  Private
 */
router.post(
  '/:id/test',
  campaignLimiter,
  [
    param('id').isInt().withMessage('Invalid campaign ID'),
    body('test_email').isEmail().normalizeEmail().withMessage('Valid test email is required'),
    body('test_data').optional().isObject()
  ],
  validate,
  sendTestEmail
);

/**
 * @route   POST /api/campaigns/:id/duplicate
 * @desc    Duplicate campaign
 * @access  Private
 */
router.post(
  '/:id/duplicate',
  [
    param('id').isInt().withMessage('Invalid campaign ID')
  ],
  validate,
  duplicateCampaign
);

export default router;
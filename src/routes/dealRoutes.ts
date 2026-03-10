import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createDeal,
  getDeals,
  getDealById,
  updateDeal,
  updateDealStage,
  markDealAsWon,
  markDealAsLost,
  deleteDeal,
  getPipelineSummary,
  getKanbanBoard
} from '../controllers/dealController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { DEAL_STAGES, DEAL_STATUS } from '../config/constants';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/deals
 * @desc    Create a new deal
 * @access  Private
 */
router.post(
  '/',
  [
    body('name').notEmpty().trim().withMessage('Deal name is required'),
    body('contact_id').isInt().withMessage('Valid contact ID is required'),
    body('stage').optional().isIn(Object.values(DEAL_STAGES)),
    body('amount').optional().isFloat({ min: 0 }).toFloat(),
    body('probability').optional().isInt({ min: 0, max: 100 }).toInt(),
    body('expected_close_date').optional().isISO8601().toDate(),
    body('notes').optional().trim(),
    body('user_id').optional().isInt()
  ],
  validate,
  createDeal
);

/**
 * @route   GET /api/deals
 * @desc    Get all deals
 * @access  Private
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('stage').optional().isIn(Object.values(DEAL_STAGES)),
    query('status').optional().isIn(Object.values(DEAL_STATUS)),
    query('user_id').optional().isInt(),
    query('contact_id').optional().isInt(),
    query('search').optional().isString().trim(),
    query('date_from').optional().isISO8601().toDate(),
    query('date_to').optional().isISO8601().toDate(),
    query('min_amount').optional().isFloat({ min: 0 }).toFloat(),
    query('max_amount').optional().isFloat({ min: 0 }).toFloat()
  ],
  validate,
  getDeals
);

/**
 * @route   GET /api/deals/pipeline/summary
 * @desc    Get pipeline summary
 * @access  Private
 */
router.get(
  '/pipeline/summary',
  [
    query('user_id').optional().isInt()
  ],
  validate,
  getPipelineSummary
);

/**
 * @route   GET /api/deals/kanban
 * @desc    Get kanban board data
 * @access  Private
 */
router.get(
  '/kanban',
  [
    query('user_id').optional().isInt()
  ],
  validate,
  getKanbanBoard
);

/**
 * @route   GET /api/deals/:id
 * @desc    Get deal by ID
 * @access  Private
 */
router.get(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid deal ID')
  ],
  validate,
  getDealById
);

/**
 * @route   PUT /api/deals/:id
 * @desc    Update deal
 * @access  Private
 */
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid deal ID'),
    body('name').optional().trim().notEmpty(),
    body('stage').optional().isIn(Object.values(DEAL_STAGES)),
    body('amount').optional().isFloat({ min: 0 }).toFloat(),
    body('probability').optional().isInt({ min: 0, max: 100 }).toInt(),
    body('expected_close_date').optional().isISO8601().toDate(),
    body('notes').optional().trim()
  ],
  validate,
  updateDeal
);

/**
 * @route   PATCH /api/deals/:id/stage
 * @desc    Update deal stage only (for drag & drop)
 * @access  Private
 */
router.patch(
  '/:id/stage',
  [
    param('id').isInt().withMessage('Invalid deal ID'),
    body('stage').isIn(Object.values(DEAL_STAGES)).withMessage('Valid stage is required'),
    body('actual_close_date').optional().isISO8601().toDate()
  ],
  validate,
  updateDealStage
);

/**
 * @route   POST /api/deals/:id/win
 * @desc    Mark deal as won
 * @access  Private
 */
router.post(
  '/:id/win',
  [
    param('id').isInt().withMessage('Invalid deal ID'),
    body('actual_close_date').optional().isISO8601().toDate(),
    body('notes').optional().trim()
  ],
  validate,
  markDealAsWon
);

/**
 * @route   POST /api/deals/:id/lost
 * @desc    Mark deal as lost
 * @access  Private
 */
router.post(
  '/:id/lost',
  [
    param('id').isInt().withMessage('Invalid deal ID'),
    body('actual_close_date').optional().isISO8601().toDate(),
    body('notes').optional().trim(),
    body('loss_reason').optional().isIn(['competitor_price', 'competitor_features', 'budget', 'timing', 'other'])
  ],
  validate,
  markDealAsLost
);

/**
 * @route   DELETE /api/deals/:id
 * @desc    Delete deal
 * @access  Private
 */
router.delete(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid deal ID')
  ],
  validate,
  deleteDeal
);

export default router;
import { Router } from 'express';
import { query } from 'express-validator';
import {
  getDashboard,
  getSalesChart,
  getPipelineChart,
  getTicketChart
} from '../controllers/dashboardController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/dashboard
 * @desc    Get dashboard data
 * @access  Private
 */
router.get(
  '/',
  [
    query('user_id').optional().isInt().withMessage('Invalid user ID')
  ],
  validate,
  getDashboard
);

/**
 * @route   GET /api/dashboard/sales-chart
 * @desc    Get sales chart data
 * @access  Private
 */
router.get(
  '/sales-chart',
  [
    query('period').optional().isIn(['month', 'quarter', 'year']),
    query('year').optional().isInt({ min: 2020, max: 2030 }).toInt()
  ],
  validate,
  getSalesChart
);

/**
 * @route   GET /api/dashboard/pipeline-chart
 * @desc    Get pipeline chart data
 * @access  Private
 */
router.get(
  '/pipeline-chart',
  validate,
  getPipelineChart
);

/**
 * @route   GET /api/dashboard/ticket-chart
 * @desc    Get ticket chart data
 * @access  Private
 */
router.get(
  '/ticket-chart',
  [
    query('days').optional().isInt({ min: 1, max: 30 }).toInt()
  ],
  validate,
  getTicketChart
);

export default router;
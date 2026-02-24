import { Router } from 'express';
import { query, param } from 'express-validator';
import {
  getSystemStats,
  getAuditLogs,
  getUserActivityReport,
  createBackup,
  getBackupStatus,
  getSystemHealth,
  getSystemConfig
} from '../controllers/adminController';
import { protect, restrictTo } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// All routes require authentication and admin role
router.use(protect);
router.use(restrictTo('admin'));

/**
 * @route   GET /api/admin/stats
 * @desc    Get system statistics
 * @access  Private/Admin
 */
router.get('/stats', getSystemStats);

/**
 * @route   GET /api/admin/health
 * @desc    Get system health
 * @access  Private/Admin
 */
router.get('/health', getSystemHealth);

/**
 * @route   GET /api/admin/config
 * @desc    Get system configuration
 * @access  Private/Admin
 */
router.get('/config', getSystemConfig);

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get audit logs
 * @access  Private/Admin
 */
router.get(
  '/audit-logs',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('user_id').optional().isInt(),
    query('action').optional().isString(),
    query('date_from').optional().isISO8601().toDate(),
    query('date_to').optional().isISO8601().toDate()
  ],
  validate,
  getAuditLogs
);

/**
 * @route   GET /api/admin/user-activity
 * @desc    Get user activity report
 * @access  Private/Admin/Manager
 */
router.get(
  '/user-activity',
  [
    query('start_date').optional().isISO8601().toDate(),
    query('end_date').optional().isISO8601().toDate(),
    query('user_id').optional().isInt()
  ],
  validate,
  getUserActivityReport
);

/**
 * @route   POST /api/admin/backup
 * @desc    Create database backup
 * @access  Private/Admin
 */
router.post('/backup', createBackup);

/**
 * @route   GET /api/admin/backup/:backup_id/status
 * @desc    Get backup status
 * @access  Private/Admin
 */
router.get(
  '/backup/:backup_id/status',
  [
    param('backup_id').isString().withMessage('Invalid backup ID')
  ],
  validate,
  getBackupStatus
);

export default router;
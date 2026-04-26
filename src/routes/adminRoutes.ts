import { Router } from 'express';
import { query, param } from 'express-validator';
import {
  getSystemStats,
  getUserActivityReport,
  createBackup,
  getBackupStatus,
  getSystemHealth,
  getSystemConfig,
  getAuditLogDetail,
  getEntityChangeHistory,
  getAuditLogSummary,
  getAuditLogs
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
 * @desc    Get paginated audit logs with filters
 * @access  Private/Admin/Manager
 */
router.get(
  '/audit-logs',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('user_id').optional().isInt().toInt(),
    query('action').optional().isString(),
    query('entity_type').optional().isString(),
    query('date_from').optional().isISO8601().toDate(),
    query('date_to').optional().isISO8601().toDate()
  ],
  validate,
  getAuditLogs
);

/**
 * @route   GET /api/admin/audit-logs/:id/detail
 * @desc    Get detailed audit log by ID with parsed JSON details
 * @access  Private/Admin/Manager
 */
router.get(
  '/audit-logs/:id/detail',
  [
    param('id').isInt().withMessage('Invalid audit log ID')
  ],
  validate,
  getAuditLogDetail
);

/**
 * @route   GET /api/admin/audit-logs/entity/:entityType/:entityId
 * @desc    Get complete change history for a specific entity
 * @access  Private/Admin/Manager
 */
router.get(
  '/audit-logs/entity/:entityType/:entityId',
  [
    param('entityType').isString().withMessage('Invalid entity type'),
    param('entityId').isInt().withMessage('Invalid entity ID'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  getEntityChangeHistory
);

/**
 * @route   GET /api/admin/audit-logs/summary
 * @desc    Get audit log statistics summary
 * @access  Private/Admin
 */
router.get(
  '/audit-logs/summary',
  [
    query('days').optional().isInt({ min: 1, max: 365 }).toInt(),
    query('entity_type').optional().isString()
  ],
  validate,
  getAuditLogSummary
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
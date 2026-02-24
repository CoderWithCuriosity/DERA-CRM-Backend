import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  updateTicketStatus,
  assignTicket,
  addTicketComment,
  getTicketComments,
  deleteTicket,
  getSLAReport
} from '../controllers/ticketController';
import { protect, restrictTo } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { TICKET_STATUS, PRIORITIES } from '../config/constants';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/tickets
 * @desc    Create a new ticket
 * @access  Private
 */
router.post(
  '/',
  [
    body('subject').notEmpty().trim().withMessage('Subject is required'),
    body('description').notEmpty().trim().withMessage('Description is required'),
    body('contact_id').isInt().withMessage('Valid contact ID is required'),
    body('priority').optional().isIn(Object.values(PRIORITIES)),
    body('due_date').optional().isISO8601().toDate(),
    body('assigned_to').optional().isInt()
  ],
  validate,
  createTicket
);

/**
 * @route   GET /api/tickets
 * @desc    Get all tickets
 * @access  Private
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isIn(Object.values(TICKET_STATUS)),
    query('priority').optional().isIn(Object.values(PRIORITIES)),
    query('assigned_to').optional().isInt(),
    query('contact_id').optional().isInt(),
    query('search').optional().isString().trim()
  ],
  validate,
  getTickets
);

/**
 * @route   GET /api/tickets/sla/report
 * @desc    Get SLA report
 * @access  Private/Admin/Manager
 */
router.get(
  '/sla/report',
  restrictTo('admin', 'manager'),
  [
    query('start_date').optional().isISO8601().toDate(),
    query('end_date').optional().isISO8601().toDate()
  ],
  validate,
  getSLAReport
);

/**
 * @route   GET /api/tickets/:id
 * @desc    Get ticket by ID
 * @access  Private
 */
router.get(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid ticket ID')
  ],
  validate,
  getTicketById
);

/**
 * @route   PUT /api/tickets/:id
 * @desc    Update ticket
 * @access  Private
 */
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid ticket ID'),
    body('subject').optional().trim().notEmpty(),
    body('description').optional().trim().notEmpty(),
    body('priority').optional().isIn(Object.values(PRIORITIES)),
    body('due_date').optional().isISO8601().toDate()
  ],
  validate,
  updateTicket
);

/**
 * @route   PATCH /api/tickets/:id/status
 * @desc    Update ticket status
 * @access  Private
 */
router.patch(
  '/:id/status',
  [
    param('id').isInt().withMessage('Invalid ticket ID'),
    body('status').isIn(Object.values(TICKET_STATUS)).withMessage('Valid status is required'),
    body('resolution_notes').optional().trim()
  ],
  validate,
  updateTicketStatus
);

/**
 * @route   POST /api/tickets/:id/assign
 * @desc    Assign ticket to user
 * @access  Private/Admin/Manager
 */
router.post(
  '/:id/assign',
  restrictTo('admin', 'manager'),
  [
    param('id').isInt().withMessage('Invalid ticket ID'),
    body('assigned_to').optional().isInt()
  ],
  validate,
  assignTicket
);

/**
 * @route   GET /api/tickets/:id/comments
 * @desc    Get ticket comments
 * @access  Private
 */
router.get(
  '/:id/comments',
  [
    param('id').isInt().withMessage('Invalid ticket ID'),
    query('include_internal').optional().isBoolean().toBoolean()
  ],
  validate,
  getTicketComments
);

/**
 * @route   POST /api/tickets/:id/comments
 * @desc    Add comment to ticket
 * @access  Private
 */
router.post(
  '/:id/comments',
  [
    param('id').isInt().withMessage('Invalid ticket ID'),
    body('comment').notEmpty().trim().withMessage('Comment is required'),
    body('is_internal').optional().isBoolean().toBoolean()
  ],
  validate,
  addTicketComment
);

/**
 * @route   DELETE /api/tickets/:id
 * @desc    Delete ticket (Admin only)
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  restrictTo('admin'),
  [
    param('id').isInt().withMessage('Invalid ticket ID')
  ],
  validate,
  deleteTicket
);

export default router;
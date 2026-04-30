import { Router } from 'express';
import { param } from 'express-validator';
import {
  uploadContactAttachment,
  getContactAttachments,
  deleteContactAttachment
} from '../controllers/attachmentController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { attachmentUpload } from '../config/fileUpload';

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(protect);

// Upload attachment
router.post(
  '/',
  attachmentUpload.single('file'),
  uploadContactAttachment
);

// Get all attachments for contact
router.get(
  '/',
  getContactAttachments
);

// Delete attachment
router.delete(
  '/:attachmentId',
  [
    param('attachmentId').isInt().withMessage('Invalid attachment ID')
  ],
  validate,
  deleteContactAttachment
);

export default router;
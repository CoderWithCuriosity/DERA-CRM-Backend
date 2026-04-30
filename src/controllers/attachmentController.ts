import { Request, Response } from 'express';
import { Contact, ContactAttachment, User } from '../models';
import {
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  AUDIT_ACTIONS,
  ENTITY_TYPES
} from '../config/constants';
import catchAsync from '../utils/catchAsync';
import { createSimpleAudit } from '../utils/auditHelper';
import fs from 'fs/promises';
import path from 'path';
import { deleteFile, getFileUrl } from '../config/fileUpload';

// Determine file type from mime type
const getFileType = (mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'other' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('excel') || mimeType.includes('text')) {
    return 'document';
  }
  return 'other';
};

// @desc    Upload attachment for contact
// @route   POST /api/contacts/:contactId/attachments
// @access  Private
export const uploadContactAttachment = catchAsync(async (req: Request, res: Response) => {
  const { contactId } = req.params;
  
  if (!req.file) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'No file uploaded'
    });
  }
  
  const contact = await Contact.findByPk(contactId);
  if (!contact) {
    await fs.unlink(req.file.path).catch(console.error);
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Contact')
    });
  }
  
  // Check permission
  if (req.user.role === 'agent' && contact.user_id !== req.user.id) {
    await fs.unlink(req.file.path).catch(console.error);
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }
  
  const fileType = getFileType(req.file.mimetype);
  const fileUrl = getFileUrl(req.file.filename, 'ATTACHMENT_DIR');
  
  const attachment = await ContactAttachment.create({
    contact_id: parseInt(contactId),
    filename: req.file.filename,
    original_name: req.file.originalname,
    file_path: fileUrl,
    file_size: req.file.size,
    mime_type: req.file.mimetype,
    file_type: fileType,
    uploaded_by: req.user.id,
    description: req.body.description || null
  });
  
  // Log audit
  await createSimpleAudit(
    req.user.id,
    AUDIT_ACTIONS.CREATE,
    ENTITY_TYPES.CONTACT,
    contact.id,
    `Uploaded attachment: ${req.file.originalname}`,
    req
  );
  
  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: SUCCESS_MESSAGES.CREATED('Attachment'),
    data: { attachment }
  });
});

// @desc    Get contact attachments
// @route   GET /api/contacts/:contactId/attachments
// @access  Private
export const getContactAttachments = catchAsync(async (req: Request, res: Response) => {
  const { contactId } = req.params;
  
  const contact = await Contact.findByPk(contactId);
  if (!contact) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Contact')
    });
  }
  
  // Check permission
  if (req.user.role === 'agent' && contact.user_id !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }
  
  const attachments = await ContactAttachment.findAll({
    where: { contact_id: contactId },
    include: [
      {
        model: User,
        as: 'uploader',
        attributes: ['id', 'first_name', 'last_name']
      }
    ],
    order: [['created_at', 'DESC']]
  });
  
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { attachments, total: attachments.length }
  });
});

// @desc    Delete contact attachment
// @route   DELETE /api/contacts/:contactId/attachments/:attachmentId
// @access  Private
export const deleteContactAttachment = catchAsync(async (req: Request, res: Response) => {
  const { contactId, attachmentId } = req.params;
  
  const contact = await Contact.findByPk(contactId);
  if (!contact) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Contact')
    });
  }
  
  const attachment = await ContactAttachment.findOne({
    where: {
      id: attachmentId,
      contact_id: contactId
    }
  });
  
  if (!attachment) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Attachment')
    });
  }
  
  // Check permission (contact owner or attachment uploader)
  if (req.user.role === 'agent' && contact.user_id !== req.user.id && attachment.uploaded_by !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }
  
  // Delete physical file
  const filename = path.basename(attachment.file_path);
  await deleteFile(filename, 'ATTACHMENT_DIR').catch(console.error);
  
  await attachment.destroy();
  
  // Log audit
  await createSimpleAudit(
    req.user.id,
    AUDIT_ACTIONS.DELETE,
    ENTITY_TYPES.CONTACT,
    contact.id,
    `Deleted attachment: ${attachment.original_name}`,
    req
  );
  
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.DELETED('Attachment')
  });
});
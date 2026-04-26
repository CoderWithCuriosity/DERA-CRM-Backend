import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import { Organization, User } from '../models';
import {
  HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES,
  AUDIT_ACTIONS, ENTITY_TYPES, TIME
} from '../config/constants';
import catchAsync from '../utils/catchAsync';
import { deleteFile } from '../config/fileUpload';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { getPagination, getPagingData } from '../utils/pagination';
import { sendEmail } from '../services/emailService';
import { environment } from '../config/environment';
import { createDetailedAudit, createSimpleAudit } from '../utils/auditHelper';

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    fullName?: string;
  };
}

// @desc    Get organization settings
// @route   GET /api/organization/settings
// @access  Private
export const getOrganizationSettings = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // Check authentication
  if (!req.user?.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  // Assuming each user belongs to an organization
  // For now, get first organization or create default
  let organization = await Organization.findOne();

  if (!organization) {
    organization = await Organization.create({
      company_name: 'My Company',
      timezone: 'UTC',
      date_format: 'YYYY-MM-DD',
      currency: 'USD'
    });
  }

  // After finding/creating organization, add:
  await createSimpleAudit(
    req.user.id,
    AUDIT_ACTIONS.VIEW,
    ENTITY_TYPES.ORGANIZATION,
    organization.id,
    organization.company_name,
    req
  );

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: organization
  });
});

// @desc    Update organization settings
// @route   PUT /api/organization/settings
// @access  Private/Admin
export const updateOrganizationSettings = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // Check authentication
  if (!req.user?.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.VALIDATION_FAILED,
      errors: errors.array()
    });
  }

  const updates = req.body;

  // Check permission
  if (req.user.role !== 'admin') {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  let organization = await Organization.findOne();

  if (!organization) {
    organization = await Organization.create(updates);
    // Log audit
    await createSimpleAudit(
      req.user.id,
      AUDIT_ACTIONS.UPDATE,
      ENTITY_TYPES.ORGANIZATION,
      organization.id,
      'Organization settings updated',
      req
    );
  } else {
    // BEFORE update, store old data:
    const oldOrgData = {
      company_name: organization.company_name,
      company_email: organization.company_email,
      company_phone: organization.company_phone,
      company_address: organization.company_address,
      website: organization.website,
      timezone: organization.timezone,
      date_format: organization.date_format,
      currency: organization.currency
    };

    await organization.update(updates);

    // AFTER update:
    await createDetailedAudit({
      userId: req.user.id,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: ENTITY_TYPES.ORGANIZATION,
      entityId: organization.id,
      entityName: organization.company_name,
      req,
      oldData: oldOrgData,
      newData: {
        company_name: organization.company_name,
        company_email: organization.company_email,
        company_phone: organization.company_phone,
        company_address: organization.company_address,
        website: organization.website,
        timezone: organization.timezone,
        date_format: organization.date_format,
        currency: organization.currency
      }
    });
  }


  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.UPDATED('Organization settings'),
    data: organization
  });
});

// @desc    Upload company logo
// @route   POST /api/organization/logo
// @access  Private/Admin
export const uploadCompanyLogo = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // Check authentication
  if (!req.user?.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  if (!req.file) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  // Check permission
  if (req.user.role !== 'admin') {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  let organization = await Organization.findOne();

  if (!organization) {
    // Include all required fields with default values
    organization = await Organization.create({
      company_name: 'My Company',
      timezone: 'UTC',           // Add required field
      date_format: 'YYYY-MM-DD',  // Add required field
      currency: 'USD'             // Add required field
    });
  }

  // Delete old logo if exists
  if (organization.company_logo) {
    const oldFilename = path.basename(organization.company_logo);
    await deleteFile(oldFilename, 'LOGO_DIR');
  }

  // Process image with sharp
  const filename = req.file.filename;
  const filePath = req.file.path;
  const processedPath = path.join(path.dirname(filePath), `processed-${filename}`);

  await sharp(filePath)
    .resize(300, 100, { fit: 'inside' })
    .png({ quality: 90 })
    .toFile(processedPath);

  // Replace original with processed
  fs.unlinkSync(filePath);
  fs.renameSync(processedPath, filePath);

  // Update organization logo
  const logoUrl = `/uploads/logos/${filename}`;
  await organization.update({ company_logo: logoUrl });

  // Log audit
  await createSimpleAudit(
    req.user.id,
    AUDIT_ACTIONS.UPDATE,
    ENTITY_TYPES.ORGANIZATION,
    organization.id,
    'Company logo uploaded',
    req
  );

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Company logo uploaded successfully',
    data: { company_logo: logoUrl }
  });
});

// @desc    Remove company logo
// @route   DELETE /api/organization/logo
// @access  Private/Admin
export const removeCompanyLogo = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // Check authentication
  if (!req.user?.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  // Check permission
  if (req.user.role !== 'admin') {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  const organization = await Organization.findOne();

  if (organization && organization.company_logo) {
    const filename = path.basename(organization.company_logo);
    await deleteFile(filename, 'LOGO_DIR');
    await organization.update({ company_logo: null });

    // Log audit
    await createSimpleAudit(
      req.user.id,
      AUDIT_ACTIONS.UPDATE,
      ENTITY_TYPES.ORGANIZATION,
      organization.id,
      'Company logo removed',
      req
    );
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Company logo removed successfully'
  });
});

// @desc    Get organization users
// @route   GET /api/organization/users
// @access  Private/Admin/Manager
export const getOrganizationUsers = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // Check authentication
  if (!req.user?.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  const { page, limit, role, search } = req.query;

  const { take, skip } = getPagination(page as string, limit as string);

  let whereClause: any = {};

  if (role) {
    whereClause.role = role;
  }

  if (search) {
    whereClause = {
      ...whereClause,
      [Op.or]: [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ]
    };
  }

  const users = await User.findAndCountAll({
    where: whereClause,
    attributes: { exclude: ['password'] },
    limit: take,
    offset: skip,
    order: [['created_at', 'DESC']]
  });

  const response = getPagingData(users, page as string, limit as string);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: response
  });
});

// @desc    Invite user to organization
// @route   POST /api/organization/invite
// @access  Private/Admin
export const inviteUser = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // Check authentication
  if (!req.user?.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.VALIDATION_FAILED,
      errors: errors.array()
    });
  }

  const { email, first_name, last_name, role } = req.body;

  // Check permission
  if (req.user.role !== 'admin') {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: ERROR_MESSAGES.CONFLICT('User with this email')
    });
  }

  // Generate invitation token
  const invitationToken = jwt.sign(
    { email, first_name, last_name, role },
    environment.jwtSecret,
    { expiresIn: '7d' }
  );

  // Get organization
  const organization = await Organization.findOne();

  // Send invitation email
  const invitationUrl = `${environment.frontendUrl}/accept-invite?token=${invitationToken}`;
  await sendEmail({
    to: email,
    subject: `You've been invited to join ${organization?.company_name || 'DERA CRM'}`,
    template: 'userInvitation',
    data: {
      first_name,
      inviter_name: req.user.fullName || 'A user',
      company_name: organization?.company_name || 'DERA CRM',
      invitation_url: invitationUrl,
      expires_in: '7 days'
    }
  });

  // Log audit
  await createSimpleAudit(
    req.user.id,
    AUDIT_ACTIONS.CREATE,
    ENTITY_TYPES.USER,
    0,
    `Invited user: ${email}`,
    req
  );

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Invitation sent successfully'
  });
});

// @desc    Get organization billing info
// @route   GET /api/organization/billing
// @access  Private/Admin
export const getBillingInfo = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // Check authentication
  if (!req.user?.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  // Check permission
  if (req.user.role !== 'admin') {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  const organization = await Organization.findOne();

  // Mock billing data - implement with actual payment processing
  const billingInfo = {
    plan: 'Professional',
    status: 'active',
    next_billing_date: new Date(Date.now() + 30 * TIME.DAY).toISOString().split('T')[0],
    amount: 99.00,
    currency: organization?.currency || 'USD',
    payment_method: {
      type: 'credit_card',
      last4: '4242',
      exp_month: 12,
      exp_year: 2025
    },
    invoices: [
      {
        id: 'inv_12345',
        date: new Date(Date.now() - 30 * TIME.DAY).toISOString().split('T')[0],
        amount: 99.00,
        status: 'paid',
        pdf_url: '/invoices/inv_12345.pdf'
      }
    ]
  };

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: billingInfo
  });
});
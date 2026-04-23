import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { EmailTemplate, Campaign, AuditLog } from '../models';
import {
  HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES,
  AUDIT_ACTIONS, ENTITY_TYPES
} from '../config/constants';
import catchAsync from '../utils/catchAsync';
import { getPagination, getPagingData } from '../utils/pagination';
import sequelize from '../config/database';
import {User} from '../models';

// @desc    Create email template
// @route   POST /api/email-templates
// @access  Private
export const createEmailTemplate = catchAsync(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.VALIDATION_FAILED,
      errors: errors.array()
    });
  }

  const { name, subject, body, variables } = req.body;

  // Check if template name already exists
  const existingTemplate = await EmailTemplate.findOne({ where: { name } });
  if (existingTemplate) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: ERROR_MESSAGES.CONFLICT('Template name')
    });
  }

  // Extract variables from body if not provided
  let extractedVariables = variables || [];
  if (!variables || variables.length === 0) {
    const allText = `${subject} ${body}`;
    const matches = allText.match(/\{\{([^}]+)\}\}/g) || [];
    extractedVariables = [...new Set(matches.map(m => m.replace(/[{}]/g, '')))];
  }

  const template = await EmailTemplate.create({
    name,
    subject,
    body,
    variables: extractedVariables,
    user_id: req.user.id
  });

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.CREATE,
    entity_type: ENTITY_TYPES.EMAIL_TEMPLATE,
    entity_id: template.id,
    details: `Created email template: ${template.name}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: SUCCESS_MESSAGES.CREATED('Email template'),
    data: { template }
  });
});

// @desc    Get all email templates
// @route   GET /api/email-templates
// @access  Private
export const getEmailTemplates = catchAsync(async (req: Request, res: Response) => {
  // Check authentication
  if (!req.user?.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  const { page, limit, search } = req.query;

  // Get pagination parameters - note: returns { take, skip }
  const { take, skip } = getPagination(page as string, limit as string);

  let whereClause: any = {};

  if (search) {
    whereClause = {
      [Op.or]: [
        { name: { [Op.iLike]: `%${search}%` } },
        { subject: { [Op.iLike]: `%${search}%` } }
      ]
    };
  }

  // Role-based filtering
  if (req.user.role === 'agent') {
    whereClause.user_id = req.user.id;
  }

  const templates = await EmailTemplate.findAndCountAll({
    where: whereClause,
    limit: take,      // Use 'take' instead of 'limit'
    offset: skip,     // Use 'skip' instead of 'offset'
    order: [['created_at', 'DESC']],
    attributes: {
      include: [
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM campaigns
            WHERE campaigns.template_id = "EmailTemplate".id
          )`),
          'campaigns_count'
        ]
      ]
    }
  });

  // Generate preview for each template
  const enhancedTemplates = templates.rows.map(template => {
    const templateData = template.toJSON();
    // Create a simple preview by removing HTML tags and truncating
    const preview = template.body
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100) + '...';

    return {
      ...templateData,
      preview
    };
  });

  const response = getPagingData(
    { count: templates.count, rows: enhancedTemplates },
    page as string,
    limit as string
  );

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: response
  });
});

// @desc    Get email template by ID
// @route   GET /api/email-templates/:id
// @access  Private
export const getEmailTemplateById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const template = await EmailTemplate.findByPk(id, {
    include: [
      {
        model: User,
        as: 'createdBy',
        attributes: ['id', 'first_name', 'last_name']
      }
    ]
  });

  if (!template) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Email template')
    });
  }

  // Check permission
  if (req.user.role === 'agent' && template.user_id !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { template }
  });
});

// @desc    Update email template
// @route   PUT /api/email-templates/:id
// @access  Private
export const updateEmailTemplate = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, subject, body, variables } = req.body;

  const template = await EmailTemplate.findByPk(id);

  if (!template) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Email template')
    });
  }

  // Check permission
  if (req.user.role === 'agent' && template.user_id !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  // Check if new name conflicts with existing template
  if (name && name !== template.name) {
    const existingTemplate = await EmailTemplate.findOne({ where: { name } });
    if (existingTemplate) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: ERROR_MESSAGES.CONFLICT('Template name')
      });
    }
  }

  // Extract variables if not provided
  let updatedVariables = variables;
  if (!variables && (subject || body)) {
    const allText = `${subject || template.subject} ${body || template.body}`;
    const matches = allText.match(/\{\{([^}]+)\}\}/g) || [];
    updatedVariables = [...new Set(matches.map(m => m.replace(/[{}]/g, '')))];
  }

  await template.update({
    name: name || template.name,
    subject: subject || template.subject,
    body: body || template.body,
    variables: updatedVariables || template.variables
  });

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity_type: ENTITY_TYPES.EMAIL_TEMPLATE,
    entity_id: template.id,
    details: `Updated email template: ${template.name}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.UPDATED('Email template'),
    data: { template }
  });
});

// @desc    Delete email template
// @route   DELETE /api/email-templates/:id
// @access  Private
export const deleteEmailTemplate = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const template = await EmailTemplate.findByPk(id);

  if (!template) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Email template')
    });
  }

  // Check permission
  if (req.user.role === 'agent' && template.user_id !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  // Check if template is used in any campaigns
  const campaignsCount = await Campaign.count({ where: { template_id: id } });
  if (campaignsCount > 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Cannot delete template that is used in campaigns. Delete campaigns first.'
    });
  }

  await template.destroy();

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.DELETE,
    entity_type: ENTITY_TYPES.EMAIL_TEMPLATE,
    entity_id: parseInt(id),
    details: `Deleted email template: ${template.name}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.DELETED('Email template')
  });
});

// @desc    Preview email template
// @route   POST /api/email-templates/:id/preview
// @access  Private
export const previewEmailTemplate = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { test_data } = req.body;

  const template = await EmailTemplate.findByPk(id);

  if (!template) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Email template')
    });
  }

  // Render preview with test data
  const preview = template.renderPreview(test_data || {});

  // Generate HTML preview with styling
  const previewHtml = `
    <div style="padding: 20px; border: 1px solid #ccc; border-radius: 5px; background: #f9f9f9;">
      <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
        <strong>Subject:</strong> ${preview.subject}
      </div>
      <div style="padding: 20px; background: white; border-radius: 5px;">
        ${preview.body}
      </div>
    </div>
  `;

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      subject: preview.subject,
      body: preview.body,
      preview_html: previewHtml
    }
  });
});

// @desc    Duplicate email template
// @route   POST /api/email-templates/:id/duplicate
// @access  Private
export const duplicateEmailTemplate = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const template = await EmailTemplate.findByPk(id);

  if (!template) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Email template')
    });
  }

  // Create duplicate with unique name
  const duplicateName = `${template.name} (Copy)`;
  let finalName = duplicateName;
  let counter = 1;

  while (await EmailTemplate.findOne({ where: { name: finalName } })) {
    finalName = `${duplicateName} ${counter}`;
    counter++;
  }

  const duplicate = await EmailTemplate.create({
    name: finalName,
    subject: template.subject,
    body: template.body,
    variables: template.variables,
    user_id: req.user.id
  });

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.CREATE,
    entity_type: ENTITY_TYPES.EMAIL_TEMPLATE,
    entity_id: duplicate.id,
    details: `Duplicated email template from: ${template.name}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Template duplicated successfully',
    data: { template: duplicate }
  });
});
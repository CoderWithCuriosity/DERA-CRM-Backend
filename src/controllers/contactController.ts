import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Op, Order } from 'sequelize';
import { Contact, Deal, Ticket, Activity, User } from '../models';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES, CONTACT_STATUS, AUDIT_ACTIONS, ENTITY_TYPES } from '../config/constants';
import catchAsync from '../utils/catchAsync';
import { getPagination, getPagingData } from '../utils/pagination';
import { parseCSV } from '../services/importService';
import { generateExport } from '../services/exportService';
import { v4 as uuidv4 } from 'uuid';
import { ExportFormat, ExportOptions } from '../services/exportService';
import { importRedisService } from '../services/importRedisService';
import fs from 'fs/promises';
import path from 'path';
import { deleteFile, getFileUrl } from '../config/fileUpload';
import { ContactAttributes } from '../models';
import { createDetailedAudit, createSimpleAudit } from '../utils/auditHelper';



// @desc    Create contact
// @route   POST /api/contacts
// @access  Private
export const createContact = catchAsync(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.VALIDATION_FAILED,
      errors: errors.array()
    });
  }

  const { first_name, last_name, email, phone, company, job_title, status, source, notes, tags } = req.body;

  // Check if contact exists
  const existingContact = await Contact.findOne({ where: { email } });
  if (existingContact) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: ERROR_MESSAGES.CONFLICT('Contact with this email')
    });
  }

  const contact = await Contact.create({
    first_name,
    last_name,
    email,
    phone,
    company,
    job_title,
    status: status || CONTACT_STATUS.ACTIVE,
    source,
    notes,
    tags: tags || [],
    user_id: req.user.id
  });

  // Log audit
  await createDetailedAudit({
    userId: req.user.id,
    action: AUDIT_ACTIONS.CREATE,
    entityType: ENTITY_TYPES.CONTACT,
    entityId: contact.id,
    entityName: contact.fullName,
    req,
    newData: {
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      job_title: contact.job_title,
      status: contact.status
    }
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: SUCCESS_MESSAGES.CREATED('Contact'),
    data: { contact }
  });
});


export const getContacts = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, status, tag, search, sort_by, sort_order } = req.query;

  // Fix: Get pagination object and use the correct properties
  const pagination = getPagination(page as string, limit as string);
  const take = pagination.limit;
  const skip = pagination.skip;

  let whereClause: any = {};

  if (status) {
    whereClause.status = status;
  }

  if (tag) {
    whereClause.tags = { [Op.contains]: [tag] };
  }

  if (search) {
    whereClause = {
      ...whereClause,
      [Op.or]: [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { company: { [Op.iLike]: `%${search}%` } }
      ]
    };
  }

  // Role-based filtering
  if ((req.user as any).role === 'agent') {
    whereClause.user_id = (req.user as any).id;
  }

  // Fix: Properly type the order array
  let order: Order = [['created_at', 'DESC']];

  if (sort_by) {
    order = [[
      sort_by as string,
      (sort_order as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
    ]];
  }

  const contacts = await Contact.findAndCountAll({
    where: whereClause,
    limit: take,
    offset: skip,
    order,
    include: [
      {
        model: Deal,
        as: 'deals',
        attributes: ['id'],
        required: false
      },
      {
        model: Ticket,
        as: 'tickets',
        attributes: ['id'],
        required: false
      },
      {
        model: Activity,
        as: 'activities',
        attributes: ['id', 'created_at'],
        limit: 1,
        order: [['created_at', 'DESC']] as Order, // Type assertion here too
        required: false
      }
    ]
  });

  // Type assertion for rows with associations
  const rows = contacts.rows as (Contact & {
    deals?: any[];
    tickets?: any[];
    activities?: Activity[];
  })[];

  // Enhance contacts with counts
  const enhancedContacts = rows.map(contact => {
    const contactData = contact.toJSON();
    const activities = contact.activities || [];

    return {
      ...contactData,
      deals_count: contact.deals?.length || 0,
      tickets_count: contact.tickets?.length || 0,
      last_activity: activities[0]?.created_at || null
    };
  });

  // Get all unique tags for filtering
  const allTags = await Contact.findAll({
    attributes: ['tags'],
    where: whereClause,
    raw: true
  });

  const tagSet = new Set<string>();
  allTags.forEach((contact: any) => {
    if (contact.tags && Array.isArray(contact.tags)) {
      contact.tags.forEach((tag: string) => tagSet.add(tag));
    }
  });

  const response = getPagingData(
    { count: contacts.count, rows: enhancedContacts },
    page as string,
    limit as string
  );

  // Add filters to response
  (response as any).filters = {
    statuses: Object.values(CONTACT_STATUS),
    tags: Array.from(tagSet)
  };

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: response
  });
});
// @desc    Get contact by ID
// @route   GET /api/contacts/:id
// @access  Private
export const getContactById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const contact = await Contact.findByPk(id, {
    include: [
      {
        model: User,
        as: 'createdBy',
        attributes: ['id', 'first_name', 'last_name']
      },
      {
        model: Deal,
        as: 'deals',
        where: { status: 'open' },
        required: false,
        limit: 5,
        order: [['created_at', 'DESC']]
      },
      {
        model: Ticket,
        as: 'tickets',
        where: { status: { [Op.notIn]: ['closed', 'resolved'] } },
        required: false,
        limit: 5,
        order: [['created_at', 'DESC']]
      },
      {
        model: Activity,
        as: 'activities',
        where: { status: 'scheduled' },
        required: false,
        limit: 5,
        order: [['scheduled_date', 'ASC']]
      }
    ]
  });

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

  // Log view
    await createSimpleAudit(
    req.user.id,
    AUDIT_ACTIONS.VIEW,
    ENTITY_TYPES.CONTACT,
    contact.id,
    contact.fullName,
    req
  );

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { contact }
  });
});

// @desc    Update contact
// @route   PUT /api/contacts/:id
// @access  Private
export const updateContact = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const contact = await Contact.findByPk(id);

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

  // Check email uniqueness if being updated
  if (updates.email && updates.email !== contact.email) {
    const existingContact = await Contact.findOne({ where: { email: updates.email } });
    if (existingContact) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: ERROR_MESSAGES.CONFLICT('Email')
      });
    }
  }
  
  // Before updating, store old data:
  const oldContactData = {
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email,
    phone: contact.phone,
    company: contact.company,
    job_title: contact.job_title,
    status: contact.status,
    notes: contact.notes,
    tags: contact.tags
  };

  await contact.update(updates);

  // Log audit

  // After updating:
  await createDetailedAudit({
    userId: req.user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: ENTITY_TYPES.CONTACT,
    entityId: contact.id,
    entityName: contact.fullName,
    req,
    oldData: oldContactData,
    newData: {
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      job_title: contact.job_title,
      status: contact.status,
      notes: contact.notes,
      tags: contact.tags
    }
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.UPDATED('Contact'),
    data: { contact }
  });
});

// @desc    Delete contact
// @route   DELETE /api/contacts/:id
// @access  Private
export const deleteContact = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const contact = await Contact.findByPk(id);

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

  // Check for associated data
  const dealsCount = await Deal.count({ where: { contact_id: id } });
  const ticketsCount = await Ticket.count({ where: { contact_id: id } });

  if (dealsCount > 0 || ticketsCount > 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Cannot delete contact with existing deals or tickets. Reassign or delete them first.'
    });
  }

  await contact.destroy();

  // Log audit
  await createDetailedAudit({
  userId: req.user.id,
  action: AUDIT_ACTIONS.DELETE,
  entityType: ENTITY_TYPES.CONTACT,
  entityId: parseInt(id),
  entityName: contact.fullName,
  req,
  oldData: {
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email,
    phone: contact.phone,
    company: contact.company,
    job_title: contact.job_title,
    created_at: contact.created_at
  }
});

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.DELETED('Contact')
  });
});

// @desc    Import contacts
// @route   POST /api/contacts/import
// @access  Private
export const importContacts = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const { column_mapping } = req.body;
  const mapping = column_mapping ? JSON.parse(column_mapping) : null;

  const importId = uuidv4();

  // Initialize import status in Redis
  await importRedisService.setImportStatus(importId, {
    status: 'pending',
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    errors: []
  });

  // Start import process asynchronously
  processImport(req.file.path, importId, mapping, req.user.id, req).catch(async (error) => {
    console.error(`Import ${importId} failed:`, error);
    await importRedisService.updateImportProgress(importId, {
      status: 'failed',
      errors: [{ row: 0, error: error.message || 'Import failed' }]
    });
  });

  return res.status(HTTP_STATUS.ACCEPTED).json({
    success: true,
    message: SUCCESS_MESSAGES.IMPORT_STARTED,
    data: {
      import_id: importId,
      total_rows: 0,
      estimated_time: '30 seconds'
    }
  });
});

// @desc    Get import status
// @route   GET /api/contacts/import/:import_id/status
// @access  Private
export const getImportStatus = catchAsync(async (req: Request, res: Response) => {
  const { import_id } = req.params;

  const status = await importRedisService.getImportStatus(import_id);

  if (!status) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Import not found'
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: status
  });
});

// @desc    Export contacts
// @route   GET /api/contacts/export
// @access  Private
export const exportContacts = catchAsync(async (req: Request, res: Response) => {
  const { format = 'csv', fields, ...filters } = req.query;

  // Build where clause based on filters
  const whereClause: any = {};

  if (filters.status) {
    whereClause.status = filters.status;
  }

  if (filters.tag) {
    whereClause.tags = { [Op.contains]: [filters.tag] };
  }

  // Role-based filtering
  if ((req.user as any).role === 'agent') {
    whereClause.user_id = (req.user as any).id;
  }

  type ContactWithUser = Contact & { createdBy?: User };

  const contacts: ContactWithUser[] = await Contact.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'createdBy',
        attributes: ['first_name', 'last_name']
      }
    ],
    order: [['created_at', 'DESC']]
  });

  type PlainContact = Omit<ContactAttributes, 'id' | 'createdBy'> & {
    createdByFirstName?: string;
    createdByLastName?: string;
  };

  const plainContacts: PlainContact[] = contacts.map(contact => {
    const { id, createdBy, createdAt, updatedAt, ...plain } = contact.get({ plain: true }) as ContactAttributes & {
      createdBy?: { first_name: string; last_name: string };
      createdAt?: Date;
      updatedAt?: Date;
    };

    return {
      ...plain,
      createdByFirstName: createdBy?.first_name,
      createdByLastName: createdBy?.last_name
    };
  });

  const exportFields = fields ? (fields as string).split(',') : undefined;

  const exportOptions: ExportOptions = {
    format: format as ExportFormat,
    fields: exportFields
  };

  const exportData = await generateExport(plainContacts, exportOptions);

  await createSimpleAudit(
    req.user.id,
    AUDIT_ACTIONS.EXPORT,
    ENTITY_TYPES.CONTACT,
    0,
    `${contacts.length} contacts`,
    req
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: exportData
  });
});

// @desc    Add tag to contact
// @route   POST /api/contacts/:id/tags
// @access  Private
export const addTag = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { tag } = req.body;

  const contact = await Contact.findByPk(id);

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

  const currentTags = contact.tags || [];
  if (!currentTags.includes(tag)) {
    currentTags.push(tag);
    await contact.update({ tags: currentTags });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Tag added successfully',
    data: { tags: contact.tags }
  });
});

// @desc    Remove tag from contact
// @route   DELETE /api/contacts/:id/tags/:tag
// @access  Private
export const removeTag = catchAsync(async (req: Request, res: Response) => {
  const { id, tag } = req.params;

  const contact = await Contact.findByPk(id);

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

  const currentTags = contact.tags || [];
  const updatedTags = currentTags.filter(t => t !== tag);
  await contact.update({ tags: updatedTags });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Tag removed successfully',
    data: { tags: contact.tags }
  });
});

// @desc    Get all tags
// @route   GET /api/contacts/tags/all
// @access  Private
export const getAllTags = catchAsync(async (req: Request, res: Response) => {
  let whereClause: any = {};

  // Role-based filtering
  if (req.user.role === 'agent') {
    whereClause.user_id = req.user.id;
  }

  const contacts = await Contact.findAll({
    where: whereClause,
    attributes: ['tags'],
    raw: true
  });

  const tagCounts = new Map<string, number>();

  contacts.forEach(contact => {
    contact.tags?.forEach((tag: string) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  const tags = Array.from(tagCounts.entries()).map(([name, count]) => ({
    name,
    count
  })).sort((a, b) => b.count - a.count);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { tags }
  });
});

// Helper function for async import processing
async function processImport(filePath: string, importId: string, mapping: any, userId: number, _req: any) {
  try {
    // Update status to processing
    await importRedisService.updateImportProgress(importId, {
      status: 'processing'
    });

    // Parse CSV file
    const contacts = await parseCSV(filePath);
    const totalRows = contacts.length;

    // Update total rows
    await importRedisService.updateImportProgress(importId, {
      total: totalRows
    });

    // Process in batches to avoid memory issues
    const batchSize = 50;
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string }>
    };

    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);

      // Process each contact in the batch
      for (let j = 0; j < batch.length; j++) {
        const contact = batch[j];
        const rowNumber = i + j + 2; // +2 because row 1 is header

        try {
          // Validate and create contact
          await validateAndCreateContact(contact, mapping, userId);
          results.successful++;
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: error.message || 'Validation failed'
          });
        }

        // Update progress every 10 records
        if ((i + j + 1) % 10 === 0) {
          await importRedisService.updateImportProgress(importId, {
            processed: i + j + 1,
            successful: results.successful,
            failed: results.failed,
            errors: results.errors
          });
        }
      }

      // Small delay to prevent database overload
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Final update with completion status
    await importRedisService.updateImportProgress(importId, {
      status: 'completed',
      processed: totalRows,
      successful: results.successful,
      failed: results.failed,
      errors: results.errors,
      completed_at: new Date().toISOString()
    });

    // Clean up the uploaded file
    await fs.unlink(filePath).catch(console.error);

    console.log(`Import ${importId} completed:`, {
      total: totalRows,
      successful: results.successful,
      failed: results.failed
    });

    // Send notification email (optional)
    // await sendImportCompletionEmail(userId, importId, results);

  } catch (error) {
    const err = error as Error;
    console.error(`Import ${importId} failed:`, error);

    // Update status to failed
    await importRedisService.updateImportProgress(importId, {
      status: 'failed',
      errors: [{ row: 0, error: err.message || 'Import failed' }]
    });
  }
}

// Helper function to validate and create a single contact
async function validateAndCreateContact(contactData: any, mapping: any, userId: number) {
  // Apply column mapping if provided
  const mappedData = mapping ? mapContactFields(contactData, mapping) : contactData;

  // Validate required fields
  if (!mappedData.first_name || !mappedData.last_name || !mappedData.email) {
    throw new Error('Missing required fields: first_name, last_name, and email are required');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(mappedData.email)) {
    throw new Error('Invalid email format');
  }

  // Check for existing contact
  const existingContact = await Contact.findOne({
    where: { email: mappedData.email }
  });

  if (existingContact) {
    throw new Error(`Contact with email ${mappedData.email} already exists`);
  }

  // Parse tags (handle semicolon-separated tags)
  let tags: string[] = [];
  if (mappedData.tags) {
    tags = mappedData.tags.split(';').map((tag: string) => tag.trim()).filter(Boolean);
  }

  await Contact.create({
    first_name: mappedData.first_name,
    last_name: mappedData.last_name,
    email: mappedData.email,
    phone: mappedData.phone || null,
    company: mappedData.company || null,
    job_title: mappedData.job_title || null,
    status: mappedData.status || 'active',
    source: mappedData.source || 'import',
    notes: mappedData.notes || null,
    tags: tags,
    user_id: userId
  });
}

// Helper function to map CSV columns to database fields
function mapContactFields(data: any, mapping: Record<string, string>): any {
  const mapped: any = {};

  for (const [dbField, csvField] of Object.entries(mapping)) {
    mapped[dbField] = data[csvField] || data[dbField] || null;
  }

  // Include any unmapped fields that match directly
  return {
    ...data,
    ...mapped
  };
}

// @desc    Upload contact avatar
// @route   POST /api/contacts/:id/avatar
// @access  Private
export const uploadContactAvatar = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const contact = await Contact.findByPk(id);

  if (!contact) {
    // Delete uploaded file if contact not found
    await fs.unlink(req.file.path).catch(console.error);
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND('Contact')
    });
  }

  // Check permission
  if (req.user.role === 'agent' && contact.user_id !== req.user.id) {
    // Delete uploaded file if not authorized
    await fs.unlink(req.file.path).catch(console.error);
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN
    });
  }

  // Delete old avatar if exists
  if (contact.avatar) {
    const oldFilename = path.basename(contact.avatar);
    await deleteFile(oldFilename, 'AVATAR_DIR').catch(console.error);
  }

  // Update contact with new avatar URL
  const filename = req.file.filename;
  const avatarUrl = getFileUrl(filename, 'AVATAR_DIR');

  await contact.update({ avatar: avatarUrl });

  // Log audit
    await createSimpleAudit(
    req.user.id,
    AUDIT_ACTIONS.UPDATE,
    ENTITY_TYPES.CONTACT,
    contact.id,
    `${contact.fullName} - avatar updated`,
    req
  );

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Avatar uploaded successfully',
    data: { avatar: avatarUrl }
  });
});

// @desc    Delete contact avatar
// @route   DELETE /api/contacts/:id/avatar
// @access  Private
export const deleteContactAvatar = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const contact = await Contact.findByPk(id);

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

  if (contact.avatar) {
    const filename = path.basename(contact.avatar);
    await deleteFile(filename, 'AVATAR_DIR');
    await contact.update({ avatar: null });
  }

  // Log audit
    await createSimpleAudit(
    req.user.id,
    AUDIT_ACTIONS.UPDATE,
    ENTITY_TYPES.CONTACT,
    contact.id,
    `${contact.fullName} - avatar removed`,
    req
  );

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Avatar deleted successfully'
  });
});
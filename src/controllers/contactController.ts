import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Op, Order } from 'sequelize';
import { Contact, Deal, Ticket, Activity, AuditLog, User } from '../models';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES, CONTACT_STATUS, AUDIT_ACTIONS, ENTITY_TYPES } from '../config/constants';
import catchAsync from '../utils/catchAsync';
import { getPagination, getPagingData } from '../utils/pagination';
import { parseCSV, validateContactImport } from '../services/importService';
import { generateExport } from '../services/exportService';
import { v4 as uuidv4 } from 'uuid';
import { ExportFormat, ExportOptions } from '../services/exportService';

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
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.CREATE,
    entity_type: ENTITY_TYPES.CONTACT,
    entity_id: contact.id,
    details: `Created contact: ${contact.fullName}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
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
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.VIEW,
    entity_type: ENTITY_TYPES.CONTACT,
    entity_id: contact.id,
    details: `Viewed contact: ${contact.fullName}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

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

  await contact.update(updates);

  // Log audit
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity_type: ENTITY_TYPES.CONTACT,
    entity_id: contact.id,
    details: `Updated contact: ${contact.fullName}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
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
  await AuditLog.create({
    user_id: req.user.id,
    action: AUDIT_ACTIONS.DELETE,
    entity_type: ENTITY_TYPES.CONTACT,
    entity_id: parseInt(id),
    details: `Deleted contact: ${contact.fullName}`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
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

  // Start import process asynchronously
  processImport(req.file.path, importId, mapping, req.user.id, req).catch(console.error);

  return res.status(HTTP_STATUS.ACCEPTED).json({
    success: true,
    message: SUCCESS_MESSAGES.IMPORT_STARTED,
    data: {
      import_id: importId,
      total_rows: 0, // Will be updated during processing
      estimated_time: '30 seconds'
    }
  });
});

// @desc    Get import status
// @route   GET /api/contacts/import/:import_id/status
// @access  Private
export const getImportStatus = catchAsync(async (req: Request, res: Response) => {
  const { import_id } = req.params;

  // In a real implementation, you'd store import status in Redis or database
  // For now, return mock data
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      import_id,
      status: 'completed',
      total: 150,
      processed: 150,
      successful: 145,
      failed: 5,
      errors: [
        { row: 12, error: 'Invalid email format' },
        { row: 45, error: 'Missing required field' }
      ],
      completed_at: new Date().toISOString()
    }
  });
});

// @desc    Export contacts
// @route   GET /api/contacts/export
// @access  Private
export const exportContacts = catchAsync(async (req: Request, res: Response) => {
  const { format = 'csv', fields, ...filters } = req.query;

  // Build where clause based on filters
  let whereClause: any = {};

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

  const contacts = await Contact.findAll({
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

  // Parse fields to export - ensure it's never null
  const exportFields = fields ? (fields as string).split(',') : undefined;

  // Create properly typed options object
  const exportOptions: ExportOptions = {
    format: format as ExportFormat, // Cast to the correct enum/type
    fields: exportFields // Now this is string[] | undefined, not null
  };

  const exportData = await generateExport(contacts, exportOptions);

  // Log audit
  await AuditLog.create({
    user_id: (req.user as any).id,
    action: AUDIT_ACTIONS.EXPORT,
    entity_type: ENTITY_TYPES.CONTACT,
    entity_id: 0,
    details: `Exported ${contacts.length} contacts`,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  });

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
async function processImport(filePath: string, importId: string, mapping: any, userId: number, req: any) {
  try {
    const contacts = await parseCSV(filePath);
    const validationResults = await validateContactImport(contacts, mapping, userId);

    // Store results (in production, use Redis or database)
    // For now, just log
    console.log(`Import ${importId} completed:`, validationResults);

    // Send notification email
    // await sendImportCompletionEmail(userId, importId, validationResults);
  } catch (error) {
    console.error(`Import ${importId} failed:`, error);
  }
}
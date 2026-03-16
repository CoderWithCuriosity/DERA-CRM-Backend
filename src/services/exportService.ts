import { Parser } from 'json2csv';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { file as fileConfig } from '../config/environment';
import { FILE_UPLOAD } from '../config/constants';
import AppError from '../utils/AppError';
import { HTTP_STATUS } from '../config/constants';

/**
 * Export format options
 */
export type ExportFormat = 'csv' | 'excel' | 'json';

/**
 * Export options interface
 */
export interface ExportOptions {
  format: ExportFormat;
  fields?: string[];
  filename?: string;
  includeHeaders?: boolean;
  delimiter?: string;
}

/**
 * Generate export file
 */
export const generateExport = async (
  data: any[],
  options: ExportOptions
): Promise<{ filename: string; url: string; path: string }> => {
  const {
    format = 'csv',
    fields,
    filename: customFilename,
    includeHeaders = true,
    delimiter = ','
  } = options;

  const fileExtension = format === 'excel' ? 'xlsx' : format;

  // Generate filename
  const timestamp = Date.now();
  const uniqueId = uuidv4().split('-')[0];
  const filename = customFilename || `export-${timestamp}-${uniqueId}.${fileExtension}`;

  console.log(filename);
  
  // Ensure export directory exists
  const exportDir = path.join(process.cwd(), fileConfig.uploadDir, FILE_UPLOAD.EXPORT_DIR);
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const filePath = path.join(exportDir, filename);

  // Generate file based on format
  switch (format) {
    case 'csv':
      await generateCSV(data, filePath, { fields, includeHeaders, delimiter });
      break;
    case 'excel':
      await generateExcel(data, filePath, { fields, includeHeaders });
      break;
    case 'json':
      await generateJSON(data, filePath, { fields });
      break;
    default:
      throw new AppError(`Unsupported export format: ${format}`, HTTP_STATUS.BAD_REQUEST);
  }

  // Generate URL
  const baseUrl = process.env.SERVER_URL || 'http://localhost:5000';
  const url = `${baseUrl}/${fileConfig.uploadDir}/${FILE_UPLOAD.EXPORT_DIR}/${filename}`;

  return {
    filename,
    url,
    path: filePath
  };
};

/**
 * Generate CSV file
 */
/**
 * Safely extract error message from unknown error
 */
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'Unknown error occurred';
};

export const generateCSV = async (
  data: any[],
  filePath: string,
  options: {
    fields?: string[];
    includeHeaders?: boolean;
    delimiter?: string;
  }
): Promise<void> => {
  const { fields, includeHeaders = true, delimiter = ',' } = options;

  // If fields not specified, extract from first data item
  const exportFields = fields || (data.length > 0 ? Object.keys(data[0]) : []);

  // Create parser options
  const parserOptions: any = {
    fields: exportFields,
    delimiter,
    header: includeHeaders
  };

  try {
    const parser = new Parser(parserOptions);
    const csv = parser.parse(data);
    await fs.promises.writeFile(filePath, csv);
  } catch (error) {
    throw new AppError(
      `Failed to generate CSV: ${getErrorMessage(error)}`, 
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Generate Excel file
 */
export const generateExcel = async (
  data: any[],
  filePath: string,
  options: {
    fields?: string[];
    includeHeaders?: boolean;
  }
): Promise<void> => {
  const { fields, includeHeaders = true } = options;

  // Prepare data for export
  let exportData = data;

  if (fields) {
    exportData = data.map(item => {
      const newItem: any = {};
      fields.forEach(field => {
        newItem[field] = item[field];
      });
      return newItem;
    });
  }

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData, {
    header: fields,
    skipHeader: !includeHeaders
  });

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  // Write to file
  XLSX.writeFile(workbook, filePath);
};

/**
 * Generate JSON file
 */
export const generateJSON = async (
  data: any[],
  filePath: string,
  options: {
    fields?: string[];
  }
): Promise<void> => {
  const { fields } = options;

  let exportData = data;

  if (fields) {
    exportData = data.map(item => {
      const newItem: any = {};
      fields.forEach(field => {
        newItem[field] = item[field];
      });
      return newItem;
    });
  }

  await fs.promises.writeFile(filePath, JSON.stringify(exportData, null, 2));
};

/**
 * Export contacts
 */
export const exportContacts = async (
  contacts: any[],
  format: ExportFormat = 'csv'
): Promise<any> => {
  const fields = [
    'id',
    'first_name',
    'last_name',
    'email',
    'phone',
    'company',
    'job_title',
    'status',
    'source',
    'tags',
    'created_at',
    'updated_at'
  ];

  return generateExport(contacts, {
    format,
    fields,
    filename: `contacts-export-${Date.now()}.${format}`
  });
};

/**
 * Export deals
 */
export const exportDeals = async (
  deals: any[],
  format: ExportFormat = 'csv'
): Promise<any> => {
  const fields = [
    'id',
    'name',
    'contact_id',
    'contact_name',
    'stage',
    'amount',
    'probability',
    'expected_close_date',
    'actual_close_date',
    'status',
    'notes',
    'created_at',
    'updated_at'
  ];

  // Enrich deals with contact name
  const enrichedDeals = deals.map(deal => ({
    ...deal.toJSON(),
    contact_name: deal.contact ? `${deal.contact.first_name} ${deal.contact.last_name}` : ''
  }));

  return generateExport(enrichedDeals, {
    format,
    fields,
    filename: `deals-export-${Date.now()}.${format}`
  });
};

/**
 * Export tickets
 */
export const exportTickets = async (
  tickets: any[],
  format: ExportFormat = 'csv'
): Promise<any> => {
  const fields = [
    'id',
    'ticket_number',
    'subject',
    'description',
    'contact_name',
    'assigned_to',
    'priority',
    'status',
    'due_date',
    'resolved_at',
    'created_at',
    'updated_at'
  ];

  // Enrich tickets with contact name
  const enrichedTickets = tickets.map(ticket => ({
    ...ticket.toJSON(),
    contact_name: ticket.contact ? `${ticket.contact.first_name} ${ticket.contact.last_name}` : '',
    assigned_to: ticket.assignedTo ? `${ticket.assignedTo.first_name} ${ticket.assignedTo.last_name}` : ''
  }));

  return generateExport(enrichedTickets, {
    format,
    fields,
    filename: `tickets-export-${Date.now()}.${format}`
  });
};

/**
 * Export users
 */
export const exportUsers = async (
  users: any[],
  format: ExportFormat = 'csv'
): Promise<any> => {
  const fields = [
    'id',
    'first_name',
    'last_name',
    'email',
    'role',
    'is_verified',
    'last_login',
    'created_at'
  ];

  return generateExport(users, {
    format,
    fields,
    filename: `users-export-${Date.now()}.${format}`
  });
};

/**
 * Export campaigns
 */
export const exportCampaigns = async (
  campaigns: any[],
  format: ExportFormat = 'csv'
): Promise<any> => {
  const fields = [
    'id',
    'name',
    'template_name',
    'status',
    'target_count',
    'sent_count',
    'open_count',
    'click_count',
    'open_rate',
    'click_rate',
    'scheduled_at',
    'sent_at',
    'created_at'
  ];

  // Enrich campaigns with template name
  const enrichedCampaigns = campaigns.map(campaign => ({
    ...campaign.toJSON(),
    template_name: campaign.template?.name || '',
    open_rate: campaign.openRate,
    click_rate: campaign.clickRate
  }));

  return generateExport(enrichedCampaigns, {
    format,
    fields,
    filename: `campaigns-export-${Date.now()}.${format}`
  });
};

/**
 * Export activities
 */
export const exportActivities = async (
  activities: any[],
  format: ExportFormat = 'csv'
): Promise<any> => {
  const fields = [
    'id',
    'type',
    'subject',
    'description',
    'contact_name',
    'deal_name',
    'user_name',
    'scheduled_date',
    'completed_date',
    'status',
    'outcome',
    'created_at'
  ];

  // Enrich activities with related data
  const enrichedActivities = activities.map(activity => ({
    ...activity.toJSON(),
    contact_name: activity.contact ? `${activity.contact.first_name} ${activity.contact.last_name}` : '',
    deal_name: activity.deal?.name || '',
    user_name: activity.user ? `${activity.user.first_name} ${activity.user.last_name}` : ''
  }));

  return generateExport(enrichedActivities, {
    format,
    fields,
    filename: `activities-export-${Date.now()}.${format}`
  });
};

/**
 * Clean up old export files
 */
export const cleanupOldExports = async (maxAge: number = 24 * 60 * 60 * 1000): Promise<number> => {
  const exportDir = path.join(process.cwd(), fileConfig.uploadDir, FILE_UPLOAD.EXPORT_DIR);
  
  if (!fs.existsSync(exportDir)) {
    return 0;
  }

  const files = await fs.promises.readdir(exportDir);
  const now = Date.now();
  let deleted = 0;

  for (const file of files) {
    const filePath = path.join(exportDir, file);
    const stats = await fs.promises.stat(filePath);
    const age = now - stats.mtimeMs;

    if (age > maxAge) {
      await fs.promises.unlink(filePath);
      deleted++;
    }
  }

  return deleted;
};
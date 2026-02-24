import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { v4 as uuidv4 } from 'uuid';
import { Contact } from '../models';
import { file as fileConfig } from '../config/environment';
import { FILE_UPLOAD } from '../config/constants';
import AppError from '../utils/AppError';
import { HTTP_STATUS } from '../config/constants';
import logger from '../config/logger';
import * as XLSX from 'xlsx';

/**
 * Import result interface
 */
export interface ImportResult {
  import_id: string;
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  completed_at?: Date;
}

/**
 * Parse CSV file
 */
export const parseCSV = async (filePath: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

/**
 * Parse Excel file
 */
export const parseExcel = async (filePath: string): Promise<any[]> => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
};

/**
 * Validate contact import data
 */
export const validateContactImport = async (
  data: any[],
  mapping: any,
  userId: number
): Promise<ImportResult> => {
  const importId = uuidv4();
  const result: ImportResult = {
    import_id: importId,
    total: data.length,
    processed: 0,
    successful: 0,
    failed: 0,
    errors: []
  };

  // Process in batches
  const batchSize = 100;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (row, index) => {
        const rowNumber = i + index + 2; // +2 for header row and 1-based index
        
        try {
          // Map fields if mapping provided
          const contactData = mapping ? mapFields(row, mapping) : row;

          // Validate required fields
          if (!contactData.first_name || !contactData.last_name || !contactData.email) {
            throw new Error('Missing required fields (first_name, last_name, email)');
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(contactData.email)) {
            throw new Error('Invalid email format');
          }

          // Check for existing contact
          const existingContact = await Contact.findOne({
            where: { email: contactData.email }
          });

          if (existingContact) {
            throw new Error('Contact with this email already exists');
          }

          // Prepare contact data
          const contact = {
            first_name: contactData.first_name,
            last_name: contactData.last_name,
            email: contactData.email,
            phone: contactData.phone || null,
            company: contactData.company || null,
            job_title: contactData.job_title || null,
            status: contactData.status || 'active',
            source: contactData.source || 'import',
            notes: contactData.notes || null,
            tags: contactData.tags ? contactData.tags.split(',').map((t: string) => t.trim()) : [],
            user_id: userId
          };

          // Create contact
          await Contact.create(contact);
          
          result.successful++;
        } catch (error) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            error: error.message
          });
        } finally {
          result.processed++;
        }
      })
    );
  }

  result.completed_at = new Date();

  // Log import results
  logger.info(`Import ${importId} completed: ${result.successful} successful, ${result.failed} failed`);

  return result;
};

/**
 * Map fields based on column mapping
 */
const mapFields = (row: any, mapping: any): any => {
  const mapped: any = {};
  
  Object.entries(mapping).forEach(([field, column]) => {
    if (column && row[column as string]) {
      mapped[field] = row[column as string];
    }
  });

  return mapped;
};

/**
 * Process import file
 */
export const processImport = async (
  filePath: string,
  importId: string,
  mapping: any,
  userId: number,
  entityType: string = 'contact'
): Promise<ImportResult> => {
  try {
    // Determine file type from extension
    const extension = path.extname(filePath).toLowerCase();
    let data: any[];

    if (extension === '.csv') {
      data = await parseCSV(filePath);
    } else if (extension === '.xlsx' || extension === '.xls') {
      data = await parseExcel(filePath);
    } else {
      throw new Error('Unsupported file format');
    }

    // Validate based on entity type
    let result: ImportResult;
    switch (entityType) {
      case 'contact':
        result = await validateContactImport(data, mapping, userId);
        break;
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }

    return result;
  } catch (error) {
    logger.error(`Import ${importId} failed:`, error);
    throw error;
  } finally {
    // Clean up import file
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      logger.error('Failed to delete import file:', error);
    }
  }
};

/**
 * Validate CSV headers
 */
export const validateHeaders = (
  headers: string[],
  requiredFields: string[]
): { valid: boolean; missing: string[] } => {
  const missing = requiredFields.filter(field => !headers.includes(field));
  return {
    valid: missing.length === 0,
    missing
  };
};

/**
 * Get sample template
 */
export const getImportTemplate = (entityType: string): any[] => {
  switch (entityType) {
    case 'contact':
      return [{
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        company: 'Acme Inc',
        job_title: 'Manager',
        status: 'active',
        source: 'import',
        tags: 'customer,lead'
      }];
    default:
      return [];
  }
};

/**
 * Generate error report
 */
export const generateErrorReport = (errors: Array<{ row: number; error: string }>): string => {
  let report = 'Row,Error\n';
  errors.forEach(({ row, error }) => {
    report += `${row},"${error}"\n`;
  });
  return report;
};

/**
 * Save import results
 */
export const saveImportResults = async (
  importId: string,
  result: ImportResult
): Promise<string> {
  const resultsDir = path.join(process.cwd(), fileConfig.uploadDir, FILE_UPLOAD.IMPORT_DIR, 'results');
  
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const filePath = path.join(resultsDir, `${importId}.json`);
  await fs.promises.writeFile(filePath, JSON.stringify(result, null, 2));

  return filePath;
};

/**
 * Get import results
 */
export const getImportResults = async (importId: string): Promise<ImportResult | null> => {
  const filePath = path.join(
    process.cwd(),
    fileConfig.uploadDir,
    FILE_UPLOAD.IMPORT_DIR,
    'results',
    `${importId}.json`
  );

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const data = await fs.promises.readFile(filePath, 'utf-8');
  return JSON.parse(data);
};

/**
 * Clean up old import results
 */
export const cleanupOldImports = async (maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> => {
  const resultsDir = path.join(process.cwd(), fileConfig.uploadDir, FILE_UPLOAD.IMPORT_DIR, 'results');
  
  if (!fs.existsSync(resultsDir)) {
    return 0;
  }

  const files = await fs.promises.readdir(resultsDir);
  const now = Date.now();
  let deleted = 0;

  for (const file of files) {
    const filePath = path.join(resultsDir, file);
    const stats = await fs.promises.stat(filePath);
    const age = now - stats.mtimeMs;

    if (age > maxAge) {
      await fs.promises.unlink(filePath);
      deleted++;
    }
  }

  return deleted;
};
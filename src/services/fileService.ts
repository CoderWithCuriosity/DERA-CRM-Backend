import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { file as fileConfig } from '../config/environment';
import { FILE_UPLOAD } from '../config/constants';
import AppError from '../utils/AppError';
import { HTTP_STATUS } from '../config/constants';

/**
 * File upload result interface
 */
export interface FileUploadResult {
  filename: string;
  path: string;
  url: string;
  size: number;
  mimetype: string;
  originalname: string;
}

/**
 * Ensure directory exists
 */
export const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Generate unique filename
 */
export const generateFilename = (originalname: string, prefix: string = 'file'): string => {
  const extension = path.extname(originalname);
  const timestamp = Date.now();
  const uniqueId = uuidv4().split('-')[0];
  return `${prefix}-${timestamp}-${uniqueId}${extension}`;
};

/**
 * Get file path
 */
export const getFilePath = (filename: string, type: keyof typeof FILE_UPLOAD): string => {
  const dir = FILE_UPLOAD[type];
  return path.join(process.cwd(), fileConfig.uploadDir, dir, filename);
};

/**
 * Get file URL
 */
export const getFileUrl = (filename: string, type: keyof typeof FILE_UPLOAD): string => {
  const baseUrl = process.env.SERVER_URL || 'http://localhost:5000';
  const dir = FILE_UPLOAD[type];
  return `${baseUrl}/${fileConfig.uploadDir}/${dir}/${filename}`;
};

/**
 * Save file
 */
export const saveFile = async (
  file: Express.Multer.File,
  type: keyof typeof FILE_UPLOAD,
  options?: {
    prefix?: string;
    process?: boolean;
    width?: number;
    height?: number;
  }
): Promise<FileUploadResult> => {
  const { prefix = 'file', process = false, width, height } = options || {};

  const filename = generateFilename(file.originalname, prefix);
  const dir = FILE_UPLOAD[type];
  const uploadDir = path.join(process.cwd(), fileConfig.uploadDir, dir);
  const filePath = path.join(uploadDir, filename);

  ensureDirectoryExists(uploadDir);

  // Process image if requested
  if (process && file.mimetype.startsWith('image/')) {
    let pipeline = sharp(file.buffer || file.path);

    if (width || height) {
      pipeline = pipeline.resize(width, height, {
        fit: 'cover',
        withoutEnlargement: true
      });
    }

    await pipeline.toFile(filePath);
  } else {
    // Save file as is
    if (file.buffer) {
      await fs.promises.writeFile(filePath, file.buffer);
    } else {
      await fs.promises.copyFile(file.path, filePath);
    }
  }

  return {
    filename,
    path: filePath,
    url: getFileUrl(filename, type),
    size: file.size,
    mimetype: file.mimetype,
    originalname: file.originalname
  };
};

/**
 * Delete file
 */
export const deleteFile = async (filename: string, type: keyof typeof FILE_UPLOAD): Promise<boolean> => {
  try {
    const filePath = getFilePath(filename, type);
    
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Delete multiple files
 */
export const deleteFiles = async (filenames: string[], type: keyof typeof FILE_UPLOAD): Promise<number> => {
  let deleted = 0;
  
  for (const filename of filenames) {
    const success = await deleteFile(filename, type);
    if (success) deleted++;
  }
  
  return deleted;
};

/**
 * Get file info
 */
export const getFileInfo = async (filename: string, type: keyof typeof FILE_UPLOAD): Promise<any> => {
  const filePath = getFilePath(filename, type);
  
  if (!fs.existsSync(filePath)) {
    throw new AppError('File not found', HTTP_STATUS.NOT_FOUND);
  }

  const stats = await fs.promises.stat(filePath);
  
  return {
    filename,
    path: filePath,
    url: getFileUrl(filename, type),
    size: stats.size,
    created_at: stats.birthtime,
    modified_at: stats.mtime
  };
};

/**
 * List files
 */
export const listFiles = async (type: keyof typeof FILE_UPLOAD): Promise<any[]> => {
  const dir = FILE_UPLOAD[type];
  const uploadDir = path.join(process.cwd(), fileConfig.uploadDir, dir);
  
  if (!fs.existsSync(uploadDir)) {
    return [];
  }

  const files = await fs.promises.readdir(uploadDir);
  const fileInfos = [];

  for (const file of files) {
    const filePath = path.join(uploadDir, file);
    const stats = await fs.promises.stat(filePath);
    
    if (stats.isFile()) {
      fileInfos.push({
        filename: file,
        url: getFileUrl(file, type),
        size: stats.size,
        created_at: stats.birthtime,
        modified_at: stats.mtime
      });
    }
  }

  return fileInfos;
};

/**
 * Process image
 */
export const processImage = async (
  inputPath: string,
  outputPath: string,
  options: {
    width?: number;
    height?: number;
    fit?: keyof sharp.FitEnum;
    format?: keyof sharp.FormatEnum;
    quality?: number;
  } = {}
): Promise<string> => {
  const {
    width,
    height,
    fit = 'cover',
    format = 'jpeg',
    quality = 80
  } = options;

  let pipeline = sharp(inputPath);

  if (width || height) {
    pipeline = pipeline.resize(width, height, { fit });
  }

  pipeline = pipeline[format]({ quality });

  await pipeline.toFile(outputPath);

  return outputPath;
};

/**
 * Validate file type
 */
export const validateFileType = (mimetype: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(mimetype);
};

/**
 * Validate file size
 */
export const validateFileSize = (size: number, maxSize: number): boolean => {
  return size <= maxSize;
};

/**
 * Get file extension
 */
export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase();
};

/**
 * Get file mime type from extension
 */
export const getMimeType = (extension: string): string => {
  const mimeTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.csv': 'text/csv',
    '.txt': 'text/plain'
  };

  return mimeTypes[extension] || 'application/octet-stream';
};

/**
 * Clean up old files
 */
export const cleanupOldFiles = async (
  type: keyof typeof FILE_UPLOAD,
  maxAge: number = 24 * 60 * 60 * 1000
): Promise<number> => {
  const dir = FILE_UPLOAD[type];
  const uploadDir = path.join(process.cwd(), fileConfig.uploadDir, dir);
  
  if (!fs.existsSync(uploadDir)) {
    return 0;
  }

  const files = await fs.promises.readdir(uploadDir);
  const now = Date.now();
  let deleted = 0;

  for (const file of files) {
    const filePath = path.join(uploadDir, file);
    const stats = await fs.promises.stat(filePath);
    const age = now - stats.mtimeMs;

    if (age > maxAge) {
      await fs.promises.unlink(filePath);
      deleted++;
    }
  }

  return deleted;
};

/**
 * Create thumbnail
 */
export const createThumbnail = async (
  inputPath: string,
  outputPath: string,
  width: number = 200,
  height: number = 200
): Promise<string> => {
  return processImage(inputPath, outputPath, {
    width,
    height,
    fit: 'cover',
    format: 'jpeg',
    quality: 70
  });
};

/**
 * Move file
 */
export const moveFile = async (sourcePath: string, destinationPath: string): Promise<void> => {
  await fs.promises.rename(sourcePath, destinationPath);
};

/**
 * Copy file
 */
export const copyFile = async (sourcePath: string, destinationPath: string): Promise<void> => {
  await fs.promises.copyFile(sourcePath, destinationPath);
};

/**
 * Get file size in readable format
 */
export const getReadableFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
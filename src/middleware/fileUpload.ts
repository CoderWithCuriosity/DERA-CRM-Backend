import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { file as fileConfig } from '../config/environment';
import { HTTP_STATUS, ERROR_MESSAGES, FILE_UPLOAD } from '../config/constants';
import AppError from '../utils/AppError';

// Ensure upload directories exist
const createUploadDir = (dir: string) => {
  const fullPath = path.join(process.cwd(), fileConfig.uploadDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return fullPath;
};

// Create all required directories
const avatarDir = createUploadDir(FILE_UPLOAD.AVATAR_DIR);
const logoDir = createUploadDir(FILE_UPLOAD.LOGO_DIR);
const attachmentDir = createUploadDir(FILE_UPLOAD.ATTACHMENT_DIR);
const importDir = createUploadDir(FILE_UPLOAD.IMPORT_DIR);
const exportDir = createUploadDir(FILE_UPLOAD.EXPORT_DIR);

/**
 * File filter function
 */
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (fileConfig.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type', HTTP_STATUS.BAD_REQUEST));
  }
};

/**
 * Generate unique filename
 */
const generateFilename = (prefix: string, originalname: string) => {
  const extension = path.extname(originalname);
  const timestamp = Date.now();
  const uniqueId = uuidv4().split('-')[0];
  return `${prefix}-${timestamp}-${uniqueId}${extension}`;
};

/**
 * Avatar upload configuration
 */
export const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, avatarDir);
    },
    filename: (_req, file, cb) => {
      const filename = generateFilename(FILE_UPLOAD.AVATAR_PREFIX, file.originalname);
      cb(null, filename);
    }
  }),
  fileFilter,
  limits: {
    fileSize: fileConfig.avatarMaxSize
  }
});

/**
 * Logo upload configuration
 */
export const logoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, logoDir);
    },
    filename: (_req, file, cb) => {
      const filename = generateFilename(FILE_UPLOAD.LOGO_PREFIX, file.originalname);
      cb(null, filename);
    }
  }),
  fileFilter,
  limits: {
    fileSize: fileConfig.logoMaxSize
  }
});

/**
 * Attachment upload configuration
 */
export const attachmentUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, attachmentDir);
    },
    filename: (_req, file, cb) => {
      const filename = generateFilename('attachment', file.originalname);
      cb(null, filename);
    }
  }),
  fileFilter,
  limits: {
    fileSize: fileConfig.maxFileSize
  }
});

/**
 * Import file upload configuration
 */
export const importUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, importDir);
    },
    filename: (_req, file, cb) => {
      const filename = generateFilename(FILE_UPLOAD.IMPORT_PREFIX, file.originalname);
      cb(null, filename);
    }
  }),
  fileFilter: (_req, file, cb) => {
    const allowedImportTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (allowedImportTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Only CSV and Excel files are allowed.', HTTP_STATUS.BAD_REQUEST));
    }
  },
  limits: {
    fileSize: fileConfig.importMaxSize
  }
});

/**
 * Multiple file upload
 */
export const multipleUpload = (fieldName: string, maxCount: number = 5) => {
  return multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, attachmentDir);
      },
      filename: (_req, file, cb) => {
        const filename = generateFilename('multiple', file.originalname);
        cb(null, filename);
      }
    }),
    fileFilter,
    limits: {
      fileSize: fileConfig.maxFileSize,
      files: maxCount
    }
  }).array(fieldName, maxCount);
};

/**
 * Process image with sharp
 */

// Define the exact formats that have methods (note: 'jpg' is NOT a method)
type SharpOutputFormat = 'jpeg' | 'png' | 'webp' | 'gif' | 'avif' | 'tiff';

export const processImage = async (
  filePath: string,
  options: {
    width?: number;
    height?: number;
    fit?: keyof sharp.FitEnum;
    format?: SharpOutputFormat;  // Only formats that are actual methods
    quality?: number;
  } = {}
): Promise<string> => {
  const {
    width = 800,
    height = 800,
    fit = 'cover',
    format = 'jpeg',
    quality = 80
  } = options;

  // For file extension, we can use 'jpg' instead of 'jpeg' if desired
  const fileExtension = format === 'jpeg' ? 'jpg' : format;
  
  const dir = path.dirname(filePath);
  const filename = path.basename(filePath, path.extname(filePath));
  const outputPath = path.join(dir, `processed-${filename}.${fileExtension}`);

  // Use the format directly as the method name (always use 'jpeg', never 'jpg')
  await sharp(filePath)
    .resize(width, height, { fit })
    [format]({ quality })  // format is always a valid method name now
    .toFile(outputPath);

  // Replace original with processed
  fs.unlinkSync(filePath);
  fs.renameSync(outputPath, filePath);

  return filePath;
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
 * Delete file
 */
export const deleteFile = async (filename: string, type: keyof typeof FILE_UPLOAD): Promise<boolean> => {
  try {
    const dir = FILE_UPLOAD[type];
    const filePath = path.join(process.cwd(), fileConfig.uploadDir, dir, filename);
    
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
 * Cleanup old files
 */
export const cleanupOldFiles = async (type: keyof typeof FILE_UPLOAD, maxAge: number = 24 * 60 * 60 * 1000) => {
  try {
    const dir = FILE_UPLOAD[type];
    const dirPath = path.join(process.cwd(), fileConfig.uploadDir, dir);
    const files = await fs.promises.readdir(dirPath);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.promises.stat(filePath);
      const age = now - stats.mtimeMs;

      if (age > maxAge) {
        await fs.promises.unlink(filePath);
        console.log(`Deleted old file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up files:', error);
  }
};

/**
 * File upload error handler
 */
export const handleUploadError = (err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.FILE_TOO_LARGE
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Too many files'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Unexpected field'
      });
    }
  }
  
  if (err.message === 'Invalid file type') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.INVALID_FILE_TYPE
    });
  }

  return next(err);
};

/**
 * Validate file type
 */
export const validateFileType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next();
    }

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Validate file size
 */
export const validateFileSize = (maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next();
    }

    if (req.file.size > maxSize) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`
      });
    }

    next();
  };
};

export {
  avatarDir,
  logoDir,
  attachmentDir,
  importDir,
  exportDir
};
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { file as fileConfig } from './environment';
import { FILE_UPLOAD } from './constants';
import { v4 as uuidv4 } from 'uuid';

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

// File filter function
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (fileConfig.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

// Generate unique filename
const generateFilename = (prefix: string, originalname: string) => {
  const extension = path.extname(originalname);
  const timestamp = Date.now();
  const uniqueId = uuidv4().split('-')[0];
  return `${prefix}-${timestamp}-${uniqueId}${extension}`;
};

// Avatar upload configuration
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

// Logo upload configuration
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

// Attachment upload configuration
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

// Import file upload configuration
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
    const allowedImportTypes = ['text/csv', 'application/vnd.ms-excel'];
    if (allowedImportTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV files are allowed.'));
    }
  },
  limits: {
    fileSize: fileConfig.importMaxSize
  }
});

// Get file URL
export const getFileUrl = (filename: string, type: keyof typeof FILE_UPLOAD) => {
  const baseUrl = process.env.SERVER_URL || 'http://localhost:3000';
  const dir = FILE_UPLOAD[type];
  return `${baseUrl}/${fileConfig.uploadDir}/${dir}/${filename}`;
};

// Delete file
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

// Cleanup old files
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

export {
  avatarDir,
  logoDir,
  attachmentDir,
  importDir,
  exportDir
};
import { UserAttributes } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: UserAttributes;
      requestId?: string;
      startTime?: number;
      resource?: any;
      file?: Express.Multer.File;
      files?: Express.Multer.File[];
    }

    interface User extends UserAttributes {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      role: string;
      is_verified: boolean;
    }
  }
}
    
// Multer file type
declare namespace Express {
  namespace Multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination: string;
      filename: string;
      path: string;
      buffer: Buffer;
    }
  }
}

export {};
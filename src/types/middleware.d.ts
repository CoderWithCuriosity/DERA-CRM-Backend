import { Request, Response, NextFunction } from 'express';
import { UserInstance } from './models';

// Auth Middleware Types
export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
  type?: 'access' | 'refresh' | 'verification' | 'reset';
  iat?: number;
  exp?: number;
}

export interface AuthMiddleware {
  protect(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
  optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
  restrictTo(...roles: string[]): (req: Request, res: Response, next: NextFunction) => void;
  hasPermission(permission: string): (req: Request, res: Response, next: NextFunction) => Promise<void>;
  checkOwnership(model: any, paramName?: string): (req: Request, res: Response, next: NextFunction) => Promise<void>;
  apiKeyAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
}

// Role Check Middleware Types
export interface RoleCheckMiddleware {
  isAdmin(req: Request, res: Response, next: NextFunction): void | Response;
  isManagerOrAdmin(req: Request, res: Response, next: NextFunction): void | Response;
  isAgentOrHigher(req: Request, res: Response, next: NextFunction): void | Response;
  hasRole(role: string): (req: Request, res: Response, next: NextFunction) => void | Response;
  hasAnyRole(roles: string[]): (req: Request, res: Response, next: NextFunction) => void | Response;
  isOwnData(paramName?: string): (req: Request, res: Response, next: NextFunction) => void | Response;
  canManageUsers(req: Request, res: Response, next: NextFunction): void | Response;
  canDelete(req: Request, res: Response, next: NextFunction): void | Response;
  canExport(req: Request, res: Response, next: NextFunction): void | Response;
  canImport(req: Request, res: Response, next: NextFunction): void | Response;
}

// Validation Middleware Types
export interface ValidationMiddleware {
  validate(req: Request, res: Response, next: NextFunction): void | Response;
  validateBody(schema: any): (req: Request, res: Response, next: NextFunction) => void | Response;
  validateQuery(schema: any): (req: Request, res: Response, next: NextFunction) => void | Response;
  validateParams(schema: any): (req: Request, res: Response, next: NextFunction) => void | Response;
  validateChain(validations: any[]): (req: Request, res: Response, next: NextFunction) => Promise<void | Response>;
  sanitizeBody(fields: string[]): (req: Request, res: Response, next: NextFunction) => void;
  isValidEmail(email: string): boolean;
  isValidPhone(phone: string): boolean;
  isValidUrl(url: string): boolean;
  isValidDate(date: string): boolean;
  isStrongPassword(password: string): boolean;
}

// Error Handler Types
export interface ErrorHandlerMiddleware {
  errorHandler(err: Error, req: Request, res: Response, next: NextFunction): Response;
  notFound(req: Request, res: Response, next: NextFunction): void;
  catchAsync(fn: Function): (req: Request, res: Response, next: NextFunction) => Promise<void>;
  handleUnhandledRejection(server: any): void;
  handleUncaughtException(): void;
}

// Rate Limiter Types
export interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
}

export interface RateLimiterMiddleware {
  apiLimiter: any;
  authLimiter: any;
  campaignLimiter: any;
  uploadLimiter: any;
  exportLimiter: any;
  createRateLimiter(windowMs: number, max: number, message: string, keyGenerator?: (req: Request) => string): any;
  ipLimiter: any;
  userLimiter: any;
  concurrentLimiter(maxConcurrent?: number): (req: Request, res: Response, next: NextFunction) => void | Response;
  addRateLimitHeaders(req: Request, res: Response, next: NextFunction): void;
}

// File Upload Middleware Types
export interface FileUploadMiddleware {
  avatarUpload: any;
  logoUpload: any;
  attachmentUpload: any;
  importUpload: any;
  multipleUpload(fieldName: string, maxCount?: number): any;
  processImage(filePath: string, options?: any): Promise<string>;
  getFileUrl(filename: string, type: string): string;
  deleteFile(filename: string, type: string): Promise<boolean>;
  cleanupOldFiles(type: string, maxAge?: number): Promise<number>;
  handleUploadError(err: any, req: Request, res: Response, next: NextFunction): void | Response;
  validateFileType(allowedTypes: string[]): (req: Request, res: Response, next: NextFunction) => void | Response;
  validateFileSize(maxSize: number): (req: Request, res: Response, next: NextFunction) => void | Response;
}

// Logger Middleware Types
export interface LogEntry {
  message: string;
  level: string;
  timestamp: Date;
  requestId?: string;
  userId?: number;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: string;
  ip?: string;
  userAgent?: string;
}

export interface LoggerMiddleware {
  addRequestId(req: Request, res: Response, next: NextFunction): void;
  logRequestStart(req: Request, res: Response, next: NextFunction): void;
  logRequestComplete(req: Request, res: Response, next: NextFunction): void;
  morganMiddleware: any;
  logError(err: Error, req: Request, res: Response, next: NextFunction): void;
  logDatabaseQuery(query: string, duration: number): void;
  logAuth(action: string, userId: number | null, success: boolean, req: Request): void;
  logApiUsage(req: Request, res: Response, next: NextFunction): void;
  logPerformance(threshold?: number): (req: Request, res: Response, next: NextFunction) => void;
  logUncaughtException(err: Error): void;
  logUnhandledRejection(reason: any, promise: Promise<any>): void;
}

// Sanitizer Middleware Types
export interface SanitizerMiddleware {
  xssProtection(req: Request, res: Response, next: NextFunction): void;
  sqlInjectionProtection: any;
  sanitizeHtml(req: Request, res: Response, next: NextFunction): void;
  trimWhitespace(req: Request, res: Response, next: NextFunction): void;
  removeEmptyStrings(req: Request, res: Response, next: NextFunction): void;
  normalizeEmail(req: Request, res: Response, next: NextFunction): void;
  sanitizePhone(req: Request, res: Response, next: NextFunction): void;
  toNumber(fields: string[]): (req: Request, res: Response, next: NextFunction) => void;
  toBoolean(fields: string[]): (req: Request, res: Response, next: NextFunction) => void;
  toDate(fields: string[]): (req: Request, res: Response, next: NextFunction) => void;
  sanitizeArray(field: string): (req: Request, res: Response, next: NextFunction) => void;
  sanitizeObject(field: string): (req: Request, res: Response, next: NextFunction) => void;
  stripHtmlTags(fields: string[]): (req: Request, res: Response, next: NextFunction) => void;
  securityHeaders: any;
  preventParameterPollution(req: Request, res: Response, next: NextFunction): void;
  validateContentType(req: Request, res: Response, next: NextFunction): void | Response;
}

// Combined middleware type
export interface Middleware {
  auth: AuthMiddleware;
  roleCheck: RoleCheckMiddleware;
  validation: ValidationMiddleware;
  errorHandler: ErrorHandlerMiddleware;
  rateLimiter: RateLimiterMiddleware;
  fileUpload: FileUploadMiddleware;
  logger: LoggerMiddleware;
  sanitizer: SanitizerMiddleware;
}
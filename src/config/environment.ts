import dotenv from 'dotenv';

dotenv.config();

interface EnvironmentConfig {
  nodeEnv: string;
  port: number;
  serverUrl: string;
  frontendUrl: string;
  jwtSecret: string;
  jwtExpire: string;
  jwtRefreshSecret: string;
  jwtRefreshExpire: string;
  bcryptRounds: number;
  apiPrefix: string;
  apiVersion: string;
}

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  fromName: string;
  replyTo: string;
}

interface FileConfig {
  uploadDir: string;
  maxFileSize: number;
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  avatarMaxSize: number;
  avatarDimensions: {
    width: number;
    height: number;
  };
  logoMaxSize: number;
  logoDimensions: {
    width: number;
    height: number;
  };
  importMaxSize: number;
}

interface RateLimitConfig {
  windowMs: number;
  max: number;
  authWindowMs: number;
  authMax: number;
  campaignWindowMs: number;
  campaignMax: number;
  uploadWindowMs: number;
  uploadMax: number;
}

interface CacheConfig {
  enabled: boolean;
  ttl: number;
  checkPeriod: number;
}

interface SecurityConfig {
  corsOrigin: string | string[];
  corsCredentials: boolean;
  helmetEnabled: boolean;
  rateLimitEnabled: boolean;
  xssProtection: boolean;
  noSniff: boolean;
  hidePoweredBy: boolean;
}

const environment: EnvironmentConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  serverUrl: process.env.SERVER_URL || 'http://localhost:5000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5137',
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  apiPrefix: '/api',
  apiVersion: 'v1'
};

const email: EmailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || ''
  },
  from: process.env.EMAIL_FROM || 'noreply@deracrm.com',
  fromName: process.env.EMAIL_FROM_NAME || 'DERA CRM',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@deracrm.com'
};

const file: FileConfig = {
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB default
  allowedExtensions: (process.env.ALLOWED_EXTENSIONS || 'jpg,jpeg,png,gif,pdf,doc,docx,csv,xlsx').split(','),
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  avatarMaxSize: parseInt(process.env.AVATAR_MAX_SIZE || '2097152', 10), // 2MB
  avatarDimensions: {
    width: 500,
    height: 500
  },
  logoMaxSize: parseInt(process.env.LOGO_MAX_SIZE || '3145728', 10), // 3MB
  logoDimensions: {
    width: 300,
    height: 100
  },
  importMaxSize: parseInt(process.env.IMPORT_MAX_SIZE || '10485760', 10) // 10MB
};

const rateLimit: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  authWindowMs: 15 * 60 * 1000, // 15 minutes
  authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5', 10),
  campaignWindowMs: 60 * 60 * 1000, // 1 hour
  campaignMax: parseInt(process.env.CAMPAIGN_RATE_LIMIT_MAX || '50', 10),
  uploadWindowMs: 60 * 60 * 1000, // 1 hour
  uploadMax: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX || '10', 10)
};

const cache: CacheConfig = {
  enabled: process.env.CACHE_ENABLED === 'true',
  ttl: parseInt(process.env.CACHE_TTL || '300', 10), // 5 minutes
  checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD || '600', 10) // 10 minutes
};

const security: SecurityConfig = {
  // corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  corsCredentials: true,
  helmetEnabled: true,
  rateLimitEnabled: true,
  xssProtection: true,
  noSniff: true,
  hidePoweredBy: true
};

export {
  environment,
  email,
  file,
  rateLimit,
  cache,
  security
};
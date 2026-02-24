// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  AGENT: 'agent'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Deal Stages
export const DEAL_STAGES = {
  LEAD: 'lead',
  QUALIFIED: 'qualified',
  PROPOSAL: 'proposal',
  NEGOTIATION: 'negotiation',
  WON: 'won',
  LOST: 'lost'
} as const;

export type DealStage = typeof DEAL_STAGES[keyof typeof DEAL_STAGES];

// Deal Stage Display Names
export const DEAL_STAGE_DISPLAY = {
  [DEAL_STAGES.LEAD]: 'Lead',
  [DEAL_STAGES.QUALIFIED]: 'Qualified',
  [DEAL_STAGES.PROPOSAL]: 'Proposal',
  [DEAL_STAGES.NEGOTIATION]: 'Negotiation',
  [DEAL_STAGES.WON]: 'Won',
  [DEAL_STAGES.LOST]: 'Lost'
};

// Deal Stage Colors
export const DEAL_STAGE_COLORS = {
  [DEAL_STAGES.LEAD]: '#3B82F6',
  [DEAL_STAGES.QUALIFIED]: '#8B5CF6',
  [DEAL_STAGES.PROPOSAL]: '#F59E0B',
  [DEAL_STAGES.NEGOTIATION]: '#EF4444',
  [DEAL_STAGES.WON]: '#10B981',
  [DEAL_STAGES.LOST]: '#6B7280'
};

// Deal Status
export const DEAL_STATUS = {
  OPEN: 'open',
  WON: 'won',
  LOST: 'lost'
} as const;

export type DealStatus = typeof DEAL_STATUS[keyof typeof DEAL_STATUS];

// Priorities
export const PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

export type Priority = typeof PRIORITIES[keyof typeof PRIORITIES];

// Priority Colors
export const PRIORITY_COLORS = {
  [PRIORITIES.LOW]: '#10B981',
  [PRIORITIES.MEDIUM]: '#F59E0B',
  [PRIORITIES.HIGH]: '#EF4444',
  [PRIORITIES.URGENT]: '#7F1D1D'
};

// Activity Types
export const ACTIVITY_TYPES = {
  CALL: 'call',
  EMAIL: 'email',
  MEETING: 'meeting',
  TASK: 'task',
  NOTE: 'note',
  FOLLOW_UP: 'follow-up'
} as const;

export type ActivityType = typeof ACTIVITY_TYPES[keyof typeof ACTIVITY_TYPES];

// Activity Type Icons
export const ACTIVITY_TYPE_ICONS = {
  [ACTIVITY_TYPES.CALL]: 'phone',
  [ACTIVITY_TYPES.EMAIL]: 'envelope',
  [ACTIVITY_TYPES.MEETING]: 'users',
  [ACTIVITY_TYPES.TASK]: 'check-square',
  [ACTIVITY_TYPES.NOTE]: 'file-text',
  [ACTIVITY_TYPES.FOLLOW_UP]: 'refresh'
};

// Activity Status
export const ACTIVITY_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  OVERDUE: 'overdue'
} as const;

export type ActivityStatus = typeof ACTIVITY_STATUS[keyof typeof ACTIVITY_STATUS];

// Ticket Status
export const TICKET_STATUS = {
  NEW: 'new',
  OPEN: 'open',
  PENDING: 'pending',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
} as const;

export type TicketStatus = typeof TICKET_STATUS[keyof typeof TICKET_STATUS];

// Ticket Status Display
export const TICKET_STATUS_DISPLAY = {
  [TICKET_STATUS.NEW]: 'New',
  [TICKET_STATUS.OPEN]: 'Open',
  [TICKET_STATUS.PENDING]: 'Pending',
  [TICKET_STATUS.RESOLVED]: 'Resolved',
  [TICKET_STATUS.CLOSED]: 'Closed'
};

// Ticket Status Colors
export const TICKET_STATUS_COLORS = {
  [TICKET_STATUS.NEW]: '#3B82F6',
  [TICKET_STATUS.OPEN]: '#F59E0B',
  [TICKET_STATUS.PENDING]: '#8B5CF6',
  [TICKET_STATUS.RESOLVED]: '#10B981',
  [TICKET_STATUS.CLOSED]: '#6B7280'
};

// Contact Status
export const CONTACT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  LEAD: 'lead'
} as const;

export type ContactStatus = typeof CONTACT_STATUS[keyof typeof CONTACT_STATUS];

// Contact Sources
export const CONTACT_SOURCES = {
  WEBSITE: 'website',
  REFERRAL: 'referral',
  SOCIAL: 'social',
  EMAIL: 'email',
  CALL: 'call',
  EVENT: 'event',
  OTHER: 'other'
} as const;

export type ContactSource = typeof CONTACT_SOURCES[keyof typeof CONTACT_SOURCES];

// Campaign Status
export const CAMPAIGN_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  SENDING: 'sending',
  SENT: 'sent',
  CANCELLED: 'cancelled'
} as const;

export type CampaignStatus = typeof CAMPAIGN_STATUS[keyof typeof CAMPAIGN_STATUS];

// Audit Actions
export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  VIEW: 'VIEW',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT'
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];

// Entity Types
export const ENTITY_TYPES = {
  USER: 'user',
  CONTACT: 'contact',
  DEAL: 'deal',
  ACTIVITY: 'activity',
  TICKET: 'ticket',
  TICKET_COMMENT: 'ticket_comment',
  EMAIL_TEMPLATE: 'email_template',
  CAMPAIGN: 'campaign',
  CAMPAIGN_RECIPIENT: 'campaign_recipient',
  ORGANIZATION: 'organization'
} as const;

export type EntityType = typeof ENTITY_TYPES[keyof typeof ENTITY_TYPES];

// Notification Types
export const NOTIFICATION_TYPES = {
  TICKET_ASSIGNED: 'ticket_assigned',
  TICKET_RESOLVED: 'ticket_resolved',
  DEAL_ASSIGNED: 'deal_assigned',
  DEAL_WON: 'deal_won',
  ACTIVITY_REMINDER: 'activity_reminder',
  SLA_BREACH: 'sla_breach',
  CAMPAIGN_COMPLETED: 'campaign_completed',
  WEEKLY_SUMMARY: 'weekly_summary',
  DAILY_DIGEST: 'daily_digest'
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

// API Versions
export const API_VERSIONS = {
  V1: 'v1'
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Please authenticate',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: (resource: string) => `${resource} not found`,
  CONFLICT: (field: string) => `${field} already exists`,
  VALIDATION_FAILED: 'Validation failed',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
  INTERNAL_ERROR: 'Something went wrong',
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_NOT_VERIFIED: 'Please verify your email first',
  ACCOUNT_DISABLED: 'Your account has been disabled',
  TOKEN_EXPIRED: 'Token has expired',
  INVALID_TOKEN: 'Invalid token',
  FILE_TOO_LARGE: 'File too large',
  INVALID_FILE_TYPE: 'Invalid file type',
  IMPORT_FAILED: 'Import failed',
  EXPORT_FAILED: 'Export failed'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  REGISTER_SUCCESS: 'Registration successful. Please check your email for verification',
  LOGOUT_SUCCESS: 'Logout successful',
  EMAIL_VERIFIED: 'Email verified successfully',
  PASSWORD_RESET_EMAIL_SENT: 'Password reset email sent',
  PASSWORD_RESET_SUCCESS: 'Password reset successful',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  AVATAR_UPLOADED: 'Avatar uploaded successfully',
  AVATAR_REMOVED: 'Avatar removed successfully',
  CREATED: (resource: string) => `${resource} created successfully`,
  UPDATED: (resource: string) => `${resource} updated successfully`,
  DELETED: (resource: string) => `${resource} deleted successfully`,
  IMPORT_STARTED: 'Import started. You will be notified when complete',
  EXPORT_READY: 'Export ready for download'
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
} as const;

// Date Formats
export const DATE_FORMATS = {
  DEFAULT: 'YYYY-MM-DD',
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_TIME: 'MMM DD, YYYY HH:mm',
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  FILE: 'YYYY-MM-DD-HHmmss'
} as const;

// File Upload
export const FILE_UPLOAD = {
  AVATAR_DIR: 'avatars',
  LOGO_DIR: 'logos',
  ATTACHMENT_DIR: 'attachments',
  IMPORT_DIR: 'imports',
  EXPORT_DIR: 'exports',
  AVATAR_PREFIX: 'user',
  LOGO_PREFIX: 'logo',
  IMPORT_PREFIX: 'import',
  EXPORT_PREFIX: 'export'
} as const;

// Cache Keys
export const CACHE_KEYS = {
  DASHBOARD: (userId: number) => `dashboard:${userId}`,
  PIPELINE: (userId?: number) => `pipeline:${userId || 'all'}`,
  TICKET_SUMMARY: 'ticket:summary',
  CONTACT_TAGS: 'contact:tags',
  USER_LIST: 'users:list',
  ORGANIZATION: 'organization:settings'
} as const;

// Time Constants (in milliseconds)
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000
} as const;

// Default Values
export const DEFAULTS = {
  AVATAR: '/defaults/avatar.png',
  LOGO: '/defaults/logo.png',
  TIMEZONE: 'UTC',
  CURRENCY: 'USD',
  LANGUAGE: 'en',
  THEME: 'light',
  NOTIFICATIONS_ENABLED: true
} as const;
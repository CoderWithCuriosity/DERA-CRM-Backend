import { UserInstance, ContactInstance, DealInstance, TicketInstance, CampaignInstance, RefreshTokenInstance, PasswordResetInstance, CampaignRecipientInstance, ActivityInstance, AuditLogInstance } from './models';
import { TokenPayload } from './middleware';

// Auth Service Types
export interface AuthService {
  generateToken(user: UserInstance): string;
  generateRefreshToken(userId: number): Promise<RefreshTokenInstance>;
  verifyRefreshToken(token: string): Promise<TokenPayload>;
  revokeRefreshToken(token: string): Promise<void>;
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
  validatePasswordStrength(password: string): boolean;
  generateVerificationToken(user: UserInstance): string;
  sendVerificationEmail(user: UserInstance): Promise<void>;
  generatePasswordResetToken(user: UserInstance): Promise<PasswordResetInstance>;
  sendPasswordResetEmail(user: UserInstance): Promise<void>;
  verifyPasswordResetToken(token: string): Promise<UserInstance>;
  resetPasswordWithToken(token: string, newPassword: string): Promise<void>;
  changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void>;
  registerUser(userData: any): Promise<{ user: UserInstance; token: string; refreshToken: string }>;
  loginUser(email: string, password: string): Promise<{ user: UserInstance; token: string; refreshToken: string }>;
}

// Email Service Types
export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: any;
  attachments?: any[];
}

export interface EmailService {
  sendEmail(options: EmailOptions): Promise<string>;
  sendBulkEmails(recipients: Array<{ to: string; data: any }>, subject: string, template: string): Promise<string[]>;
  sendWelcomeEmail(user: UserInstance): Promise<void>;
  sendTicketAssignmentEmail(ticket: TicketInstance, assignee: UserInstance, assignedBy: UserInstance): Promise<void>;
  sendTicketResolutionEmail(ticket: TicketInstance, resolvedBy: UserInstance): Promise<void>;
  sendDealAssignmentEmail(deal: DealInstance, assignee: UserInstance, assignedBy: UserInstance): Promise<void>;
  sendCampaignSummaryEmail(campaign: CampaignInstance, recipient: UserInstance): Promise<void>;
  sendWeeklySummaryEmail(user: UserInstance, stats: any): Promise<void>;
  sendSLABreachEmail(ticket: TicketInstance, assignee: UserInstance): Promise<void>;
  sendDailyDigestEmail(user: UserInstance, digest: any): Promise<void>;
  sendInvitationEmail(email: string, inviter: UserInstance, company: string, token: string): Promise<void>;
}

// Token Service Types
export interface TokenService {
  generateAccessToken(user: UserInstance): string;
  generateRefreshToken(userId: number): Promise<RefreshTokenInstance>;
  verifyAccessToken(token: string): TokenPayload;
  verifyRefreshToken(token: string): Promise<TokenPayload>;
  refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;
  revokeRefreshToken(token: string): Promise<void>;
  revokeAllUserTokens(userId: number): Promise<void>;
  generateVerificationToken(user: UserInstance): string;
  verifyVerificationToken(token: string): TokenPayload;
  generatePasswordResetToken(user: UserInstance): string;
  verifyPasswordResetToken(token: string): TokenPayload;
  generateApiKey(): string;
  generateRandomToken(length?: number): string;
  decodeToken(token: string): any;
  getTokenExpiration(token: string): Date | null;
  isTokenExpired(token: string): boolean;
}

// File Service Types
export interface FileUploadResult {
  filename: string;
  path: string;
  url: string;
  size: number;
  mimetype: string;
  originalname: string;
}

export interface FileService {
  ensureDirectoryExists(dirPath: string): void;
  generateFilename(originalname: string, prefix?: string): string;
  getFilePath(filename: string, type: keyof typeof FILE_UPLOAD): string;
  getFileUrl(filename: string, type: keyof typeof FILE_UPLOAD): string;
  saveFile(file: Express.Multer.File, type: keyof typeof FILE_UPLOAD, options?: any): Promise<FileUploadResult>;
  deleteFile(filename: string, type: keyof typeof FILE_UPLOAD): Promise<boolean>;
  deleteFiles(filenames: string[], type: keyof typeof FILE_UPLOAD): Promise<number>;
  getFileInfo(filename: string, type: keyof typeof FILE_UPLOAD): Promise<any>;
  listFiles(type: keyof typeof FILE_UPLOAD): Promise<any[]>;
  processImage(inputPath: string, outputPath: string, options?: any): Promise<string>;
  validateFileType(mimetype: string, allowedTypes: string[]): boolean;
  validateFileSize(size: number, maxSize: number): boolean;
  cleanupOldFiles(type: keyof typeof FILE_UPLOAD, maxAge?: number): Promise<number>;
  createThumbnail(inputPath: string, outputPath: string, width?: number, height?: number): Promise<string>;
}

// Campaign Service Types
export interface CampaignAnalytics {
  campaign_id: number;
  name: string;
  summary: {
    sent: number;
    delivered: number;
    opens: number;
    unique_opens: number;
    clicks: number;
    unique_clicks: number;
    bounces: number;
    unsubscribes: number;
    complaints: number;
  };
  rates: {
    delivery_rate: number;
    open_rate: number;
    click_rate: number;
    click_to_open_rate: number;
    bounce_rate: number;
    unsubscribe_rate: number;
  };
  hourly_opens: Array<{ hour: string; opens: number }>;
  device_breakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  top_links: Array<{ url: string; clicks: number }>;
}

export interface CampaignService {
  createCampaign(data: any): Promise<CampaignInstance>;
  sendCampaign(campaignId: number): Promise<void>;
  sendCampaignEmail(campaign: CampaignInstance, recipient: CampaignRecipientInstance): Promise<void>;
  addClickTracking(html: string, campaignId: number, recipientId: number): string;
  trackOpen(campaignId: number, recipientId: number): Promise<void>;
  trackClick(campaignId: number, recipientId: number, url: string): Promise<void>;
  getCampaignAnalytics(campaignId: number): Promise<CampaignAnalytics>;
  duplicateCampaign(campaignId: number, userId: number): Promise<CampaignInstance>;
  cancelCampaign(campaignId: number): Promise<CampaignInstance>;
  validateCampaign(campaignId: number): Promise<boolean>;
}

// Dashboard Service Types
export interface DashboardSummary {
  total_contacts: number;
  new_contacts_today: number;
  open_deals: number;
  total_pipeline_value: number;
  weighted_pipeline_value: number;
  deals_won_this_month: number;
  deals_lost_this_month: number;
  win_rate: number;
  new_tickets: number;
  open_tickets: number;
  overdue_tickets: number;
  tickets_resolved_today: number;
}

export interface SalesChartData {
  labels: string[];
  won_deals: number[];
  lost_deals: number[];
}

export interface PipelineChartData {
  stages: Array<{
    name: string;
    count: number;
    value: number;
    weighted_value: number;
    color: string;
  }>;
  total_value: number;
  weighted_value: number;
}

export interface TicketChartData {
  days: number;
  data: Array<{
    date: string;
    new: number;
    resolved: number;
  }>;
  totals: {
    new: number;
    resolved: number;
    open: number;
  };
}

export interface DashboardService {
  getDashboardSummary(userId?: number, userRole?: string): Promise<DashboardSummary>;
  getSalesChartData(whereClause?: any, period?: string, year?: number): Promise<SalesChartData>;
  getPipelineChartData(whereClause?: any): Promise<PipelineChartData>;
  getTicketChartData(whereClause?: any, days?: number): Promise<TicketChartData>;
  getRecentActivities(userId?: number, limit?: number): Promise<any[]>;
  getTaskList(userId?: number, limit?: number): Promise<any[]>;
  getTopPerformers(limit?: number): Promise<any[]>;
  getActivitySummary(userId?: number): Promise<any>;
}

// SLA Service Types
export interface SLAConfig {
  response_time: number;
  resolution_time: number;
  notification_thresholds: number[];
}

export interface SLAService {
  calculateSLADeadlines(priority: string, createdAt?: Date): { response_due: Date; resolution_due: Date };
  checkSLA(ticket: TicketInstance): { response_ok: boolean; resolution_ok: boolean };
  calculateSLACompliance(tickets: TicketInstance[]): { response_compliance: number; resolution_compliance: number };
  getApproachingSLABreach(threshold?: number): Promise<TicketInstance[]>;
  getBreachedTickets(): Promise<TicketInstance[]>;
  sendSLANotifications(): Promise<void>;
  updateTicketSLA(ticket: TicketInstance, newPriority: string): Promise<void>;
  getSLAMetrics(startDate: Date, endDate: Date): Promise<any>;
}

// Audit Service Types
export interface AuditLogEntry {
  user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number;
  details: string;
  ip_address?: string;
  user_agent?: string;
}

export interface AuditService {
  createAuditLog(entry: AuditLogEntry): Promise<AuditLogInstance>;
  logAction(req: Request, action: string, entityType: string, entityId: number, details: string): Promise<void>;
  logLogin(userId: number, req: Request, success: boolean): Promise<void>;
  logLogout(userId: number, req: Request): Promise<void>;
  logCreate(req: Request, entityType: string, entityId: number, details: string): Promise<void>;
  logUpdate(req: Request, entityType: string, entityId: number, details: string): Promise<void>;
  logDelete(req: Request, entityType: string, entityId: number, details: string): Promise<void>;
  logView(req: Request, entityType: string, entityId: number, details: string): Promise<void>;
  logExport(req: Request, entityType: string, count: number): Promise<void>;
  logImport(req: Request, entityType: string, count: number): Promise<void>;
  getAuditLogs(filters: any): Promise<{ logs: AuditLogInstance[]; total: number; pages: number }>;
  getUserActivitySummary(userId: number, days?: number): Promise<any>;
  cleanupOldLogs(daysToKeep?: number): Promise<number>;
  exportAuditLogs(filters: any, format?: 'csv' | 'json'): Promise<any>;
}

// Export Service Types
export type ExportFormat = 'csv' | 'excel' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  fields?: string[];
  filename?: string;
  includeHeaders?: boolean;
  delimiter?: string;
}

export interface ExportService {
  generateExport(data: any[], options: ExportOptions): Promise<{ filename: string; url: string; path: string }>;
  generateCSV(data: any[], filePath: string, options?: any): Promise<void>;
  generateExcel(data: any[], filePath: string, options?: any): Promise<void>;
  generateJSON(data: any[], filePath: string, options?: any): Promise<void>;
  exportContacts(contacts: ContactInstance[], format?: ExportFormat): Promise<any>;
  exportDeals(deals: DealInstance[], format?: ExportFormat): Promise<any>;
  exportTickets(tickets: TicketInstance[], format?: ExportFormat): Promise<any>;
  exportUsers(users: UserInstance[], format?: ExportFormat): Promise<any>;
  exportCampaigns(campaigns: CampaignInstance[], format?: ExportFormat): Promise<any>;
  exportActivities(activities: ActivityInstance[], format?: ExportFormat): Promise<any>;
  cleanupOldExports(maxAge?: number): Promise<number>;
}

// Import Service Types
export interface ImportResult {
  import_id: string;
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  completed_at?: Date;
}

export interface ImportService {
  parseCSV(filePath: string): Promise<any[]>;
  parseExcel(filePath: string): Promise<any[]>;
  validateContactImport(data: any[], mapping: any, userId: number): Promise<ImportResult>;
  processImport(filePath: string, importId: string, mapping: any, userId: number, entityType?: string): Promise<ImportResult>;
  validateHeaders(headers: string[], requiredFields: string[]): { valid: boolean; missing: string[] };
  getImportTemplate(entityType: string): any[];
  generateErrorReport(errors: Array<{ row: number; error: string }>): string;
  saveImportResults(importId: string, result: ImportResult): Promise<string>;
  getImportResults(importId: string): Promise<ImportResult | null>;
  cleanupOldImports(maxAge?: number): Promise<number>;
}
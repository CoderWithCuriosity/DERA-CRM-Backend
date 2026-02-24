import { Request, Response } from 'express';
import { 
  UserInstance, 
  ContactInstance, 
  DealInstance, 
  ActivityInstance, 
  TicketInstance,
  CampaignInstance,
  EmailTemplateInstance 
} from './models';

// Auth Controller Types
export interface AuthController {
  register(req: Request, res: Response): Promise<Response>;
  login(req: Request, res: Response): Promise<Response>;
  refreshToken(req: Request, res: Response): Promise<Response>;
  logout(req: Request, res: Response): Promise<Response>;
  verifyEmail(req: Request, res: Response): Promise<Response>;
  forgotPassword(req: Request, res: Response): Promise<Response>;
  resetPassword(req: Request, res: Response): Promise<Response>;
  resendVerification(req: Request, res: Response): Promise<Response>;
}

// User Controller Types
export interface UserController {
  getProfile(req: Request, res: Response): Promise<Response>;
  updateProfile(req: Request, res: Response): Promise<Response>;
  changePassword(req: Request, res: Response): Promise<Response>;
  uploadAvatar(req: Request, res: Response): Promise<Response>;
  removeAvatar(req: Request, res: Response): Promise<Response>;
  getUsers(req: Request, res: Response): Promise<Response>;
  getUserById(req: Request, res: Response): Promise<Response>;
  updateUserRole(req: Request, res: Response): Promise<Response>;
  deleteUser(req: Request, res: Response): Promise<Response>;
}

// Contact Controller Types
export interface ContactController {
  createContact(req: Request, res: Response): Promise<Response>;
  getContacts(req: Request, res: Response): Promise<Response>;
  getContactById(req: Request, res: Response): Promise<Response>;
  updateContact(req: Request, res: Response): Promise<Response>;
  deleteContact(req: Request, res: Response): Promise<Response>;
  importContacts(req: Request, res: Response): Promise<Response>;
  getImportStatus(req: Request, res: Response): Promise<Response>;
  exportContacts(req: Request, res: Response): Promise<Response>;
  addTag(req: Request, res: Response): Promise<Response>;
  removeTag(req: Request, res: Response): Promise<Response>;
  getAllTags(req: Request, res: Response): Promise<Response>;
}

// Deal Controller Types
export interface DealController {
  createDeal(req: Request, res: Response): Promise<Response>;
  getDeals(req: Request, res: Response): Promise<Response>;
  getDealById(req: Request, res: Response): Promise<Response>;
  updateDeal(req: Request, res: Response): Promise<Response>;
  updateDealStage(req: Request, res: Response): Promise<Response>;
  markDealAsWon(req: Request, res: Response): Promise<Response>;
  markDealAsLost(req: Request, res: Response): Promise<Response>;
  deleteDeal(req: Request, res: Response): Promise<Response>;
  getPipelineSummary(req: Request, res: Response): Promise<Response>;
  getKanbanBoard(req: Request, res: Response): Promise<Response>;
}

// Activity Controller Types
export interface ActivityController {
  createActivity(req: Request, res: Response): Promise<Response>;
  getActivities(req: Request, res: Response): Promise<Response>;
  getActivityById(req: Request, res: Response): Promise<Response>;
  updateActivity(req: Request, res: Response): Promise<Response>;
  completeActivity(req: Request, res: Response): Promise<Response>;
  deleteActivity(req: Request, res: Response): Promise<Response>;
  getTodayActivities(req: Request, res: Response): Promise<Response>;
  getUpcomingActivities(req: Request, res: Response): Promise<Response>;
}

// Ticket Controller Types
export interface TicketController {
  createTicket(req: Request, res: Response): Promise<Response>;
  getTickets(req: Request, res: Response): Promise<Response>;
  getTicketById(req: Request, res: Response): Promise<Response>;
  updateTicket(req: Request, res: Response): Promise<Response>;
  updateTicketStatus(req: Request, res: Response): Promise<Response>;
  assignTicket(req: Request, res: Response): Promise<Response>;
  addTicketComment(req: Request, res: Response): Promise<Response>;
  getTicketComments(req: Request, res: Response): Promise<Response>;
  deleteTicket(req: Request, res: Response): Promise<Response>;
  getSLAReport(req: Request, res: Response): Promise<Response>;
}

// EmailTemplate Controller Types
export interface EmailTemplateController {
  createEmailTemplate(req: Request, res: Response): Promise<Response>;
  getEmailTemplates(req: Request, res: Response): Promise<Response>;
  getEmailTemplateById(req: Request, res: Response): Promise<Response>;
  updateEmailTemplate(req: Request, res: Response): Promise<Response>;
  deleteEmailTemplate(req: Request, res: Response): Promise<Response>;
  previewEmailTemplate(req: Request, res: Response): Promise<Response>;
  duplicateEmailTemplate(req: Request, res: Response): Promise<Response>;
}

// Campaign Controller Types
export interface CampaignController {
  createCampaign(req: Request, res: Response): Promise<Response>;
  getCampaigns(req: Request, res: Response): Promise<Response>;
  getCampaignById(req: Request, res: Response): Promise<Response>;
  updateCampaign(req: Request, res: Response): Promise<Response>;
  sendCampaign(req: Request, res: Response): Promise<Response>;
  cancelCampaign(req: Request, res: Response): Promise<Response>;
  sendTestEmail(req: Request, res: Response): Promise<Response>;
  getCampaignAnalytics(req: Request, res: Response): Promise<Response>;
  duplicateCampaign(req: Request, res: Response): Promise<Response>;
}

// Dashboard Controller Types
export interface DashboardController {
  getDashboard(req: Request, res: Response): Promise<Response>;
  getSalesChart(req: Request, res: Response): Promise<Response>;
  getPipelineChart(req: Request, res: Response): Promise<Response>;
  getTicketChart(req: Request, res: Response): Promise<Response>;
}

// Admin Controller Types
export interface AdminController {
  getSystemStats(req: Request, res: Response): Promise<Response>;
  getAuditLogs(req: Request, res: Response): Promise<Response>;
  getUserActivityReport(req: Request, res: Response): Promise<Response>;
  createBackup(req: Request, res: Response): Promise<Response>;
  getBackupStatus(req: Request, res: Response): Promise<Response>;
  getSystemHealth(req: Request, res: Response): Promise<Response>;
  getSystemConfig(req: Request, res: Response): Promise<Response>;
}

// Organization Controller Types
export interface OrganizationController {
  getOrganizationSettings(req: Request, res: Response): Promise<Response>;
  updateOrganizationSettings(req: Request, res: Response): Promise<Response>;
  uploadCompanyLogo(req: Request, res: Response): Promise<Response>;
  removeCompanyLogo(req: Request, res: Response): Promise<Response>;
  getOrganizationUsers(req: Request, res: Response): Promise<Response>;
  inviteUser(req: Request, res: Response): Promise<Response>;
  getBillingInfo(req: Request, res: Response): Promise<Response>;
}

// Controller Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
  timestamp?: string;
  path?: string;
  method?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters?: any;
  summary?: any;
}

// Controller Error Types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ControllerError {
  success: false;
  message: string;
  errors?: ValidationError[];
  timestamp: string;
  path?: string;
  method?: string;
}
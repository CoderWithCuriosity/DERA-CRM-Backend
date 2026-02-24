import { Model, Optional } from 'sequelize';
import { 
  UserRole, 
  DealStage, 
  DealStatus,
  Priority,
  ActivityType,
  ActivityStatus,
  TicketStatus,
  ContactStatus,
  ContactSource,
  CampaignStatus,
  AuditAction,
  EntityType 
} from '../config/constants';

// User Types
export interface UserAttributes {
  id: number;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  avatar: string | null;
  is_verified: boolean;
  last_login: Date | null;
  organization_id: number | null;
  settings: {
    notifications: boolean;
    theme: 'light' | 'dark';
    language: string;
  };
  created_at: Date;
  updated_at: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'avatar' | 'is_verified' | 'last_login' | 'organization_id' | 'settings' | 'created_at' | 'updated_at'> {}

export interface UserModel extends Model<UserAttributes, UserCreationAttributes>, UserAttributes {
  readonly fullName: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateLastLogin(): Promise<void>;
  toJSON(): Partial<UserAttributes>;
}

// Contact Types
export interface ContactAttributes {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  status: ContactStatus;
  source: ContactSource;
  notes: string | null;
  tags: string[];
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface ContactCreationAttributes extends Optional<ContactAttributes, 'id' | 'phone' | 'company' | 'job_title' | 'notes' | 'tags' | 'created_at' | 'updated_at'> {}

export interface ContactModel extends Model<ContactAttributes, ContactCreationAttributes>, ContactAttributes {
  readonly fullName: string;
  toJSON(): ContactAttributes;
}

// Deal Types
export interface DealAttributes {
  id: number;
  name: string;
  contact_id: number;
  user_id: number;
  stage: DealStage;
  amount: number;
  probability: number;
  expected_close_date: Date | null;
  actual_close_date: Date | null;
  status: DealStatus;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DealCreationAttributes extends Optional<DealAttributes, 'id' | 'actual_close_date' | 'notes' | 'created_at' | 'updated_at'> {}

export interface DealModel extends Model<DealAttributes, DealCreationAttributes>, DealAttributes {
  readonly weightedAmount: number;
  readonly isOverdue: boolean;
  toJSON(): DealAttributes;
}

// Activity Types
export interface ActivityAttributes {
  id: number;
  type: ActivityType;
  subject: string;
  description: string | null;
  contact_id: number | null;
  deal_id: number | null;
  user_id: number;
  scheduled_date: Date;
  completed_date: Date | null;
  duration: number | null;
  outcome: string | null;
  status: ActivityStatus;
  created_at: Date;
  updated_at: Date;
}

export interface ActivityCreationAttributes extends Optional<ActivityAttributes, 'id' | 'description' | 'contact_id' | 'deal_id' | 'completed_date' | 'duration' | 'outcome' | 'status' | 'created_at' | 'updated_at'> {}

export interface ActivityModel extends Model<ActivityAttributes, ActivityCreationAttributes>, ActivityAttributes {
  readonly isOverdue: boolean;
  readonly isCompleted: boolean;
  toJSON(): ActivityAttributes;
}

// Ticket Types
export interface TicketAttributes {
  id: number;
  ticket_number: string;
  subject: string;
  description: string;
  contact_id: number;
  user_id: number;
  assigned_to: number | null;
  priority: Priority;
  status: TicketStatus;
  due_date: Date | null;
  resolved_at: Date | null;
  sla_response_due: Date | null;
  sla_resolution_due: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface TicketCreationAttributes extends Optional<TicketAttributes, 'id' | 'ticket_number' | 'assigned_to' | 'due_date' | 'resolved_at' | 'sla_response_due' | 'sla_resolution_due' | 'created_at' | 'updated_at'> {}

export interface TicketModel extends Model<TicketAttributes, TicketCreationAttributes>, TicketAttributes {
  readonly responseTime: number | null;
  readonly resolutionTime: number | null;
  readonly isOverdue: boolean;
  toJSON(): TicketAttributes;
}

// TicketComment Types
export interface TicketCommentAttributes {
  id: number;
  ticket_id: number;
  user_id: number;
  comment: string;
  is_internal: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TicketCommentCreationAttributes extends Optional<TicketCommentAttributes, 'id' | 'created_at' | 'updated_at'> {}

export interface TicketCommentModel extends Model<TicketCommentAttributes, TicketCommentCreationAttributes>, TicketCommentAttributes {
  toJSON(): TicketCommentAttributes;
}

// EmailTemplate Types
export interface EmailTemplateAttributes {
  id: number;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface EmailTemplateCreationAttributes extends Optional<EmailTemplateAttributes, 'id' | 'variables' | 'created_at' | 'updated_at'> {}

export interface EmailTemplateModel extends Model<EmailTemplateAttributes, EmailTemplateCreationAttributes>, EmailTemplateAttributes {
  renderPreview(data: Record<string, any>): { subject: string; body: string };
  toJSON(): EmailTemplateAttributes;
}

// Campaign Types
export interface CampaignAttributes {
  id: number;
  name: string;
  template_id: number;
  user_id: number;
  status: CampaignStatus;
  target_count: number;
  sent_count: number;
  open_count: number;
  click_count: number;
  scheduled_at: Date | null;
  sent_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CampaignCreationAttributes extends Optional<CampaignAttributes, 'id' | 'sent_count' | 'open_count' | 'click_count' | 'scheduled_at' | 'sent_at' | 'created_at' | 'updated_at'> {}

export interface CampaignModel extends Model<CampaignAttributes, CampaignCreationAttributes>, CampaignAttributes {
  readonly openRate: number;
  readonly clickRate: number;
  readonly clickToOpenRate: number;
  toJSON(): CampaignAttributes;
}

// CampaignRecipient Types
export type CampaignRecipientStatus = 'pending' | 'sent' | 'failed' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';

export interface CampaignRecipientAttributes {
  id: number;
  campaign_id: number;
  contact_id: number;
  email: string;
  status: CampaignRecipientStatus;
  sent_at: Date | null;
  opened_at: Date | null;
  clicked_at: Date | null;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CampaignRecipientCreationAttributes extends Optional<CampaignRecipientAttributes, 'id' | 'sent_at' | 'opened_at' | 'clicked_at' | 'error_message' | 'created_at' | 'updated_at'> {}

export interface CampaignRecipientModel extends Model<CampaignRecipientAttributes, CampaignRecipientCreationAttributes>, CampaignRecipientAttributes {
  toJSON(): CampaignRecipientAttributes;
}

// Organization Types
export interface OrganizationAttributes {
  id: number;
  company_name: string;
  company_logo: string | null;
  company_email: string | null;
  company_phone: string | null;
  company_address: string | null;
  website: string | null;
  timezone: string;
  date_format: string;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrganizationCreationAttributes extends Optional<OrganizationAttributes, 'id' | 'company_logo' | 'company_email' | 'company_phone' | 'company_address' | 'website' | 'created_at' | 'updated_at'> {}

export interface OrganizationModel extends Model<OrganizationAttributes, OrganizationCreationAttributes>, OrganizationAttributes {
  toJSON(): OrganizationAttributes;
}

// AuditLog Types
export interface AuditLogAttributes {
  id: number;
  user_id: number | null;
  action: AuditAction;
  entity_type: EntityType;
  entity_id: number;
  details: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'user_id' | 'ip_address' | 'user_agent' | 'created_at'> {}

export interface AuditLogModel extends Model<AuditLogAttributes, AuditLogCreationAttributes>, AuditLogAttributes {
  toJSON(): AuditLogAttributes;
}

// RefreshToken Types
export interface RefreshTokenAttributes {
  id: number;
  token: string;
  user_id: number;
  expires_at: Date;
  revoked: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RefreshTokenCreationAttributes extends Optional<RefreshTokenAttributes, 'id' | 'token' | 'revoked' | 'created_at' | 'updated_at'> {}

export interface RefreshTokenModel extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes>, RefreshTokenAttributes {
  isExpired(): boolean;
  isValid(): boolean;
  toJSON(): RefreshTokenAttributes;
}

// PasswordReset Types
export interface PasswordResetAttributes {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PasswordResetCreationAttributes extends Optional<PasswordResetAttributes, 'id' | 'token' | 'used' | 'created_at' | 'updated_at'> {}

export interface PasswordResetModel extends Model<PasswordResetAttributes, PasswordResetCreationAttributes>, PasswordResetAttributes {
  isExpired(): boolean;
  isValid(): boolean;
  toJSON(): PasswordResetAttributes;
}

// Association Types
export interface UserAssociations {
  createdContacts?: ContactModel[];
  ownedDeals?: DealModel[];
  createdActivities?: ActivityModel[];
  createdTickets?: TicketModel[];
  assignedTickets?: TicketModel[];
  ticketComments?: TicketCommentModel[];
  emailTemplates?: EmailTemplateModel[];
  campaigns?: CampaignModel[];
  auditLogs?: AuditLogModel[];
  refreshTokens?: RefreshTokenModel[];
  passwordResets?: PasswordResetModel[];
  organization?: OrganizationModel;
}

export interface ContactAssociations {
  createdBy?: UserModel;
  deals?: DealModel[];
  activities?: ActivityModel[];
  tickets?: TicketModel[];
  campaignRecipients?: CampaignRecipientModel[];
}

export interface DealAssociations {
  contact?: ContactModel;
  owner?: UserModel;
  activities?: ActivityModel[];
}

export interface ActivityAssociations {
  user?: UserModel;
  contact?: ContactModel;
  deal?: DealModel;
}

export interface TicketAssociations {
  contact?: ContactModel;
  createdBy?: UserModel;
  assignedTo?: UserModel;
  comments?: TicketCommentModel[];
}

export interface TicketCommentAssociations {
  ticket?: TicketModel;
  user?: UserModel;
}

export interface EmailTemplateAssociations {
  createdBy?: UserModel;
  campaigns?: CampaignModel[];
}

export interface CampaignAssociations {
  template?: EmailTemplateModel;
  createdBy?: UserModel;
  recipients?: CampaignRecipientModel[];
}

export interface CampaignRecipientAssociations {
  campaign?: CampaignModel;
  contact?: ContactModel;
}

export interface OrganizationAssociations {
  users?: UserModel[];
}

export interface AuditLogAssociations {
  user?: UserModel;
}

export interface RefreshTokenAssociations {
  user?: UserModel;
}

export interface PasswordResetAssociations {
  user?: UserModel;
}

// Combined model types
export type UserInstance = UserModel & UserAssociations;
export type ContactInstance = ContactModel & ContactAssociations;
export type DealInstance = DealModel & DealAssociations;
export type ActivityInstance = ActivityModel & ActivityAssociations;
export type TicketInstance = TicketModel & TicketAssociations;
export type TicketCommentInstance = TicketCommentModel & TicketCommentAssociations;
export type EmailTemplateInstance = EmailTemplateModel & EmailTemplateAssociations;
export type CampaignInstance = CampaignModel & CampaignAssociations;
export type CampaignRecipientInstance = CampaignRecipientModel & CampaignRecipientAssociations;
export type OrganizationInstance = OrganizationModel & OrganizationAssociations;
export type AuditLogInstance = AuditLogModel & AuditLogAssociations;
export type RefreshTokenInstance = RefreshTokenModel & RefreshTokenAssociations;
export type PasswordResetInstance = PasswordResetModel & PasswordResetAssociations;
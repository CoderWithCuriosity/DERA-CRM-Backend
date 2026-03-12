import { Sequelize } from 'sequelize';
import sequelize from '../config/database';

// Import models
import User, { UserAttributes, UserCreationAttributes } from './User';
import Contact, { ContactAttributes, ContactCreationAttributes } from './Contact';
import Deal, { DealAttributes, DealCreationAttributes } from './Deal';
import Activity, { ActivityAttributes, ActivityCreationAttributes } from './Activity';
import Ticket, { TicketAttributes, TicketCreationAttributes } from './Ticket';
import TicketComment, { TicketCommentAttributes, TicketCommentCreationAttributes } from './TicketComment';
import EmailTemplate, { EmailTemplateAttributes, EmailTemplateCreationAttributes } from './EmailTemplate';
import Campaign, { CampaignAttributes, CampaignCreationAttributes } from './Campaign';
import CampaignRecipient, { CampaignRecipientAttributes, CampaignRecipientCreationAttributes } from './CampaignRecipient';
import Organization, { OrganizationAttributes, OrganizationCreationAttributes } from './Organization';
import AuditLog, { AuditLogAttributes, AuditLogCreationAttributes } from './AuditLog';
import RefreshToken, { RefreshTokenAttributes, RefreshTokenCreationAttributes } from './RefreshToken';
import PasswordReset, { PasswordResetAttributes, PasswordResetCreationAttributes } from './PasswordReset';
import Backup, { BackupAttributes, BackupCreationAttributes } from './Backup';

// Define associations
export const setupAssociations = () => {
  // User associations
  User.hasMany(Contact, { as: 'createdContacts', foreignKey: 'user_id' });
  User.hasMany(Deal, { as: 'ownedDeals', foreignKey: 'user_id' });
  User.hasMany(Activity, { as: 'createdActivities', foreignKey: 'user_id' });
  User.hasMany(Ticket, { as: 'createdTickets', foreignKey: 'user_id' });
  User.hasMany(Ticket, { as: 'assignedTickets', foreignKey: 'assigned_to' });
  User.hasMany(TicketComment, { as: 'ticketComments', foreignKey: 'user_id' });
  User.hasMany(EmailTemplate, { as: 'emailTemplates', foreignKey: 'user_id' });
  User.hasMany(Campaign, { as: 'campaigns', foreignKey: 'user_id' });
  User.hasMany(AuditLog, { as: 'auditLogs', foreignKey: 'user_id' });
  User.hasMany(RefreshToken, { as: 'refreshTokens', foreignKey: 'user_id' });
  User.hasMany(PasswordReset, { as: 'passwordResets', foreignKey: 'user_id' });
  User.belongsTo(Organization, {
    as: 'organization',
    foreignKey: 'organization_id'
  });

  // Contact associations
  Contact.belongsTo(User, { as: 'createdBy', foreignKey: 'user_id' });
  Contact.hasMany(Deal, { as: 'deals', foreignKey: 'contact_id' });
  Contact.hasMany(Activity, { as: 'activities', foreignKey: 'contact_id' });
  Contact.hasMany(Ticket, { as: 'tickets', foreignKey: 'contact_id' });
  Contact.hasMany(CampaignRecipient, { as: 'campaignRecipients', foreignKey: 'contact_id' });

  // Deal associations
  Deal.belongsTo(Contact, { as: 'contact', foreignKey: 'contact_id' });
  Deal.belongsTo(User, { as: 'owner', foreignKey: 'user_id' });
  Deal.hasMany(Activity, { as: 'activities', foreignKey: 'deal_id' });

  // Activity associations
  Activity.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
  Activity.belongsTo(Contact, { as: 'contact', foreignKey: 'contact_id' });
  Activity.belongsTo(Deal, { as: 'deal', foreignKey: 'deal_id' });

  // Ticket associations
  Ticket.belongsTo(Contact, { as: 'contact', foreignKey: 'contact_id' });
  Ticket.belongsTo(User, { as: 'createdBy', foreignKey: 'user_id' });
  Ticket.belongsTo(User, { as: 'assignedTo', foreignKey: 'assigned_to' });
  Ticket.hasMany(TicketComment, { as: 'comments', foreignKey: 'ticket_id' });

  // TicketComment associations
  TicketComment.belongsTo(Ticket, { as: 'ticket', foreignKey: 'ticket_id' });
  TicketComment.belongsTo(User, { as: 'user', foreignKey: 'user_id' });

  // EmailTemplate associations
  EmailTemplate.belongsTo(User, { as: 'createdBy', foreignKey: 'user_id' });
  EmailTemplate.hasMany(Campaign, { as: 'campaigns', foreignKey: 'template_id' });

  // Campaign associations
  Campaign.belongsTo(EmailTemplate, { as: 'template', foreignKey: 'template_id' });
  Campaign.belongsTo(User, { as: 'createdBy', foreignKey: 'user_id' });
  Campaign.hasMany(CampaignRecipient, { as: 'recipients', foreignKey: 'campaign_id' });

  // CampaignRecipient associations
  CampaignRecipient.belongsTo(Campaign, { as: 'campaign', foreignKey: 'campaign_id' });
  CampaignRecipient.belongsTo(Contact, { as: 'contact', foreignKey: 'contact_id' });

  // Organization associations
  Organization.hasMany(User, { as: 'users', foreignKey: 'organization_id' });

  // AuditLog associations
  AuditLog.belongsTo(User, { as: 'user', foreignKey: 'user_id' });

  // RefreshToken associations
  RefreshToken.belongsTo(User, { as: 'user', foreignKey: 'user_id' });

  // PasswordReset associations
  PasswordReset.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
};

// Export models and types
export {
  sequelize,
  Sequelize,
  User,
  UserAttributes,
  UserCreationAttributes,
  Contact,
  ContactAttributes,
  ContactCreationAttributes,
  Deal,
  DealAttributes,
  DealCreationAttributes,
  Activity,
  ActivityAttributes,
  ActivityCreationAttributes,
  Backup,
  BackupAttributes,
  BackupCreationAttributes,
  Ticket,
  TicketAttributes,
  TicketCreationAttributes,
  TicketComment,
  TicketCommentAttributes,
  TicketCommentCreationAttributes,
  EmailTemplate,
  EmailTemplateAttributes,
  EmailTemplateCreationAttributes,
  Campaign,
  CampaignAttributes,
  CampaignCreationAttributes,
  CampaignRecipient,
  CampaignRecipientAttributes,
  CampaignRecipientCreationAttributes,
  Organization,
  OrganizationAttributes,
  OrganizationCreationAttributes,
  AuditLog,
  AuditLogAttributes,
  AuditLogCreationAttributes,
  RefreshToken,
  RefreshTokenAttributes,
  RefreshTokenCreationAttributes,
  PasswordReset,
  PasswordResetAttributes,
  PasswordResetCreationAttributes
};
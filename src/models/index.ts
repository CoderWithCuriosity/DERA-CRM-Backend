import User from './User';
import Contact from './Contact';
import Deal from './Deal';
import Activity from './Activity';
import Ticket from './Ticket';
import TicketComment from './TicketComment';
import EmailTemplate from './EmailTemplate';
import Campaign from './Campaign';
import Organization from './Organization';

// User associations
User.hasMany(Contact, { foreignKey: 'user_id', as: 'contacts' });
User.hasMany(Deal, { foreignKey: 'user_id', as: 'deals' });
User.hasMany(Activity, { foreignKey: 'user_id', as: 'activities' });
User.hasMany(Ticket, { foreignKey: 'user_id', as: 'created_tickets' });
User.hasMany(Ticket, { foreignKey: 'assigned_to', as: 'assigned_tickets' });
User.hasMany(EmailTemplate, { foreignKey: 'user_id', as: 'email_templates' });
User.hasMany(Campaign, { foreignKey: 'user_id', as: 'campaigns' });
User.belongsTo(Organization, { foreignKey: 'organization_id' });

// Contact associations
Contact.belongsTo(User, { foreignKey: 'user_id', as: 'creator' });
Contact.hasMany(Deal, { foreignKey: 'contact_id', as: 'deals' });
Contact.hasMany(Activity, { foreignKey: 'contact_id', as: 'activities' });
Contact.hasMany(Ticket, { foreignKey: 'contact_id', as: 'tickets' });

// Deal associations
Deal.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });
Deal.belongsTo(Contact, { foreignKey: 'contact_id', as: 'contact' });
Deal.hasMany(Activity, { foreignKey: 'deal_id', as: 'activities' });

// Activity associations
Activity.belongsTo(User, { foreignKey: 'user_id', as: 'creator' });
Activity.belongsTo(Contact, { foreignKey: 'contact_id', as: 'contact' });
Activity.belongsTo(Deal, { foreignKey: 'deal_id', as: 'deal' });

// Ticket associations
Ticket.belongsTo(User, { foreignKey: 'user_id', as: 'creator' });
Ticket.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });
Ticket.belongsTo(Contact, { foreignKey: 'contact_id', as: 'contact' });
Ticket.hasMany(TicketComment, { foreignKey: 'ticket_id', as: 'comments' });

// TicketComment associations
TicketComment.belongsTo(Ticket, { foreignKey: 'ticket_id', as: 'ticket' });
TicketComment.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

// EmailTemplate associations
EmailTemplate.belongsTo(User, { foreignKey: 'user_id', as: 'creator' });
EmailTemplate.hasMany(Campaign, { foreignKey: 'template_id', as: 'campaigns' });

// Campaign associations
Campaign.belongsTo(User, { foreignKey: 'user_id', as: 'creator' });
Campaign.belongsTo(EmailTemplate, { foreignKey: 'template_id', as: 'template' });

// Organization associations
Organization.hasMany(User, { foreignKey: 'organization_id', as: 'users' });

export {
    User,
    Contact,
    Deal,
    Activity,
    Ticket,
    TicketComment,
    EmailTemplate,
    Campaign,
    Organization
};
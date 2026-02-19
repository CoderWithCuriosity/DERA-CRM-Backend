import { Optional } from 'sequelize';
import { 
    UserRole, 
    ContactStatus, 
    DealStatus,
    ActivityType,
    ActivityStatus,
    ActivityPriority,
    TicketPriority,
    TicketStatus,
    CampaignStatus,
    UserSettings,
    OrganizationSettings,
    PipelineStage,
    TicketStatusConfig,
    TicketPriorityConfig
} from './index';

// User Attributes
export interface UserAttributes {
    id: number;
    email: string;
    password_hash: string;
    first_name: string | null;
    last_name: string | null;
    role: UserRole;
    avatar: string | null;
    is_verified: boolean;
    verification_token: string | null;
    reset_password_token: string | null;
    reset_password_expires: Date | null;
    last_login: Date | null;
    settings: UserSettings;
    organization_id: number | null;
    created_at: Date;
    updated_at: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 
    'id' | 'avatar' | 'is_verified' | 'verification_token' | 
    'reset_password_token' | 'reset_password_expires' | 'last_login' | 
    'settings' | 'organization_id' | 'created_at' | 'updated_at'
> {}

// Contact Attributes
export interface ContactAttributes {
    id: number;
    user_id: number;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
    job_title: string | null;
    status: ContactStatus;
    source: string | null;
    notes: string | null;
    tags: string[];
    custom_fields: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}

export interface ContactCreationAttributes extends Optional<ContactAttributes,
    'id' | 'first_name' | 'last_name' | 'email' | 'phone' | 'company' |
    'job_title' | 'source' | 'notes' | 'tags' | 'custom_fields' | 
    'created_at' | 'updated_at'
> {}

// Deal Attributes
export interface DealAttributes {
    id: number;
    user_id: number;
    contact_id: number | null;
    name: string;
    stage: string;
    amount: number | null;
    probability: number;
    expected_close_date: Date | null;
    actual_close_date: Date | null;
    status: DealStatus;
    loss_reason: string | null;
    notes: string | null;
    custom_fields: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}

export interface DealCreationAttributes extends Optional<DealAttributes,
    'id' | 'contact_id' | 'amount' | 'expected_close_date' | 
    'actual_close_date' | 'loss_reason' | 'notes' | 'custom_fields' |
    'created_at' | 'updated_at'
> {}

// Activity Attributes
export interface ActivityAttributes {
    id: number;
    user_id: number;
    contact_id: number | null;
    deal_id: number | null;
    type: ActivityType;
    subject: string | null;
    description: string | null;
    duration: number | null;
    outcome: string | null;
    scheduled_date: Date | null;
    completed_date: Date | null;
    status: ActivityStatus;
    priority: ActivityPriority;
    created_at: Date;
    updated_at: Date;
}

export interface ActivityCreationAttributes extends Optional<ActivityAttributes,
    'id' | 'contact_id' | 'deal_id' | 'subject' | 'description' |
    'duration' | 'outcome' | 'completed_date' | 'created_at' | 'updated_at'
> {}

// Ticket Attributes
export interface TicketAttributes {
    id: number;
    ticket_number: string;
    user_id: number;
    contact_id: number | null;
    assigned_to: number | null;
    subject: string;
    description: string | null;
    priority: TicketPriority;
    status: TicketStatus;
    due_date: Date | null;
    resolved_at: Date | null;
    first_response_at: Date | null;
    resolution_time: number | null;
    response_time: number | null;
    satisfaction_rating: number | null;
    satisfaction_comment: string | null;
    tags: string[];
    created_at: Date;
    updated_at: Date;
}

export interface TicketCreationAttributes extends Optional<TicketAttributes,
    'id' | 'ticket_number' | 'contact_id' | 'assigned_to' | 'description' |
    'due_date' | 'resolved_at' | 'first_response_at' | 'resolution_time' |
    'response_time' | 'satisfaction_rating' | 'satisfaction_comment' |
    'tags' | 'created_at' | 'updated_at'
> {}

// Ticket Comment Attributes
export interface TicketCommentAttributes {
    id: number;
    ticket_id: number;
    user_id: number;
    comment: string;
    is_internal: boolean;
    attachments: string[];
    created_at: Date;
    updated_at: Date;
}

export interface TicketCommentCreationAttributes extends Optional<TicketCommentAttributes,
    'id' | 'is_internal' | 'attachments' | 'created_at' | 'updated_at'
> {}

// Email Template Attributes
export interface EmailTemplateAttributes {
    id: number;
    user_id: number;
    name: string;
    subject: string;
    body: string;
    variables: string[];
    is_html: boolean;
    category?: string | null;
    thumbnail?: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface EmailTemplateCreationAttributes extends Optional<EmailTemplateAttributes,
    'id' | 'variables' | 'is_html' | 'category' | 'thumbnail' | 'created_at' | 'updated_at'
> {}

// Campaign Attributes
export interface CampaignAttributes {
    id: number;
    user_id: number;
    template_id: number | null;
    name: string;
    status: CampaignStatus;
    target_list: Record<string, any>;
    target_count: number;
    sent_count: number;
    open_count: number;
    click_count: number;
    bounce_count: number;
    unsubscribe_count: number;
    complaint_count: number;
    scheduled_at: Date | null;
    sent_at: Date | null;
    completed_at: Date | null;
    created_at: Date;
    updated_at: Date;
}

export interface CampaignCreationAttributes extends Optional<CampaignAttributes,
    'id' | 'template_id' | 'target_list' | 'target_count' | 'sent_count' |
    'open_count' | 'click_count' | 'bounce_count' | 'unsubscribe_count' |
    'complaint_count' | 'scheduled_at' | 'sent_at' | 'completed_at' |
    'created_at' | 'updated_at'
> {}

// Campaign Recipient Attributes
export interface CampaignRecipientAttributes {
    id: number;
    campaign_id: number;
    contact_id: number;
    email: string;
    status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed' | 'complained';
    sent_at: Date | null;
    opened_at: Date | null;
    clicked_at: Date | null;
    bounce_reason: string | null;
    tracking_data: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}

export interface CampaignRecipientCreationAttributes extends Optional<CampaignRecipientAttributes,
    'id' | 'sent_at' | 'opened_at' | 'clicked_at' | 'bounce_reason' | 'tracking_data' | 'created_at' | 'updated_at'
> {}

// Organization Attributes
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
    pipeline_stages: PipelineStage[];
    ticket_statuses: TicketStatusConfig[];
    ticket_priorities: TicketPriorityConfig[];
    settings: OrganizationSettings;
    created_at: Date;
    updated_at: Date;
}

export interface OrganizationCreationAttributes extends Optional<OrganizationAttributes,
    'id' | 'company_logo' | 'company_email' | 'company_phone' | 'company_address' |
    'website' | 'pipeline_stages' | 'ticket_statuses' | 'ticket_priorities' |
    'settings' | 'created_at' | 'updated_at'
> {}

// Audit Log Attributes
export interface AuditLogAttributes {
    id: number;
    user_id: number;
    action: string;
    entity_type: string;
    entity_id: number;
    old_values: Record<string, any> | null;
    new_values: Record<string, any> | null;
    changes: Record<string, any> | null;
    ip_address: string;
    user_agent: string | null;
    created_at: Date;
}

export interface AuditLogCreationAttributes extends Optional<AuditLogAttributes,
    'id' | 'old_values' | 'new_values' | 'changes' | 'user_agent' | 'created_at'
> {}

// Notification Attributes
export interface NotificationAttributes {
    id: number;
    user_id: number;
    type: string;
    title: string;
    message: string;
    data: Record<string, any> | null;
    read: boolean;
    read_at: Date | null;
    created_at: Date;
}

export interface NotificationCreationAttributes extends Optional<NotificationAttributes,
    'id' | 'data' | 'read' | 'read_at' | 'created_at'
> {}

// Api Key Attributes
export interface ApiKeyAttributes {
    id: number;
    name: string;
    key: string;
    user_id: number;
    permissions: string[];
    last_used: Date | null;
    expires_at: Date | null;
    created_at: Date;
    updated_at: Date;
}

export interface ApiKeyCreationAttributes extends Optional<ApiKeyAttributes,
    'id' | 'last_used' | 'expires_at' | 'created_at' | 'updated_at'
> {}

// Webhook Attributes
export interface WebhookAttributes {
    id: number;
    organization_id: number;
    url: string;
    events: string[];
    secret: string | null;
    is_active: boolean;
    last_triggered: Date | null;
    failure_count: number;
    created_at: Date;
    updated_at: Date;
}

export interface WebhookCreationAttributes extends Optional<WebhookAttributes,
    'id' | 'secret' | 'last_triggered' | 'failure_count' | 'created_at' | 'updated_at'
> {}
import { Request } from 'express';
import User from '../models/User';
import { Model } from 'sequelize';

// User Types
export type UserRole = 'admin' | 'manager' | 'agent';
export type UserStatus = 'active' | 'inactive' | 'suspended';

// Contact Types
export type ContactStatus = 'active' | 'inactive' | 'lead';
export type ContactSource = 'website' | 'referral' | 'social' | 'email' | 'call' | 'other';

// Deal Types
export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
export type DealStatus = 'open' | 'won' | 'lost';

// Activity Types
export type ActivityType = 'call' | 'email' | 'meeting' | 'task' | 'note';
export type ActivityStatus = 'scheduled' | 'completed' | 'cancelled';
export type ActivityPriority = 'low' | 'medium' | 'high';

// Ticket Types
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'new' | 'open' | 'pending' | 'resolved' | 'closed';

// Campaign Types
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';

// Audit Types
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT';
export type EntityType = 'user' | 'contact' | 'deal' | 'activity' | 'ticket' | 'campaign' | 'template' | 'organization';

// Export Types
export type ExportFormat = 'csv' | 'excel' | 'json';
export type SortOrder = 'asc' | 'desc';

// Settings Types
export type Theme = 'light' | 'dark' | 'system';
export type TimeFormat = '12h' | '24h';
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
export type NotificationType = 'email' | 'push' | 'in_app';
export type EmailTrackingEvent = 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed' | 'complained';

// Pipeline Stage Types
export interface PipelineStage {
    name: string;
    display_name: string;
    probability: number;
    color: string;
    is_active?: boolean;
    order?: number;
}

export interface PipelineStageConfig {
    stages: PipelineStage[];
    default_stage: string;
    won_stage: string;
    lost_stage: string;
}

// Ticket Configuration Types
export interface TicketPriorityConfig {
    name: TicketPriority;
    display_name: string;
    color: string;
    sla_response: number; // hours
    sla_resolution: number; // hours
    is_default?: boolean;
}

export interface TicketStatusConfig {
    name: TicketStatus;
    display_name: string;
    color: string;
    is_closed?: boolean;
    is_resolved?: boolean;
}

// Organization Settings Types
export interface OrganizationSettings {
    allow_duplicate_contacts: boolean;
    require_contact_for_deal: boolean;
    default_deal_probability: number;
    auto_assign_tickets: boolean;
    email_tracking: boolean;
    email_footer: string;
    date_format: DateFormat;
    time_format: TimeFormat;
    business_hours?: BusinessHours;
    working_days?: WorkingDay[];
    ticket_auto_close_days?: number;
    lead_assignment_rule?: 'round_robin' | 'least_busy' | 'manual';
    email_signature?: string;
    currency_symbol?: string;
    thousand_separator?: string;
    decimal_separator?: string;
}

export interface BusinessHours {
    enabled: boolean;
    monday?: TimeRange;
    tuesday?: TimeRange;
    wednesday?: TimeRange;
    thursday?: TimeRange;
    friday?: TimeRange;
    saturday?: TimeRange;
    sunday?: TimeRange;
    timezone: string;
}

export interface TimeRange {
    start: string; // "09:00"
    end: string;   // "17:00"
}

export type WorkingDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// User Settings Types
export interface UserSettings {
    notifications: boolean;
    theme: Theme;
    language: string;
    email_notifications?: boolean;
    push_notifications?: boolean;
    desktop_notifications?: boolean;
    notification_sound?: boolean;
    compact_view?: boolean;
    default_view?: 'list' | 'grid' | 'kanban';
    items_per_page?: number;
    dashboard_widgets?: DashboardWidgetConfig[];
}

export interface DashboardWidgetConfig {
    id: string;
    title: string;
    enabled: boolean;
    position: number;
    size?: 'small' | 'medium' | 'large';
    config?: Record<string, any>;
}

// Request Types
export interface AuthenticatedRequest extends Request {
    user?: User;
    token?: string;
    file?: Express.Multer.File;
    files?: Express.Multer.File[];
}

export interface PaginationQuery {
    page?: string;
    limit?: string;
    sort_by?: string;
    sort_order?: SortOrder;
    search?: string;
}

export interface DateRangeQuery {
    start_date?: string;
    end_date?: string;
}

// Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: ValidationError[];
    timestamp?: string;
    path?: string;
    method?: string;
}

export interface ValidationError {
    msg: string;
    param: string;
    location: string;
    value?: any;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
}

// JWT Types
export interface JwtPayload {
    userId: number;
    email: string;
    role: UserRole;
    organizationId?: number;
}

export interface JwtRefreshPayload {
    userId: number;
}

// Email Types
export interface EmailOptions {
    to: string | string[];
    subject: string;
    template: string;
    data: Record<string, any>;
    attachments?: EmailAttachment[];
    cc?: string | string[];
    bcc?: string | string[];
    from?: string;
    replyTo?: string;
}

export interface EmailAttachment {
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
    cid?: string;
}

// File Upload Types
export interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer?: Buffer;
    url?: string;
}

export interface FileUploadResult {
    success: boolean;
    file?: UploadedFile;
    error?: string;
    url?: string;
}

// Dashboard Types
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
    recent_activities_count: number;
    upcoming_tasks_count: number;
}

export interface SalesChartData {
    labels: string[];
    won_deals: number[];
    lost_deals: number[];
    projected?: number[];
}

export interface PipelineChartData {
    stages: PipelineChartStage[];
    total_value: number;
    weighted_value: number;
}

export interface PipelineChartStage {
    name: string;
    display_name: string;
    count: number;
    value: number;
    weighted_value: number;
    color: string;
    percentage?: number;
}

export interface TicketChartData {
    labels: string[];
    new: number[];
    resolved: number[];
    open?: number[];
}

// Activity Timeline Types
export interface ActivityTimelineItem {
    id: number;
    type: ActivityType;
    subject: string;
    description?: string;
    scheduled_date?: Date;
    completed_date?: Date;
    status: ActivityStatus;
    contact?: {
        id: number;
        name: string;
        company?: string;
        avatar?: string;
    };
    deal?: {
        id: number;
        name: string;
        amount?: number;
    };
    user: {
        id: number;
        name: string;
        avatar?: string;
    };
    created_at: Date;
}

// Task Types
export interface TaskItem {
    id: number;
    type: 'follow-up' | 'call' | 'meeting' | 'task';
    description: string;
    due_date: Date | string;
    priority: ActivityPriority;
    contact?: string;
    contact_id?: number;
    deal?: string;
    deal_id?: number;
    completed?: boolean;
    assigned_to?: number;
    assigned_to_name?: string;
}

export interface TopPerformer {
    user_id: number;
    name: string;
    avatar?: string;
    deals_won: number;
    deals_value: number;
    tickets_resolved: number;
    contacts_created?: number;
    activities_completed?: number;
}

// SLA Types
export interface SLAData {
    response_due: Date;
    resolution_due: Date;
    response_breached: boolean;
    resolution_breached: boolean;
    response_time?: number; // minutes
    resolution_time?: number; // minutes
    response_status?: 'on_track' | 'at_risk' | 'breached';
    resolution_status?: 'on_track' | 'at_risk' | 'breached';
}

export interface SLAMetrics {
    average_response_time: number;
    average_resolution_time: number;
    response_compliance_rate: number;
    resolution_compliance_rate: number;
    breached_tickets: number;
    total_tickets: number;
}

// Import/Export Types
export interface ImportResult {
    import_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    total: number;
    processed: number;
    successful: number;
    failed: number;
    errors: ImportError[];
    completed_at?: Date;
    started_at?: Date;
    file_name?: string;
}

export interface ImportError {
    row: number;
    error: string;
    data?: Record<string, any>;
    field?: string;
}

export interface ExportOptions {
    format: ExportFormat;
    fields?: string[];
    filters?: Record<string, any>;
    include_relations?: string[];
    date_range?: DateRange;
}

export interface DateRange {
    start: Date;
    end: Date;
}

// Webhook Types
export interface WebhookPayload {
    event: string;
    timestamp: Date;
    data: any;
    organization_id?: number;
    user_id?: number;
}

export interface WebhookConfig {
    id: number;
    url: string;
    events: string[];
    secret?: string;
    is_active: boolean;
    created_at: Date;
}

// Notification Types
export interface Notification {
    id: number;
    user_id: number;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    read: boolean;
    read_at?: Date;
    created_at: Date;
}

export interface NotificationPreferences {
    email_notifications: boolean;
    push_notifications: boolean;
    desktop_notifications: boolean;
    deal_assigned: boolean;
    ticket_assigned: boolean;
    ticket_updated: boolean;
    sla_breach: boolean;
    campaign_completed: boolean;
    weekly_digest: boolean;
    monthly_report: boolean;
}

// Search Types
export interface SearchFilters {
    query?: string;
    types?: string[];
    date_range?: DateRange;
    tags?: string[];
    assigned_to?: number[];
    status?: string[];
    priority?: string[];
}

export interface SearchResult {
    id: number;
    type: EntityType;
    title: string;
    description?: string;
    url: string;
    score: number;
    matches?: Record<string, string[]>;
    created_at: Date;
    updated_at: Date;
}

// Report Types
export interface ReportConfig {
    id: number;
    name: string;
    type: 'sales' | 'support' | 'activity' | 'custom';
    filters: Record<string, any>;
    columns: string[];
    schedule?: ReportSchedule;
    created_by: number;
    created_at: Date;
}

export interface ReportSchedule {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    day_of_week?: number;
    day_of_month?: number;
    recipients: string[];
    format: ExportFormat;
}

export interface ReportData {
    config: ReportConfig;
    generated_at: Date;
    data: any[];
    summary?: Record<string, any>;
    charts?: Record<string, any>;
}

// Integration Types
export interface IntegrationConfig {
    id: number;
    name: string;
    type: 'slack' | 'teams' | 'zapier' | 'custom';
    settings: Record<string, any>;
    is_active: boolean;
    last_sync?: Date;
    created_at: Date;
}

// Audit Log Types
export interface AuditLogEntry {
    id: number;
    user_id: number;
    user_name: string;
    user_email?: string;
    action: AuditAction;
    entity_type: EntityType;
    entity_id: number;
    details: string;
    changes?: AuditChange[];
    ip_address: string;
    user_agent?: string;
    created_at: Date;
}

export interface AuditChange {
    field: string;
    old_value: any;
    new_value: any;
}

// API Key Types
export interface ApiKey {
    id: number;
    name: string;
    key: string;
    user_id: number;
    permissions: string[];
    last_used?: Date;
    expires_at?: Date;
    created_at: Date;
}

// Template Types
export interface EmailTemplateData {
    id: number;
    name: string;
    subject: string;
    body: string;
    variables: string[];
    is_html: boolean;
    category?: string;
    thumbnail?: string;
    created_at: Date;
    updated_at: Date;
}

// System Status Types
export interface SystemStatus {
    status: 'healthy' | 'degraded' | 'down';
    version: string;
    uptime: number;
    database: 'connected' | 'disconnected' | 'degraded';
    redis?: 'connected' | 'disconnected';
    queue?: 'healthy' | 'degraded';
    storage: {
        used: number;
        total: number;
        percentage: number;
    };
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
    cpu: number;
    last_checked: Date;
}
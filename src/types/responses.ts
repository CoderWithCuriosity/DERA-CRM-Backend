import { 
    UserAttributes, 
    ContactAttributes, 
    DealAttributes, 
    ActivityAttributes,
    TicketAttributes,
    TicketCommentAttributes,
    EmailTemplateAttributes,
    CampaignAttributes,
    OrganizationAttributes,
    CampaignRecipientAttributes,
    WebhookAttributes
} from './models';
import { 
    DashboardSummary, 
    SalesChartData, 
    PipelineChartData, 
    TicketChartData,
    SLAData,
    ActivityTimelineItem,
    PipelineStage,
    OrganizationSettings,
    ReportData,
    IntegrationConfig,
    TicketStatusConfig,
    TicketPriorityConfig,
    TicketPriority,
    TicketStatus,
    ActivityPriority
} from './index';

// Auth Responses
export interface AuthResponse {
    user: UserAttributes & {
        organization?: {
            id: number;
            name: string;
            logo: string | null;
            settings?: OrganizationSettings;
        };
        permissions?: string[];
    };
    token: string;
    refreshToken?: string;
    expires_in?: number;
}

export interface UserResponse extends UserAttributes {
    full_name?: string;
    organization_name?: string;
    permissions?: string[];
}

// Contact Responses
export interface ContactResponse extends ContactAttributes {
    full_name?: string;
    open_deals_count?: number;
    open_tickets_count?: number;
    last_activity?: Date;
    last_activity_type?: string;
    deals?: DealAttributes[];
    tickets?: TicketAttributes[];
    activities?: ActivityAttributes[];
    created_by?: {
        id: number;
        name: string;
    };
}

export interface ContactListResponse {
    contacts: ContactResponse[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
    filters: {
        tags: Array<{ name: string; count: number }>;
        statuses: Array<{ status: string; count: number }>;
        sources: Array<{ source: string; count: number }>;
    };
    summary?: {
        total: number;
        active: number;
        leads: number;
    };
}

// Deal Responses
export interface DealResponse extends DealAttributes {
    contact?: {
        id: number;
        first_name: string | null;
        last_name: string | null;
        full_name: string | null;
        company: string | null;
        email?: string;
        phone?: string;
        avatar?: string;
    };
    owner?: {
        id: number;
        first_name: string | null;
        last_name: string | null;
        full_name: string | null;
        email: string;
        avatar?: string;
    };
    activities?: ActivityAttributes[];
    weighted_amount?: number;
    days_open?: number;
    stage_display?: string;
    stage_color?: string;
}

export interface DealListResponse {
    deals: DealResponse[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
    summary: PipelineSummary;
}

export interface PipelineSummary {
    total_value: number;
    weighted_value: number;
    by_stage: Record<string, number>;
    by_stage_value: Record<string, number>;
    stages?: PipelineStageData[];
    forecast?: ForecastData;
    win_rate?: number;
    average_deal_size?: number;
    sales_cycle?: number; // average days to close
}

export interface PipelineStageData {
    name: string;
    display_name: string;
    count: number;
    value: number;
    weighted_value: number;
    color: string;
    probability: number;
    percentage?: number;
}

export interface ForecastData {
    this_month: {
        value: number;
        weighted: number;
        count: number;
    };
    next_month: {
        value: number;
        weighted: number;
        count: number;
    };
    quarter: {
        value: number;
        weighted: number;
        count: number;
    };
}

export interface KanbanColumn {
    id: string;
    title: string;
    color: string;
    limit: number;
    deals: KanbanDeal[];
    total_value?: number;
    weighted_value?: number;
}

export interface KanbanDeal {
    id: number;
    name: string;
    amount: number | null;
    probability: number;
    expected_close_date: Date | null;
    contact_name: string | null;
    contact_company: string | null;
    avatar: string | null;
    has_activity_today: boolean;
    owner_name?: string;
    priority?: 'high' | 'medium' | 'low';
}

// Activity Responses
export interface ActivityResponse extends ActivityAttributes {
    contact?: {
        id: number;
        first_name: string | null;
        last_name: string | null;
        full_name: string | null;
        company: string | null;
        avatar?: string;
    };
    deal?: {
        id: number;
        name: string;
        amount: number | null;
        stage?: string;
    };
    user?: {
        id: number;
        first_name: string | null;
        last_name: string | null;
        full_name: string | null;
        avatar?: string;
    };
    is_overdue?: boolean;
    is_completed?: boolean;
}

export interface ActivityListResponse {
    activities: ActivityResponse[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
    summary?: {
        today: number;
        upcoming: number;
        overdue: number;
        completed: number;
    };
}

export interface TodayActivitiesResponse {
    date: string;
    activities: ActivityResponse[];
    summary: {
        total: number;
        completed: number;
        scheduled: number;
        overdue: number;
        by_type: Record<string, number>;
    };
}

// Ticket Responses
export interface TicketResponse extends TicketAttributes {
    contact?: {
        id: number;
        first_name: string | null;
        last_name: string | null;
        full_name: string | null;
        email: string | null;
        company: string | null;
        avatar?: string;
    };
    creator?: {
        id: number;
        first_name: string | null;
        last_name: string | null;
        full_name: string | null;
        avatar?: string;
    };
    assignee?: {
        id: number;
        first_name: string | null;
        last_name: string | null;
        full_name: string | null;
        avatar?: string;
        email?: string;
    };
    comments?: TicketCommentAttributes[];
    comment_count?: number;
    sla?: SLAData & {
        response_due: Date;
        resolution_due: Date;
        response_breached: boolean;
        resolution_breached: boolean;
        response_status?: 'on_track' | 'at_risk' | 'breached';
        resolution_status?: 'on_track' | 'at_risk' | 'breached';
    };
    is_overdue?: boolean;
    priority_display?: string;
    priority_color?: string;
    status_display?: string;
    status_color?: string;
}

export interface TicketListResponse {
    tickets: TicketResponse[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
    summary: {
        by_status: Record<TicketStatus, number>;
        by_priority: Record<TicketPriority, number>;
        by_assignee: Array<{
            user_id: number;
            name: string;
            count: number;
        }>;
        sla_compliance: {
            response: number;
            resolution: number;
        };
    };
}

export interface TicketCommentResponse extends TicketCommentAttributes {
    user?: {
        id: number;
        first_name: string | null;
        last_name: string | null;
        full_name: string | null;
        avatar?: string | null;
        email?: string;
    };
    is_editable?: boolean;
}

export interface SLAResponse {
    period: {
        start: Date;
        end: Date;
    };
    response_times: {
        average: number;
        median: number;
        min: number;
        max: number;
        breached: number;
        total: number;
        compliance_rate: number;
    };
    resolution_times: {
        average: number;
        median: number;
        min: number;
        max: number;
        breached: number;
        total: number;
        compliance_rate: number;
    };
    by_priority: Record<string, {
        response_compliance: number;
        resolution_compliance: number;
        average_response: number;
        average_resolution: number;
    }>;
    daily_breaches: Array<{
        date: string;
        response_breaches: number;
        resolution_breaches: number;
    }>;
    trends?: {
        response_trend: number[];
        resolution_trend: number[];
    };
}

// Email Template Responses
export interface EmailTemplateResponse extends EmailTemplateAttributes {
    campaigns_count?: number;
    preview?: string;
    last_used?: Date;
    created_by?: {
        id: number;
        name: string;
    };
}

export interface EmailTemplateListResponse {
    templates: EmailTemplateResponse[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
    categories?: Array<{
        name: string;
        count: number;
    }>;
}

export interface TemplatePreviewResponse {
    subject: string;
    body: string;
    preview_html: string;
    text_version?: string;
    used_variables?: string[];
    missing_variables?: string[];
}

// Campaign Responses
export interface CampaignResponse extends CampaignAttributes {
    template?: EmailTemplateAttributes;
    open_rate?: number;
    click_rate?: number;
    bounce_rate?: number;
    unsubscribe_rate?: number;
    complaint_rate?: number;
    recipients?: CampaignRecipientAttributes[];
    created_by?: {
        id: number;
        name: string;
    };
    progress?: {
        sent_percentage: number;
        open_percentage: number;
        click_percentage: number;
    };
}

export interface CampaignListResponse {
    campaigns: CampaignResponse[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
    summary?: {
        total_sent: number;
        total_opens: number;
        total_clicks: number;
        average_open_rate: number;
        average_click_rate: number;
    };
}

export interface CampaignAnalyticsResponse {
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
        complaint_rate: number;
    };
    hourly_opens: Array<{
        hour: string;
        opens: number;
        unique_opens: number;
    }>;
    daily_opens: Array<{
        date: string;
        opens: number;
        clicks: number;
    }>;
    device_breakdown: Record<string, number>;
    browser_breakdown: Record<string, number>;
    location_breakdown: Array<{
        country: string;
        opens: number;
        percentage: number;
    }>;
    top_links: Array<{
        url: string;
        clicks: number;
        unique_clicks: number;
        percentage: number;
    }>;
}

// Dashboard Responses
export interface DashboardResponse {
    summary: DashboardSummary;
    sales_chart: SalesChartData;
    pipeline_chart: PipelineChartData;
    ticket_chart: TicketChartData;
    recent_activities: ActivityTimelineItem[];
    task_list: TaskItem[];
    top_performers: TopPerformer[];
    upcoming_activities?: ActivityTimelineItem[];
    recent_deals?: DealResponse[];
    recent_tickets?: TicketResponse[];
    notifications?: NotificationResponse[];
}

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
    created_by?: string;
    created_at?: Date;
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
    satisfaction_score?: number;
}

// Admin Responses
export interface SystemStatsResponse {
    users: {
        total: number;
        active_today: number;
        active_this_week: number;
        by_role: Record<string, number>;
        new_this_month: number;
    };
    contacts: {
        total: number;
        active: number;
        inactive: number;
        leads: number;
        new_today: number;
        new_this_week: number;
    };
    deals: {
        total: number;
        open: number;
        won: number;
        lost: number;
        value: number;
        weighted_value: number;
        won_value: number;
    };
    tickets: {
        total: number;
        open: number;
        resolved: number;
        closed: number;
        avg_response_time: number;
        avg_resolution_time: number;
        sla_compliance: number;
    };
    campaigns: {
        total: number;
        sent: number;
        scheduled: number;
        drafts: number;
        total_sent: number;
        avg_open_rate: number;
    };
    storage: {
        used: string;
        used_bytes: number;
        total: string;
        total_bytes: number;
        percentage: number;
        by_type: Record<string, number>;
    };
    api_usage: {
        today: number;
        this_week: number;
        this_month: number;
        by_endpoint: Record<string, number>;
    };
    performance: {
        avg_response_time: number;
        db_query_time: number;
        memory_usage: number;
        cpu_usage: number;
    };
}

export interface AuditLogEntry {
    id: number;
    user_id: number;
    user_name: string;
    user_email?: string;
    action: string;
    entity_type: string;
    entity_id: number;
    details: string;
    changes?: Array<{
        field: string;
        old_value: any;
        new_value: any;
    }>;
    ip_address: string;
    user_agent?: string;
    created_at: Date;
}

export interface AuditLogResponse {
    logs: AuditLogEntry[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
    filters?: {
        actions: string[];
        entity_types: string[];
        users: Array<{ id: number; name: string }>;
        date_range?: { start: Date; end: Date };
    };
}

export interface UserActivityReport {
    period: {
        start: Date;
        end: Date;
    };
    users: Array<{
        user_id: number;
        name: string;
        email: string;
        role: string;
        avatar?: string;
        activities: {
            contacts_created: number;
            deals_created: number;
            deals_won: number;
            deals_lost: number;
            tickets_created: number;
            tickets_resolved: number;
            campaigns_sent: number;
            logins: number;
            activities_completed: number;
            total_actions: number;
        };
        performance: {
            win_rate: number;
            avg_deal_value: number;
            ticket_resolution_time: number;
            satisfaction_score?: number;
        };
    }>;
    summary: {
        total_contacts_created: number;
        total_deals_created: number;
        total_deals_won: number;
        total_deals_value: number;
        total_tickets_resolved: number;
        avg_win_rate: number;
    };
}

// Import/Export Responses
export interface ImportStatusResponse {
    import_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    total: number;
    processed: number;
    successful: number;
    failed: number;
    errors?: ImportError[];
    completed_at?: Date;
    started_at?: Date;
    file_name?: string;
    progress?: number;
    estimated_time_remaining?: number;
}

export interface ImportError {
    row: number;
    error: string;
    data?: Record<string, any>;
    field?: string;
    severity?: 'warning' | 'error';
}

export interface ExportResponse {
    download_url: string;
    expires_at: Date;
    file_name: string;
    file_size?: number;
    format: string;
    record_count: number;
}

// Health Check Response
export interface HealthCheckResponse {
    status: 'ok' | 'error' | 'degraded';
    success: boolean;
    timestamp: string;
    service: string;
    version: string;
    environment: string;
    database: 'connected' | 'disconnected' | 'degraded';
    redis?: 'connected' | 'disconnected';
    queue?: 'healthy' | 'degraded' | 'down';
    uptime: number;
    memory: {
        heapUsed: string;
        heapTotal: string;
        rss: string;
        external: string;
        heapUsed_bytes: number;
        heapTotal_bytes: number;
    };
    cpu: {
        load_avg: number[];
        cores: number;
    };
    dependencies: Record<string, {
        status: 'healthy' | 'unhealthy';
        latency?: number;
    }>;
}

// Notification Responses
export interface NotificationResponse {
    id: number;
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    read: boolean;
    read_at?: Date;
    created_at: Date;
    time_ago?: string;
}

export interface NotificationListResponse {
    notifications: NotificationResponse[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
        unread_count: number;
    };
}

// Search Responses
export interface SearchResponse {
    query: string;
    results: SearchResult[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
    facets?: {
        types: Array<{ type: string; count: number }>;
        dates?: Array<{ date: string; count: number }>;
        users?: Array<{ user_id: number; name: string; count: number }>;
    };
    did_you_mean?: string[];
}

export interface SearchResult {
    id: number;
    type: string;
    title: string;
    description?: string;
    url: string;
    score: number;
    matches?: Record<string, string[]>;
    created_at: Date;
    updated_at: Date;
    thumbnail?: string;
    metadata?: Record<string, any>;
}

// Report Responses
export interface ReportResponse {
    id: number;
    name: string;
    type: string;
    generated_at: Date;
    data: ReportData;
    download_url?: string;
    expires_at?: Date;
    format?: string;
}

export interface ReportListResponse {
    reports: Array<{
        id: number;
        name: string;
        type: string;
        created_at: Date;
        created_by: string;
        size?: number;
        format?: string;
    }>;
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

// Integration Responses
export interface IntegrationResponse extends IntegrationConfig {
    status: 'active' | 'inactive' | 'error';
    last_sync_status?: 'success' | 'failed' | 'pending';
    last_sync_message?: string;
    is_configured: boolean;
}

export interface IntegrationListResponse {
    integrations: IntegrationResponse[];
    available_integrations: Array<{
        type: string;
        name: string;
        description: string;
        icon?: string;
        is_available: boolean;
        documentation_url?: string;
    }>;
}

// API Key Responses
export interface ApiKeyResponse {
    id: number;
    name: string;
    key?: string; // Only shown once on creation
    permissions: string[];
    last_used?: Date;
    expires_at?: Date;
    created_at: Date;
}

export interface ApiKeyListResponse {
    keys: ApiKeyResponse[];
    total: number;
}

// Webhook Responses
export interface WebhookResponse extends WebhookAttributes {
    status: 'active' | 'inactive' | 'failing';
    recent_deliveries?: Array<{
        id: string;
        event: string;
        status: 'success' | 'failed';
        timestamp: Date;
        latency: number;
        response_code?: number;
    }>;
}

export interface WebhookDeliveryResponse {
    id: string;
    webhook_id: number;
    event: string;
    payload: any;
    status: 'pending' | 'delivered' | 'failed';
    response_code?: number;
    response_body?: string;
    attempts: number;
    created_at: Date;
    delivered_at?: Date;
    next_retry?: Date;
}

// Organization Responses
export interface OrganizationResponse extends OrganizationAttributes {
    users_count?: number;
    contacts_count?: number;
    deals_count?: number;
    tickets_count?: number;
    storage_used?: number;
    subscription?: {
        plan: string;
        status: string;
        expires_at?: Date;
        features: string[];
    };
}

export interface PipelineStageConfigResponse {
    stages: PipelineStage[];
    default_stage: string;
    won_stage: string;
    lost_stage: string;
    can_customize: boolean;
}

export interface TicketConfigResponse {
    statuses: TicketStatusConfig[];
    priorities: TicketPriorityConfig[];
    default_status: string;
    default_priority: string;
}

// File Upload Responses
export interface FileUploadResponse {
    success: boolean;
    file: {
        id?: string;
        name: string;
        size: number;
        type: string;
        url: string;
        thumbnail_url?: string;
        uploaded_at: Date;
    };
    message?: string;
}

export interface FileListResponse {
    files: Array<{
        id: string;
        name: string;
        size: number;
        type: string;
        url: string;
        thumbnail_url?: string;
        uploaded_by: string;
        uploaded_at: Date;
        related_to?: {
            type: string;
            id: number;
        };
    }>;
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}
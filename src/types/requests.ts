import { 
    UserRole, 
    ContactStatus, 
    ActivityType,
    ActivityPriority,
    TicketPriority,
    TicketStatus,
    UserSettings,
    PipelineStage,
    OrganizationSettings,
    DateRange,
    TicketStatusConfig,
    TicketPriorityConfig
} from './index';

// Auth Requests
export interface RegisterRequest {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    password: string;
}

export interface ResendVerificationRequest {
    email: string;
}

// User Requests
export interface UpdateProfileRequest {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    avatar?: string;
}

export interface ChangePasswordRequest {
    current_password: string;
    new_password: string;
}

export interface UpdateUserRoleRequest {
    role: UserRole;
}

export interface UpdateUserSettingsRequest {
    settings: Partial<UserSettings>;
}

// Contact Requests
export interface CreateContactRequest {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    company?: string;
    job_title?: string;
    status?: ContactStatus;
    source?: string;
    notes?: string;
    tags?: string[];
    custom_fields?: Record<string, any>;
}

export interface UpdateContactRequest extends Partial<CreateContactRequest> {}

export interface AddTagRequest {
    tag: string;
}

export interface ImportContactsRequest {
    column_mapping: Record<string, string>;
    duplicate_handling?: 'skip' | 'update' | 'create';
}

// Deal Requests
export interface CreateDealRequest {
    name: string;
    contact_id?: number;
    stage: string;
    amount?: number;
    probability?: number;
    expected_close_date?: string;
    notes?: string;
    user_id?: number;
    custom_fields?: Record<string, any>;
}

export interface UpdateDealRequest extends Partial<CreateDealRequest> {}

export interface UpdateDealStageRequest {
    stage: string;
    actual_close_date?: string;
}

export interface MarkDealAsWonRequest {
    actual_close_date?: string;
    notes?: string;
}

export interface MarkDealAsLostRequest {
    actual_close_date?: string;
    loss_reason?: string;
    notes?: string;
}

export interface BulkUpdateDealsRequest {
    deal_ids: number[];
    stage?: string;
    user_id?: number;
    probability?: number;
}

// Activity Requests
export interface CreateActivityRequest {
    type: ActivityType;
    subject?: string;
    description?: string;
    contact_id?: number;
    deal_id?: number;
    scheduled_date?: string;
    duration?: number;
    priority?: ActivityPriority;
}

export interface UpdateActivityRequest extends Partial<CreateActivityRequest> {}

export interface CompleteActivityRequest {
    outcome?: string;
    duration?: number;
    completed_date?: string;
}

// Ticket Requests
export interface CreateTicketRequest {
    subject: string;
    description?: string;
    contact_id?: number;
    priority?: TicketPriority;
    due_date?: string;
    tags?: string[];
    attachments?: string[];
}

export interface UpdateTicketRequest extends Partial<CreateTicketRequest> {}

export interface UpdateTicketStatusRequest {
    status: TicketStatus;
    resolution_notes?: string;
}

export interface AssignTicketRequest {
    assigned_to: number;
}

export interface AddTicketCommentRequest {
    comment: string;
    is_internal?: boolean;
    attachments?: string[];
}

export interface RateTicketRequest {
    rating: number; // 1-5
    comment?: string;
}

// Email Template Requests
export interface CreateEmailTemplateRequest {
    name: string;
    subject: string;
    body: string;
    variables?: string[];
    is_html?: boolean;
    category?: string;
    thumbnail?: string;
}

export interface UpdateEmailTemplateRequest extends Partial<CreateEmailTemplateRequest> {}

export interface PreviewTemplateRequest {
    test_data: Record<string, any>;
}

// Campaign Requests
export interface CreateCampaignRequest {
    name: string;
    template_id?: number;
    target_list: {
        contact_ids?: number[];
        filters?: Record<string, any>;
        tags?: string[];
        exclude_ids?: number[];
    };
    scheduled_at?: string;
    from_name?: string;
    from_email?: string;
    reply_to?: string;
}

export interface UpdateCampaignRequest extends Partial<CreateCampaignRequest> {}

export interface SendCampaignRequest {
    send_immediately?: boolean;
    test_mode?: boolean;
    test_email?: string;
}

export interface TestCampaignRequest {
    test_email: string;
    test_data: Record<string, any>;
}

// Organization Requests
export interface UpdateOrganizationRequest {
    company_name?: string;
    company_email?: string;
    company_phone?: string;
    company_address?: string;
    website?: string;
    timezone?: string;
    currency?: string;
    settings?: Partial<OrganizationSettings>;
}

export interface UpdatePipelineStagesRequest {
    stages: PipelineStage[];
}

export interface UpdateTicketStatusesRequest {
    statuses: TicketStatusConfig[];
}

export interface UpdateTicketPrioritiesRequest {
    priorities: TicketPriorityConfig[];
}

// Dashboard Requests
export interface DashboardQuery {
    user_id?: string;
    period?: 'today' | 'week' | 'month' | 'quarter' | 'year';
    include_charts?: boolean;
}

export interface SalesChartQuery {
    period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
    start_date?: string;
    end_date?: string;
    user_id?: string;
    compare_previous?: boolean;
}

export interface TicketChartQuery {
    days?: string;
    user_id?: string;
    group_by?: 'day' | 'week' | 'month' | 'priority' | 'status';
}

// Search Requests
export interface SearchRequest {
    query: string;
    types?: string[];
    page?: number;
    limit?: number;
    filters?: Record<string, any>;
}

// Report Requests
export interface GenerateReportRequest {
    name: string;
    type: 'sales' | 'support' | 'activity' | 'custom';
    filters: Record<string, any>;
    columns: string[];
    format?: 'json' | 'csv' | 'excel';
    date_range?: DateRange;
}

export interface ScheduleReportRequest extends GenerateReportRequest {
    schedule: {
        frequency: 'daily' | 'weekly' | 'monthly';
        time: string;
        day_of_week?: number;
        day_of_month?: number;
        recipients: string[];
    };
}

// Integration Requests
export interface ConfigureIntegrationRequest {
    name: string;
    type: 'slack' | 'teams' | 'zapier' | 'custom';
    settings: Record<string, any>;
    webhook_url?: string;
    events?: string[];
}

// Api Key Requests
export interface CreateApiKeyRequest {
    name: string;
    permissions: string[];
    expires_in_days?: number;
}

// Webhook Requests
export interface CreateWebhookRequest {
    url: string;
    events: string[];
    secret?: string;
    is_active?: boolean;
}

export interface UpdateWebhookRequest extends Partial<CreateWebhookRequest> {}

// Bulk Operations
export interface BulkDeleteRequest {
    ids: number[];
    permanent?: boolean;
}

export interface BulkExportRequest {
    ids?: number[];
    filters?: Record<string, any>;
    format: 'csv' | 'excel' | 'json';
    fields?: string[];
}

// Filter Requests
export interface DateFilterRequest {
    start_date: string;
    end_date: string;
    field?: string;
}

export interface TagFilterRequest {
    tags: string[];
    match_all?: boolean;
}

export interface StatusFilterRequest {
    statuses: string[];
}

export interface AssigneeFilterRequest {
    assigned_to: number[];
    include_unassigned?: boolean;
}
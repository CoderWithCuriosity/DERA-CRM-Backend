export enum UserRole {
    ADMIN = 'admin',
    MANAGER = 'manager',
    AGENT = 'agent'
}

export enum ContactStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    LEAD = 'lead'
}

export enum DealStatus {
    OPEN = 'open',
    WON = 'won',
    LOST = 'lost'
}

export enum DealStage {
    LEAD = 'lead',
    QUALIFIED = 'qualified',
    PROPOSAL = 'proposal',
    NEGOTIATION = 'negotiation',
    WON = 'won',
    LOST = 'lost'
}

export enum ActivityType {
    CALL = 'call',
    EMAIL = 'email',
    MEETING = 'meeting',
    TASK = 'task',
    NOTE = 'note'
}

export enum ActivityStatus {
    SCHEDULED = 'scheduled',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

export enum ActivityPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high'
}

export enum TicketPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent'
}

export enum TicketStatus {
    NEW = 'new',
    OPEN = 'open',
    PENDING = 'pending',
    RESOLVED = 'resolved',
    CLOSED = 'closed'
}

export enum CampaignStatus {
    DRAFT = 'draft',
    SCHEDULED = 'scheduled',
    SENDING = 'sending',
    SENT = 'sent',
    CANCELLED = 'cancelled'
}

export enum AuditAction {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    VIEW = 'VIEW',
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT'
}

export enum EntityType {
    USER = 'user',
    CONTACT = 'contact',
    DEAL = 'deal',
    ACTIVITY = 'activity',
    TICKET = 'ticket',
    CAMPAIGN = 'campaign',
    TEMPLATE = 'template',
    ORGANIZATION = 'organization'
}

export enum ExportFormat {
    CSV = 'csv',
    EXCEL = 'excel',
    JSON = 'json'
}

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc'
}

export enum Theme {
    LIGHT = 'light',
    DARK = 'dark',
    SYSTEM = 'system'
}

export enum TimeFormat {
    HOUR_12 = '12h',
    HOUR_24 = '24h'
}

export enum DateFormat {
    MM_DD_YYYY = 'MM/DD/YYYY',
    DD_MM_YYYY = 'DD/MM/YYYY',
    YYYY_MM_DD = 'YYYY-MM-DD'
}

export enum NotificationType {
    EMAIL = 'email',
    PUSH = 'push',
    IN_APP = 'in_app'
}

export enum EmailTrackingEvent {
    SENT = 'sent',
    DELIVERED = 'delivered',
    OPENED = 'opened',
    CLICKED = 'clicked',
    BOUNCED = 'bounced',
    UNSUBSCRIBED = 'unsubscribed',
    COMPLAINED = 'complained'
}
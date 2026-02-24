/**
 * Contact statuses
 */
export const CONTACT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  LEAD: 'lead'
} as const;

export type ContactStatus = typeof CONTACT_STATUS[keyof typeof CONTACT_STATUS];

/**
 * Contact status display names
 */
export const CONTACT_STATUS_DISPLAY: Record<ContactStatus, string> = {
  [CONTACT_STATUS.ACTIVE]: 'Active',
  [CONTACT_STATUS.INACTIVE]: 'Inactive',
  [CONTACT_STATUS.LEAD]: 'Lead'
};

/**
 * Contact status colors
 */
export const CONTACT_STATUS_COLORS: Record<ContactStatus, string> = {
  [CONTACT_STATUS.ACTIVE]: '#10B981',
  [CONTACT_STATUS.INACTIVE]: '#6B7280',
  [CONTACT_STATUS.LEAD]: '#3B82F6'
};

/**
 * Contact sources
 */
export const CONTACT_SOURCES = {
  WEBSITE: 'website',
  REFERRAL: 'referral',
  SOCIAL: 'social',
  EMAIL: 'email',
  CALL: 'call',
  EVENT: 'event',
  OTHER: 'other'
} as const;

export type ContactSource = typeof CONTACT_SOURCES[keyof typeof CONTACT_SOURCES];

/**
 * Contact source display names
 */
export const CONTACT_SOURCE_DISPLAY: Record<ContactSource, string> = {
  [CONTACT_SOURCES.WEBSITE]: 'Website',
  [CONTACT_SOURCES.REFERRAL]: 'Referral',
  [CONTACT_SOURCES.SOCIAL]: 'Social Media',
  [CONTACT_SOURCES.EMAIL]: 'Email',
  [CONTACT_SOURCES.CALL]: 'Phone Call',
  [CONTACT_SOURCES.EVENT]: 'Event',
  [CONTACT_SOURCES.OTHER]: 'Other'
};

/**
 * Deal statuses
 */
export const DEAL_STATUS = {
  OPEN: 'open',
  WON: 'won',
  LOST: 'lost'
} as const;

export type DealStatus = typeof DEAL_STATUS[keyof typeof DEAL_STATUS];

/**
 * Deal status display names
 */
export const DEAL_STATUS_DISPLAY: Record<DealStatus, string> = {
  [DEAL_STATUS.OPEN]: 'Open',
  [DEAL_STATUS.WON]: 'Won',
  [DEAL_STATUS.LOST]: 'Lost'
};

/**
 * Deal status colors
 */
export const DEAL_STATUS_COLORS: Record<DealStatus, string> = {
  [DEAL_STATUS.OPEN]: '#3B82F6',
  [DEAL_STATUS.WON]: '#10B981',
  [DEAL_STATUS.LOST]: '#EF4444'
};

/**
 * Activity statuses
 */
export const ACTIVITY_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  OVERDUE: 'overdue'
} as const;

export type ActivityStatus = typeof ACTIVITY_STATUS[keyof typeof ACTIVITY_STATUS];

/**
 * Activity status display names
 */
export const ACTIVITY_STATUS_DISPLAY: Record<ActivityStatus, string> = {
  [ACTIVITY_STATUS.SCHEDULED]: 'Scheduled',
  [ACTIVITY_STATUS.COMPLETED]: 'Completed',
  [ACTIVITY_STATUS.CANCELLED]: 'Cancelled',
  [ACTIVITY_STATUS.OVERDUE]: 'Overdue'
};

/**
 * Activity status colors
 */
export const ACTIVITY_STATUS_COLORS: Record<ActivityStatus, string> = {
  [ACTIVITY_STATUS.SCHEDULED]: '#3B82F6',
  [ACTIVITY_STATUS.COMPLETED]: '#10B981',
  [ACTIVITY_STATUS.CANCELLED]: '#6B7280',
  [ACTIVITY_STATUS.OVERDUE]: '#EF4444'
};

/**
 * Campaign statuses
 */
export const CAMPAIGN_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  SENDING: 'sending',
  SENT: 'sent',
  CANCELLED: 'cancelled'
} as const;

export type CampaignStatus = typeof CAMPAIGN_STATUS[keyof typeof CAMPAIGN_STATUS];

/**
 * Campaign status display names
 */
export const CAMPAIGN_STATUS_DISPLAY: Record<CampaignStatus, string> = {
  [CAMPAIGN_STATUS.DRAFT]: 'Draft',
  [CAMPAIGN_STATUS.SCHEDULED]: 'Scheduled',
  [CAMPAIGN_STATUS.SENDING]: 'Sending',
  [CAMPAIGN_STATUS.SENT]: 'Sent',
  [CAMPAIGN_STATUS.CANCELLED]: 'Cancelled'
};

/**
 * Campaign status colors
 */
export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
  [CAMPAIGN_STATUS.DRAFT]: '#6B7280',
  [CAMPAIGN_STATUS.SCHEDULED]: '#3B82F6',
  [CAMPAIGN_STATUS.SENDING]: '#F59E0B',
  [CAMPAIGN_STATUS.SENT]: '#10B981',
  [CAMPAIGN_STATUS.CANCELLED]: '#EF4444'
};
export const NOTIFICATION_TYPES = {
  ACTIVITY_REMINDER: 'activity_reminder',
  TICKET_ASSIGNED: 'ticket_assigned',
  TICKET_COMMENT: 'ticket_comment',
  TICKET_RESOLVED: 'ticket_resolved',
  TICKET_SLA_WARNING: 'ticket_sla_warning',
  TICKET_SLA_BREACH: 'ticket_sla_breach',
  DEAL_ASSIGNED: 'deal_assigned',
  DEAL_WON: 'deal_won',
  CAMPAIGN_SENT: 'campaign_sent',
  MESSAGE_RECEIVED: 'message_received',
  COMMENT_MENTION: 'comment_mention'
} as const;

export const MESSAGE_PARTICIPANT_STATUS = {
  ACTIVE: 'active',
  LEFT: 'left',
  HIDDEN: 'hidden'
} as const;
/**
 * Ticket statuses
 */
export const TICKET_STATUS = {
  NEW: 'new',
  OPEN: 'open',
  PENDING: 'pending',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
} as const;

export type TicketStatus = typeof TICKET_STATUS[keyof typeof TICKET_STATUS];

/**
 * Ticket status display names
 */
export const TICKET_STATUS_DISPLAY: Record<TicketStatus, string> = {
  [TICKET_STATUS.NEW]: 'New',
  [TICKET_STATUS.OPEN]: 'Open',
  [TICKET_STATUS.PENDING]: 'Pending',
  [TICKET_STATUS.RESOLVED]: 'Resolved',
  [TICKET_STATUS.CLOSED]: 'Closed'
};

/**
 * Ticket status colors
 */
export const TICKET_STATUS_COLORS: Record<TicketStatus, string> = {
  [TICKET_STATUS.NEW]: '#3B82F6',
  [TICKET_STATUS.OPEN]: '#F59E0B',
  [TICKET_STATUS.PENDING]: '#8B5CF6',
  [TICKET_STATUS.RESOLVED]: '#10B981',
  [TICKET_STATUS.CLOSED]: '#6B7280'
};

/**
 * Ticket status order (for workflow)
 */
export const TICKET_STATUS_ORDER: Record<TicketStatus, number> = {
  [TICKET_STATUS.NEW]: 0,
  [TICKET_STATUS.OPEN]: 1,
  [TICKET_STATUS.PENDING]: 2,
  [TICKET_STATUS.RESOLVED]: 3,
  [TICKET_STATUS.CLOSED]: 4
};

/**
 * Ticket status icons
 */
export const TICKET_STATUS_ICONS: Record<TicketStatus, string> = {
  [TICKET_STATUS.NEW]: 'star',
  [TICKET_STATUS.OPEN]: 'folder-open',
  [TICKET_STATUS.PENDING]: 'clock',
  [TICKET_STATUS.RESOLVED]: 'check-circle',
  [TICKET_STATUS.CLOSED]: 'archive'
};

/**
 * Check if status is active (not resolved/closed)
 */
export const isActiveStatus = (status: TicketStatus): boolean => {
  return [TICKET_STATUS.NEW, TICKET_STATUS.OPEN, TICKET_STATUS.PENDING].includes(status);
};

/**
 * Check if status is resolved or closed
 */
export const isResolvedStatus = (status: TicketStatus): boolean => {
  return [TICKET_STATUS.RESOLVED, TICKET_STATUS.CLOSED].includes(status);
};

/**
 * Get next status in workflow
 */
export const getNextStatus = (status: TicketStatus): TicketStatus | null => {
  const order = TICKET_STATUS_ORDER[status];
  const nextOrder = order + 1;
  
  const nextStatus = Object.entries(TICKET_STATUS_ORDER).find(
    ([, value]) => value === nextOrder
  )?.[0];
  
  return nextStatus as TicketStatus || null;
};

/**
 * Get previous status in workflow
 */
export const getPreviousStatus = (status: TicketStatus): TicketStatus | null => {
  const order = TICKET_STATUS_ORDER[status];
  const prevOrder = order - 1;
  
  const prevStatus = Object.entries(TICKET_STATUS_ORDER).find(
    ([, value]) => value === prevOrder
  )?.[0];
  
  return prevStatus as TicketStatus || null;
};

/**
 * Get allowed status transitions
 */
export const getAllowedTransitions = (status: TicketStatus): TicketStatus[] => {
  const transitions: Record<TicketStatus, TicketStatus[]> = {
    [TICKET_STATUS.NEW]: [TICKET_STATUS.OPEN, TICKET_STATUS.RESOLVED],
    [TICKET_STATUS.OPEN]: [TICKET_STATUS.PENDING, TICKET_STATUS.RESOLVED],
    [TICKET_STATUS.PENDING]: [TICKET_STATUS.OPEN, TICKET_STATUS.RESOLVED],
    [TICKET_STATUS.RESOLVED]: [TICKET_STATUS.CLOSED, TICKET_STATUS.OPEN],
    [TICKET_STATUS.CLOSED]: [TICKET_STATUS.OPEN]
  };
  
  return transitions[status] || [];
};

/**
 * Get status by display name
 */
export const getStatusByDisplay = (display: string): TicketStatus | undefined => {
  const entry = Object.entries(TICKET_STATUS_DISPLAY).find(
    ([, name]) => name.toLowerCase() === display.toLowerCase()
  );
  return entry?.[0] as TicketStatus;
};
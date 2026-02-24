/**
 * Priority levels
 */
export const PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

export type Priority = typeof PRIORITIES[keyof typeof PRIORITIES];

/**
 * Priority display names
 */
export const PRIORITY_DISPLAY: Record<Priority, string> = {
  [PRIORITIES.LOW]: 'Low',
  [PRIORITIES.MEDIUM]: 'Medium',
  [PRIORITIES.HIGH]: 'High',
  [PRIORITIES.URGENT]: 'Urgent'
};

/**
 * Priority colors
 */
export const PRIORITY_COLORS: Record<Priority, string> = {
  [PRIORITIES.LOW]: '#10B981',
  [PRIORITIES.MEDIUM]: '#F59E0B',
  [PRIORITIES.HIGH]: '#EF4444',
  [PRIORITIES.URGENT]: '#7F1D1D'
};

/**
 * Priority order (higher number = higher priority)
 */
export const PRIORITY_ORDER: Record<Priority, number> = {
  [PRIORITIES.LOW]: 0,
  [PRIORITIES.MEDIUM]: 1,
  [PRIORITIES.HIGH]: 2,
  [PRIORITIES.URGENT]: 3
};

/**
 * Priority response time targets (in hours)
 */
export const PRIORITY_RESPONSE_HOURS: Record<Priority, number> = {
  [PRIORITIES.LOW]: 24,
  [PRIORITIES.MEDIUM]: 8,
  [PRIORITIES.HIGH]: 4,
  [PRIORITIES.URGENT]: 1
};

/**
 * Priority resolution time targets (in hours)
 */
export const PRIORITY_RESOLUTION_HOURS: Record<Priority, number> = {
  [PRIORITIES.LOW]: 120, // 5 days
  [PRIORITIES.MEDIUM]: 48, // 2 days
  [PRIORITIES.HIGH]: 24, // 1 day
  [PRIORITIES.URGENT]: 4 // 4 hours
};

/**
 * Priority icons
 */
export const PRIORITY_ICONS: Record<Priority, string> = {
  [PRIORITIES.LOW]: 'arrow-down',
  [PRIORITIES.MEDIUM]: 'minus',
  [PRIORITIES.HIGH]: 'arrow-up',
  [PRIORITIES.URGENT]: 'exclamation-triangle'
};

/**
 * Check if priority is high or urgent
 */
export const isHighPriority = (priority: Priority): boolean => {
  return [PRIORITIES.HIGH, PRIORITIES.URGENT].includes(priority);
};

/**
 * Get priority by name
 */
export const getPriorityByName = (name: string): Priority | undefined => {
  const entry = Object.entries(PRIORITY_DISPLAY).find(
    ([, display]) => display.toLowerCase() === name.toLowerCase()
  );
  return entry?.[0] as Priority;
};

/**
 * Sort priorities by order
 */
export const sortPriorities = (priorities: Priority[]): Priority[] => {
  return [...priorities].sort((a, b) => PRIORITY_ORDER[b] - PRIORITY_ORDER[a]);
};
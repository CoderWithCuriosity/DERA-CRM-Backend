/**
 * Activity types
 */
export const ACTIVITY_TYPES = {
  CALL: 'call',
  EMAIL: 'email',
  MEETING: 'meeting',
  TASK: 'task',
  NOTE: 'note',
  FOLLOW_UP: 'follow-up'
} as const;

export type ActivityType = typeof ACTIVITY_TYPES[keyof typeof ACTIVITY_TYPES];

/**
 * Activity type display names
 */
export const ACTIVITY_TYPE_DISPLAY: Record<ActivityType, string> = {
  [ACTIVITY_TYPES.CALL]: 'Phone Call',
  [ACTIVITY_TYPES.EMAIL]: 'Email',
  [ACTIVITY_TYPES.MEETING]: 'Meeting',
  [ACTIVITY_TYPES.TASK]: 'Task',
  [ACTIVITY_TYPES.NOTE]: 'Note',
  [ACTIVITY_TYPES.FOLLOW_UP]: 'Follow-up'
};

/**
 * Activity type icons
 */
export const ACTIVITY_TYPE_ICONS: Record<ActivityType, string> = {
  [ACTIVITY_TYPES.CALL]: 'phone',
  [ACTIVITY_TYPES.EMAIL]: 'envelope',
  [ACTIVITY_TYPES.MEETING]: 'users',
  [ACTIVITY_TYPES.TASK]: 'check-square',
  [ACTIVITY_TYPES.NOTE]: 'file-text',
  [ACTIVITY_TYPES.FOLLOW_UP]: 'refresh'
};

/**
 * Activity type colors
 */
export const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  [ACTIVITY_TYPES.CALL]: '#3B82F6',
  [ACTIVITY_TYPES.EMAIL]: '#10B981',
  [ACTIVITY_TYPES.MEETING]: '#8B5CF6',
  [ACTIVITY_TYPES.TASK]: '#F59E0B',
  [ACTIVITY_TYPES.NOTE]: '#6B7280',
  [ACTIVITY_TYPES.FOLLOW_UP]: '#EF4444'
};

/**
 * Default durations (in minutes)
 */
export const ACTIVITY_DEFAULT_DURATIONS: Record<ActivityType, number> = {
  [ACTIVITY_TYPES.CALL]: 30,
  [ACTIVITY_TYPES.EMAIL]: 15,
  [ACTIVITY_TYPES.MEETING]: 60,
  [ACTIVITY_TYPES.TASK]: 30,
  [ACTIVITY_TYPES.NOTE]: 10,
  [ACTIVITY_TYPES.FOLLOW_UP]: 15
};

/**
 * Check if activity type requires scheduling
 */
export const requiresScheduling = (type: ActivityType): boolean => {
  return [ACTIVITY_TYPES.CALL, ACTIVITY_TYPES.MEETING, ACTIVITY_TYPES.TASK].includes(type);
};

/**
 * Check if activity type is communication
 */
export const isCommunication = (type: ActivityType): boolean => {
  return [ACTIVITY_TYPES.CALL, ACTIVITY_TYPES.EMAIL, ACTIVITY_TYPES.FOLLOW_UP].includes(type);
};

/**
 * Get activity type by display name
 */
export const getActivityTypeByDisplay = (display: string): ActivityType | undefined => {
  const entry = Object.entries(ACTIVITY_TYPE_DISPLAY).find(
    ([, name]) => name.toLowerCase() === display.toLowerCase()
  );
  return entry?.[0] as ActivityType;
};
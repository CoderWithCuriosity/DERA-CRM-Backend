/**
 * User roles
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  AGENT: 'agent'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

/**
 * Role hierarchy (higher number = more permissions)
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [USER_ROLES.ADMIN]: 100,
  [USER_ROLES.MANAGER]: 50,
  [USER_ROLES.AGENT]: 10
};

/**
 * Role display names
 */
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.MANAGER]: 'Manager',
  [USER_ROLES.AGENT]: 'Agent'
};

/**
 * Role colors for UI
 */
export const ROLE_COLORS: Record<UserRole, string> = {
  [USER_ROLES.ADMIN]: '#EF4444',
  [USER_ROLES.MANAGER]: '#F59E0B',
  [USER_ROLES.AGENT]: '#3B82F6'
};

/**
 * Role permissions
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [USER_ROLES.ADMIN]: ['*'],
  [USER_ROLES.MANAGER]: [
    'view:users',
    'create:users',
    'update:users',
    'view:contacts',
    'create:contacts',
    'update:contacts',
    'delete:contacts',
    'view:deals',
    'create:deals',
    'update:deals',
    'delete:deals',
    'view:tickets',
    'create:tickets',
    'update:tickets',
    'assign:tickets',
    'view:reports',
    'export:data',
    'import:data'
  ],
  [USER_ROLES.AGENT]: [
    'view:contacts',
    'create:contacts',
    'update:contacts',
    'view:deals',
    'create:deals',
    'update:deals',
    'view:tickets',
    'create:tickets',
    'update:tickets',
    'view:activities',
    'create:activities',
    'update:activities'
  ]
};

/**
 * Check if role has permission
 */
export const hasPermission = (role: UserRole, permission: string): boolean => {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes('*') || permissions.includes(permission);
};

/**
 * Check if role has higher or equal hierarchy
 */
export const hasHigherOrEqualRole = (role1: UserRole, role2: UserRole): boolean => {
  return ROLE_HIERARCHY[role1] >= ROLE_HIERARCHY[role2];
};

/**
 * Get all roles
 */
export const getAllRoles = (): UserRole[] => {
  return Object.values(USER_ROLES);
};

/**
 * Get role by display name
 */
export const getRoleByDisplayName = (displayName: string): UserRole | undefined => {
  const entry = Object.entries(ROLE_DISPLAY_NAMES).find(([, name]) => name === displayName);
  return entry?.[0] as UserRole;
};
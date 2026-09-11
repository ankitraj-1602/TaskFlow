/**
 * Roles hierarchy (higher number = more permissions)
 */
const ROLES = {
  VIEWER: 0,
  MEMBER: 1,
  MANAGER: 2,
  ADMIN: 3,
  OWNER: 4,
};

/**
 * Permission definitions by action
 * Maps action names to minimum required role
 */
const PERMISSIONS = {
  // Workspace permissions
  'workspace:view': ['VIEWER', 'MEMBER', 'MANAGER', 'ADMIN', 'OWNER'],
  'workspace:update': ['ADMIN', 'OWNER'],
  'workspace:delete': ['OWNER'],
  'workspace:manage_members': ['ADMIN', 'OWNER'],
  'workspace:change_roles': ['OWNER'],
  'workspace:invite': ['ADMIN', 'OWNER'],

  // Project permissions
  'project:view': ['VIEWER', 'MEMBER', 'MANAGER', 'ADMIN', 'OWNER'],
  'project:create': ['MANAGER', 'ADMIN', 'OWNER'],
  'project:update': ['MANAGER', 'ADMIN', 'OWNER'],
  'project:delete': ['ADMIN', 'OWNER'],
  'project:archive': ['MANAGER', 'ADMIN', 'OWNER'],
  'project:manage_members': ['MANAGER', 'ADMIN', 'OWNER'],

  // Task permissions
  'task:view': ['VIEWER', 'MEMBER', 'MANAGER', 'ADMIN', 'OWNER'],
  'task:create': ['MEMBER', 'MANAGER', 'ADMIN', 'OWNER'],
  'task:update_own': ['MEMBER', 'MANAGER', 'ADMIN', 'OWNER'],
  'task:update_any': ['MANAGER', 'ADMIN', 'OWNER'],
  'task:delete_own': ['MEMBER', 'MANAGER', 'ADMIN', 'OWNER'],
  'task:delete_any': ['MANAGER', 'ADMIN', 'OWNER'],
  'task:assign': ['MANAGER', 'ADMIN', 'OWNER'],

  // Comment permissions
  'comment:create': ['MEMBER', 'MANAGER', 'ADMIN', 'OWNER'],
  'comment:update_own': ['MEMBER', 'MANAGER', 'ADMIN', 'OWNER'],
  'comment:delete_own': ['MEMBER', 'MANAGER', 'ADMIN', 'OWNER'],
  'comment:delete_any': ['MANAGER', 'ADMIN', 'OWNER'],
};

/**
 * Check if a role is at least as powerful as the minimum required
 */
const roleAtLeast = (role, minRole) => {
  return (ROLES[role] ?? -1) >= (ROLES[minRole] ?? Infinity);
};

/**
 * Check if a role has a specific permission
 */
const hasPermission = (role, permission) => {
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
};

module.exports = {
  ROLES,
  PERMISSIONS,
  roleAtLeast,
  hasPermission,
};
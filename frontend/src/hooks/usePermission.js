import { useWorkspaceStore } from '../store/workspace.store';

const ROLES = {
  VIEWER: 0,
  MEMBER: 1,
  MANAGER: 2,
  ADMIN: 3,
  OWNER: 4,
};

/**
 * Hook to check permissions based on the current workspace role.
 * Accepts an optional override role (useful when the workspace
 * detail page passes role directly instead of relying on store).
 */
export const usePermission = (overrideRole) => {
  const { currentWorkspace, workspaces } = useWorkspaceStore();

  // Try multiple sources for the role
  const role =
    overrideRole ||
    currentWorkspace?.userRole ||
    currentWorkspace?.member_role ||
    currentWorkspace?.role ||
    // Fallback: find the workspace via some other means
    'VIEWER';

  // Debug log (remove later)
  // console.log('[usePermission] role:', role, 'currentWorkspace:', currentWorkspace);

  const hasRole = (...allowedRoles) => allowedRoles.includes(role);

  const isAtLeast = (minRole) => {
    return (ROLES[role] ?? -1) >= (ROLES[minRole] ?? Infinity);
  };

  return {
    role,
    hasRole,
    isAtLeast,
    isOwner: role === 'OWNER',
    isAdmin: role === 'OWNER' || role === 'ADMIN',
    isManager: role === 'OWNER' || role === 'ADMIN' || role === 'MANAGER',
    isMember: role !== 'VIEWER',
    isViewer: role === 'VIEWER',
    canEdit: role !== 'VIEWER',
    canManageMembers: role === 'OWNER' || role === 'ADMIN',
    canDeleteWorkspace: role === 'OWNER',
    canCreateProject: role !== 'VIEWER' && role !== 'MEMBER',
  };
};
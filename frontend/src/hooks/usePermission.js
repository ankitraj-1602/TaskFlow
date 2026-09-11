import { useWorkspaceStore } from '../store/workspace.store';

const ROLES = {
  VIEWER: 0,
  MEMBER: 1,
  MANAGER: 2,
  ADMIN: 3,
  OWNER: 4,
};

/**
 * Hook to check permissions based on the current workspace role
 */
export const usePermission = () => {
  const { currentWorkspace } = useWorkspaceStore();
  const role = currentWorkspace?.userRole || currentWorkspace?.member_role || 'VIEWER';

  const hasRole = (...allowedRoles) => allowedRoles.includes(role);

  const isAtLeast = (minRole) => {
    return (ROLES[role] ?? -1) >= (ROLES[minRole] ?? Infinity);
  };

  return {
    role,
    hasRole,
    isAtLeast,
    // Convenient shortcuts
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
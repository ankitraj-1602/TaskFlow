import { create } from 'zustand';
import { workspaceApi } from '../api/workspace.api';

export const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  members: [],
  isLoading: false,
  pendingInvitations: [],

  loadWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const workspaces = await workspaceApi.getAll();
      set({ workspaces, isLoading: false });
      return workspaces;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

createWorkspace: async (data) => {
  set({ isLoading: true });
  try {
    const workspace = await workspaceApi.create(data);

    // ⬇️ New workspace — the creator is always the OWNER
    // Normalize the shape to match `findByUser` response
    const normalizedWorkspace = {
      ...workspace,
      owner_role: 'OWNER',
      member_role: null,
      userRole: 'OWNER',   // for usePermission hook
    };

    set((state) => ({
      workspaces: [normalizedWorkspace, ...state.workspaces],
      isLoading: false,
    }));

    return normalizedWorkspace;
  } catch (error) {
    set({ isLoading: false });
    throw error;
  }
},
  updateWorkspace: async (id, data) => {
    set({ isLoading: true });
    try {
      const workspace = await workspaceApi.update(id, data);
      set((state) => ({
        workspaces: state.workspaces.map(w => w.id === id ? workspace : w),
        currentWorkspace: state.currentWorkspace?.id === id ? workspace : state.currentWorkspace,
        isLoading: false,
      }));
      return workspace;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteWorkspace: async (id) => {
    set({ isLoading: true });
    try {
      await workspaceApi.delete(id);
      set((state) => ({
        workspaces: state.workspaces.filter(w => w.id !== id),
        currentWorkspace: state.currentWorkspace?.id === id ? null : state.currentWorkspace,
        isLoading: false,
      }));
      return true;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setCurrentWorkspace: (workspace) => {
    set({ currentWorkspace: workspace });
  },

  loadWorkspaceMembers: async (workspaceId) => {
    set({ isLoading: true });
    try {
      const members = await workspaceApi.getMembers(workspaceId);
      set({ members, isLoading: false });
      return members;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

addMember: async (workspaceId, data) => {
  set({ isLoading: true });
  try {
    const result = await workspaceApi.addMember(workspaceId, data);

    if (result?.type === 'added' && result.member) {
      // ⬇️ Normalize: flatten nested `user` into top-level fields
      // so the shape matches GET /members response
      const normalizedMember = {
        id: result.member.id,
        role: result.member.role,
        workspace_id: result.member.workspace_id,
        user_id: result.member.user_id || result.member.user?.id,
        joined_at: result.member.joined_at,
        invited_by: result.member.invited_by,
        invited_at: result.member.invited_at,
        // Flatten user fields
        name: result.member.user?.name || result.member.name,
        email: result.member.user?.email || result.member.email,
        profile_picture: result.member.user?.profile_picture || result.member.profile_picture,
        job_title: result.member.user?.job_title || result.member.job_title,
      };

      set((state) => ({
        members: [...state.members, normalizedMember],
        isLoading: false,
      }));
    } else if (result?.type === 'invited' && result.invitation) {
      set((state) => ({
        pendingInvitations: [result.invitation, ...state.pendingInvitations],
        isLoading: false,
      }));
    } else {
      // Fallback: try to normalize as a raw member
      const fallback = result?.user
        ? {
            ...result,
            name: result.user.name,
            email: result.user.email,
            profile_picture: result.user.profile_picture,
            job_title: result.user.job_title,
          }
        : result;

      set((state) => ({
        members: [...state.members, fallback],
        isLoading: false,
      }));
    }

    return result;
  } catch (error) {
    set({ isLoading: false });
    throw error;
  }
},

  removeMember: async (workspaceId, memberId) => {
    set({ isLoading: true });
    try {
      await workspaceApi.removeMember(workspaceId, memberId);
      set((state) => ({
        members: state.members.filter(m => m.id !== memberId),
        isLoading: false,
      }));
      return true;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

updateMemberRole: async (workspaceId, memberId, role) => {
  set({ isLoading: true });
  try {
    const updated = await workspaceApi.updateMemberRole(workspaceId, memberId, role);

    set((state) => ({
      members: state.members.map((m) =>
        m.id === memberId
          ? {
              // ⬇️ Preserve existing fields (name, email, avatar)
              ...m,
              // ⬇️ Overlay updated fields (role, updated_at, etc.)
              ...updated,
              // ⬇️ Fall back to existing if backend omits them
              name: updated.name || updated.user?.name || m.name,
              email: updated.email || updated.user?.email || m.email,
              profile_picture:
                updated.profile_picture ||
                updated.user?.profile_picture ||
                m.profile_picture,
              job_title:
                updated.job_title ||
                updated.user?.job_title ||
                m.job_title,
            }
          : m
      ),
      isLoading: false,
    }));

    return updated;
  } catch (error) {
    set({ isLoading: false });
    throw error;
  }
},
  loadPendingInvitations: async (workspaceId) => {
  set({ isLoading: true });
  try {
    const invitations = await workspaceApi.getPendingInvitations(workspaceId);
    set({ pendingInvitations: invitations, isLoading: false });
    return invitations;
  } catch (error) {
    set({ isLoading: false });
    throw error;
  }
},

cancelInvitation: async (workspaceId, invitationId) => {
  set({ isLoading: true });
  try {
    await workspaceApi.cancelInvitation(workspaceId, invitationId);
    set((state) => ({
      pendingInvitations: state.pendingInvitations.filter(i => i.id !== invitationId),
      isLoading: false,
    }));
    return true;
  } catch (error) {
    set({ isLoading: false });
    throw error;
  }
},

  clearWorkspace: () => {
    set({
      workspaces: [],
      currentWorkspace: null,
      members: [],
    });
  },
}));
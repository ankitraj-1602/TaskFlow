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
      set((state) => ({
        workspaces: [workspace, ...state.workspaces],
        isLoading: false,
      }));
      return workspace;
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
      const member = await workspaceApi.addMember(workspaceId, data);
      set((state) => ({
        members: [...state.members, member],
        isLoading: false,
      }));
      return member;
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
      const member = await workspaceApi.updateMemberRole(workspaceId, memberId, role);
      set((state) => ({
        members: state.members.map(m => m.id === memberId ? member : m),
        isLoading: false,
      }));
      return member;
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
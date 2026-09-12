import { create } from 'zustand';
import { projectApi } from '../api/project.api';

export const useProjectStore = create((set, get) => ({
  // ─── State ────────────────────────────────────────
  projects: [],
  currentProject: null,
  projectMembers: [],
  availableMembers: [],
  isLoading: false,
  isLoadingMembers: false,
  lastMembersLoadedForId: null,

  // ─── Available Members ────────────────────────────
  loadAvailableMembers: async (projectId) => {
    try {
      const members = await projectApi.getAvailableMembers(projectId);
      set({ availableMembers: members });
      return members;
    } catch (error) {
      throw error;
    }
  },

  // ─── Project Members (NEW loading flag) ───────────
  loadProjectMembers: async (projectId, force = false) => {
    const lastId = get().lastMembersLoadedForId;
    if (!force && lastId === projectId) {
      return get().projectMembers;
    }

    set({ isLoadingMembers: true });
    try {
      const members = await projectApi.getMembers(projectId);
      set({
        projectMembers: members,
        lastMembersLoadedForId: projectId,
        isLoadingMembers: false,
      });
      return members;
    } catch (error) {
      set({ isLoadingMembers: false });
      throw error;
    }
  },

  addProjectMember: async (projectId, data) => {
    set({ isLoadingMembers: true });
    try {
      const member = await projectApi.addMember(projectId, data);
      set((state) => ({
        projectMembers: [...state.projectMembers, member],
        availableMembers: state.availableMembers.filter(
          (m) => m.user_id !== member.user_id
        ),
        isLoadingMembers: false,
      }));
      return member;
    } catch (error) {
      set({ isLoadingMembers: false });
      throw error;
    }
  },

  removeProjectMember: async (projectId, memberId) => {
    set({ isLoadingMembers: true });
    try {
      await projectApi.removeMember(projectId, memberId);
      set((state) => ({
        projectMembers: state.projectMembers.filter((m) => m.id !== memberId),
        isLoadingMembers: false,
      }));
      return true;
    } catch (error) {
      set({ isLoadingMembers: false });
      throw error;
    }
  },

  // ─── Workspace Projects (uses isLoading) ──────────
  loadWorkspaceProjects: async (workspaceId, filters = {}) => {
    set({ isLoading: true });
    try {
      const projects = await projectApi.getByWorkspace(workspaceId, filters);
      set({ projects, isLoading: false });
      return projects;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // ─── Single Project (uses isLoading) ──────────────
  loadProject: async (projectId) => {
    set({ isLoading: true });
    try {
      const project = await projectApi.getById(projectId);
      set({ currentProject: project, isLoading: false });
      return project;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createProject: async (workspaceId, data) => {
    set({ isLoading: true });
    try {
      const project = await projectApi.create(workspaceId, data);
      set((state) => ({
        projects: [project, ...state.projects],
        isLoading: false,
      }));
      return project;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateProject: async (projectId, data) => {
    set({ isLoading: true });
    try {
      const project = await projectApi.update(projectId, data);
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId ? { ...p, ...project } : p
        ),
        currentProject:
          state.currentProject?.id === projectId
            ? { ...state.currentProject, ...project }
            : state.currentProject,
        isLoading: false,
      }));
      return project;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteProject: async (projectId) => {
    set({ isLoading: true });
    try {
      await projectApi.delete(projectId);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== projectId),
        currentProject:
          state.currentProject?.id === projectId ? null : state.currentProject,
        isLoading: false,
      }));
      return true;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  archiveProject: async (projectId) => {
    set({ isLoading: true });
    try {
      const project = await projectApi.archive(projectId);
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId ? { ...p, ...project } : p
        ),
        currentProject:
          state.currentProject?.id === projectId
            ? { ...state.currentProject, ...project }
            : state.currentProject,
        isLoading: false,
      }));
      return project;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  unarchiveProject: async (projectId) => {
    set({ isLoading: true });
    try {
      const project = await projectApi.unarchive(projectId);
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId ? { ...p, ...project } : p
        ),
        currentProject:
          state.currentProject?.id === projectId
            ? { ...state.currentProject, ...project }
            : state.currentProject,
        isLoading: false,
      }));
      return project;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // ─── Cleanup ──────────────────────────────────────
  clearProjects: () => {
    set({
      projects: [],
      currentProject: null,
      projectMembers: [],
      availableMembers: [],
      lastMembersLoadedForId: null,
    });
  },
}));
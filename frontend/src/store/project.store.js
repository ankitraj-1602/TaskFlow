import { create } from 'zustand';
import { projectApi } from '../api/project.api';

export const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  projectMembers: [],
  isLoading: false,

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
        projects: state.projects.map(p => p.id === projectId ? { ...p, ...project } : p),
        currentProject: state.currentProject?.id === projectId 
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
        projects: state.projects.filter(p => p.id !== projectId),
        currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
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
        projects: state.projects.map(p => p.id === projectId ? { ...p, ...project } : p),
        currentProject: state.currentProject?.id === projectId 
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
        projects: state.projects.map(p => p.id === projectId ? { ...p, ...project } : p),
        currentProject: state.currentProject?.id === projectId 
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

  loadProjectMembers: async (projectId) => {
    set({ isLoading: true });
    try {
      const members = await projectApi.getMembers(projectId);
      set({ projectMembers: members, isLoading: false });
      return members;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  addProjectMember: async (projectId, data) => {
    set({ isLoading: true });
    try {
      const member = await projectApi.addMember(projectId, data);
      set((state) => ({
        projectMembers: [...state.projectMembers, member],
        isLoading: false,
      }));
      return member;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  removeProjectMember: async (projectId, memberId) => {
    set({ isLoading: true });
    try {
      await projectApi.removeMember(projectId, memberId);
      set((state) => ({
        projectMembers: state.projectMembers.filter(m => m.id !== memberId),
        isLoading: false,
      }));
      return true;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  clearProjects: () => {
    set({
      projects: [],
      currentProject: null,
      projectMembers: [],
    });
  },
}));
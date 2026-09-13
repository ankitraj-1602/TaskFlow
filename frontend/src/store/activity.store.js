import { create } from 'zustand';
import { activityApi } from '../api/activity.api';

export const useActivityStore = create((set, get) => ({
  // Cache per scope (task/project/workspace)
  taskActivities: {},      // { taskId: [...] }
  projectActivities: {},   // { projectId: [...] }
  workspaceActivities: {}, // { workspaceId: [...] }
  isLoading: false,

  loadTaskActivities: async (taskId, force = false) => {
    const cached = get().taskActivities[taskId];
    if (!force && cached && cached.length >= 0) {
      return cached;
    }

    set({ isLoading: true });
    try {
      const activities = await activityApi.getByTask(taskId, { limit: 50 });
      set((state) => ({
        taskActivities: { ...state.taskActivities, [taskId]: activities },
        isLoading: false,
      }));
      return activities;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loadProjectActivities: async (projectId, options = {}) => {
    set({ isLoading: true });
    try {
      const activities = await activityApi.getByProject(projectId, {
        limit: options.limit || 30,
        page: options.page || 1,
        action: options.action,
      });
      set((state) => ({
        projectActivities: { ...state.projectActivities, [projectId]: activities },
        isLoading: false,
      }));
      return activities;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loadWorkspaceActivities: async (workspaceId, options = {}) => {
    set({ isLoading: true });
    try {
      const activities = await activityApi.getByWorkspace(workspaceId, {
        limit: options.limit || 10,
        page: options.page || 1,
        action: options.action,
      });
      set((state) => ({
        workspaceActivities: {
          ...state.workspaceActivities,
          [workspaceId]: activities,
        },
        isLoading: false,
      }));
      return activities;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Invalidate cached activities for a task (used after mutations).
   */
  invalidateTask: (taskId) => {
    set((state) => {
      const next = { ...state.taskActivities };
      delete next[taskId];
      return { taskActivities: next };
    });
  },

  invalidateProject: (projectId) => {
    set((state) => {
      const next = { ...state.projectActivities };
      delete next[projectId];
      return { projectActivities: next };
    });
  },

  clearAll: () => {
    set({
      taskActivities: {},
      projectActivities: {},
      workspaceActivities: {},
    });
  },
}));
import { create } from 'zustand';
import { taskApi } from '../api/task.api';

export const useTaskStore = create((set, get) => ({
  tasks: [],
  currentTask: null,
  myTasks: [],
  stats: null,
  pagination: null,
  isLoading: false,

  loadProjectTasks: async (projectId, filters = {}) => {
    set({ isLoading: true });
    try {
      const response = await taskApi.getByProject(projectId, filters);
      
      if (response.pagination) {
        set({
          tasks: response.data,
          pagination: response.pagination,
          isLoading: false,
        });
      } else {
        set({
          tasks: response.data,
          pagination: null,
          isLoading: false,
        });
      }
      return response.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loadTask: async (taskId) => {
    set({ isLoading: true });
    try {
      const task = await taskApi.getById(taskId);
      set({ currentTask: task, isLoading: false });
      return task;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createTask: async (projectId, data) => {
    set({ isLoading: true });
    try {
      const task = await taskApi.create(projectId, data);
      set((state) => ({
        tasks: [task, ...state.tasks],
        isLoading: false,
      }));
      return task;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateTask: async (taskId, data) => {
    set({ isLoading: true });
    try {
      const task = await taskApi.update(taskId, data);
      set((state) => ({
        tasks: state.tasks.map(t => t.id === taskId ? task : t),
        currentTask: state.currentTask?.id === taskId ? task : state.currentTask,
        isLoading: false,
      }));
      return task;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateTaskStatus: async (taskId, status, position) => {
    // Optimistic update
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.map(t => 
        t.id === taskId ? { ...t, status, position: position ?? t.position } : t
      ),
    }));

    try {
      const task = await taskApi.updateStatus(taskId, { status, position });
      set((state) => ({
        tasks: state.tasks.map(t => t.id === taskId ? task : t),
      }));
      return task;
    } catch (error) {
      // Revert on error
      set({ tasks: previousTasks });
      throw error;
    }
  },

  reorderTasks: async (projectId, status, taskIds) => {
    try {
      await taskApi.reorder(projectId, { status, taskIds });
      return true;
    } catch (error) {
      throw error;
    }
  },

  deleteTask: async (taskId) => {
    set({ isLoading: true });
    try {
      await taskApi.delete(taskId);
      set((state) => ({
        tasks: state.tasks.filter(t => t.id !== taskId),
        currentTask: state.currentTask?.id === taskId ? null : state.currentTask,
        isLoading: false,
      }));
      return true;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  archiveTask: async (taskId) => {
    set({ isLoading: true });
    try {
      const task = await taskApi.archive(taskId);
      set((state) => ({
        tasks: state.tasks.map(t => t.id === taskId ? { ...t, is_archived: true } : t),
        isLoading: false,
      }));
      return task;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  unarchiveTask: async (taskId) => {
    set({ isLoading: true });
    try {
      const task = await taskApi.unarchive(taskId);
      set((state) => ({
        tasks: state.tasks.map(t => t.id === taskId ? { ...t, is_archived: false } : t),
        isLoading: false,
      }));
      return task;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  duplicateTask: async (taskId) => {
    set({ isLoading: true });
    try {
      const task = await taskApi.duplicate(taskId);
      set((state) => ({
        tasks: [task, ...state.tasks],
        isLoading: false,
      }));
      return task;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loadTaskStats: async (projectId) => {
    try {
      const stats = await taskApi.getStats(projectId);
      set({ stats });
      return stats;
    } catch (error) {
      throw error;
    }
  },

  loadMyTasks: async (filters = {}) => {
    set({ isLoading: true });
    try {
      const myTasks = await taskApi.getMyTasks(filters);
      set({ myTasks, isLoading: false });
      return myTasks;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  clearTasks: () => {
    set({ tasks: [], currentTask: null, stats: null, pagination: null });
  },
}));
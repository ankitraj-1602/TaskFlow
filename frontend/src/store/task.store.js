import { create } from 'zustand';
import { taskApi } from '../api/task.api';

export const useTaskStore = create((set, get) => ({
  // ─── State ────────────────────────────────────────
  tasks: [],
  currentTask: null,
  myTasks: [],
  stats: null,
  pagination: null,
  isLoading: false,
  myTasksPagination: null,

  // ─── Loaders ──────────────────────────────────────
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

  // ─── Mutations ────────────────────────────────────
  createTask: async (projectId, data) => {
    set({ isLoading: true });
    try {
      const task = await taskApi.create(projectId, data);

      set((state) => {
        // Idempotent — don't add if already exists
        if (state.tasks.find((t) => t.id === task.id)) {
          return { isLoading: false };
        }
        return {
          tasks: [task, ...state.tasks],
          isLoading: false,
        };
      });
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
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, ...task } : t
        ),
        currentTask:
          state.currentTask?.id === taskId
            ? { ...state.currentTask, ...task }
            : state.currentTask,
        isLoading: false,
      }));
      return task;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateTaskStatus: async (taskId, status, position) => {
    const previousTasks = get().tasks;
    const existingTask = previousTasks.find((t) => t.id === taskId);

    if (!existingTask) {
      throw new Error('Task not found in store');
    }

    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status, position: position ?? t.position } : t
      ),
    }));

    try {
      const updated = await taskApi.updateStatus(taskId, { status, position });

      // Defensive merge
      set((state) => ({
        tasks: state.tasks.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            status: updated.status ?? t.status,
            position: updated.position ?? t.position,
            updatedAt: updated.updatedAt || updated.updated_at || t.updatedAt,
            completedAt:
              updated.completedAt ?? updated.completed_at ?? t.completedAt,
          };
        }),
      }));

      return updated;
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
      const { loadProjectTasks } = get();
      await loadProjectTasks(projectId, { limit: 500 });
      throw error;
    }
  },

  deleteTask: async (taskId) => {
    set({ isLoading: true });
    try {
      await taskApi.delete(taskId);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== taskId),
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
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, is_archived: true } : t
        ),
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
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, is_archived: false } : t
        ),
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
      set((state) => {
        // Idempotent
        if (state.tasks.find((t) => t.id === task.id)) {
          return { isLoading: false };
        }
        return {
          tasks: [task, ...state.tasks],
          isLoading: false,
        };
      });
      return task;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // ─── Stats & My Tasks ─────────────────────────────
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
    const response = await taskApi.getMyTasks(filters);

    // Response shape:
    // { success, data: [...tasks], pagination: { page, limit, total, totalPages, hasNext, hasPrev } }

    const tasks = response.data || [];
    const pagination = response.pagination || null;

    set({
      myTasks: tasks,
      myTasksPagination: pagination
        ? {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            totalPages: pagination.totalPages,
          }
        : null,
      isLoading: false,
    });
  } catch (error) {
    set({ isLoading: false });
    throw error;
  }
},

  // ─── Socket-driven updates (idempotent) ───────────
  addTaskFromSocket: (task) => {
    set((state) => {
      // Idempotent — skip if already exists
      if (state.tasks.find((t) => t.id === task.id)) {
        return state;
      }
      return { tasks: [task, ...state.tasks] };
    });
  },

  updateTaskFromSocket: (task) => {
    set((state) => {
      const exists = state.tasks.find((t) => t.id === task.id);

      // If it doesn't exist locally, don't add via update
      if (!exists) return state;

      return {
        tasks: state.tasks.map((t) =>
          t.id === task.id ? { ...t, ...task } : t
        ),
        currentTask:
          state.currentTask?.id === task.id
            ? { ...state.currentTask, ...task }
            : state.currentTask,
      };
    });
  },

  moveTaskFromSocket: (taskId, status, position) => {
    set((state) => {
      const exists = state.tasks.find((t) => t.id === taskId);
      if (!exists) return state;

      return {
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, status, position } : t
        ),
      };
    });
  },

  removeTaskFromSocket: (taskId) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
      currentTask: state.currentTask?.id === taskId ? null : state.currentTask,
    }));
  },

  // ─── Cleanup ──────────────────────────────────────
  clearTasks: () => {
    set({ tasks: [], currentTask: null, stats: null, pagination: null });
  },

reorderTasks: async (projectId, status, taskIds) => {
  // Optimistic update first
  get().applyLocalReorder(status, taskIds);

  try {
    await taskApi.reorder(projectId, { status, taskIds });
    return true;
  } catch (error) {
    // On failure, refetch to restore true order
    await get().loadProjectTasks(projectId, { limit: 500 });
    throw error;
  }
},
updateTaskInList: (taskId, updates) => {
  set((state) => ({
    tasks: state.tasks.map((t) =>
      t.id === taskId ? { ...t, ...updates } : t
    ),
  }));
},
// Update a task in-place in both `tasks` and `myTasks` arrays
updateTaskInList: (taskId, updates) => {
  set((state) => ({
    tasks: state.tasks.map((t) =>
      t.id === taskId ? { ...t, ...updates } : t
    ),
    myTasks: state.myTasks.map((t) =>
      t.id === taskId ? { ...t, ...updates } : t
    ),
  }));
},
}));
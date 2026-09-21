import { create } from 'zustand';
import { labelApi } from '../api/label.api';

export const useLabelStore = create((set, get) => ({
  // { [projectId]: [label, label, ...] }
  labelsByProject: {},
  isLoading: false,

  /**
   * Load labels for a project (uses cache unless force=true).
   */
  loadProjectLabels: async (projectId, force = false) => {
    const cached = get().labelsByProject[projectId];
    if (!force && cached) return cached;

    set({ isLoading: true });
    try {
      const labels = await labelApi.getByProject(projectId);
      set((state) => ({
        labelsByProject: { ...state.labelsByProject, [projectId]: labels },
        isLoading: false,
      }));
      return labels;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Create a label and append to store.
   */
  createLabel: async (projectId, data) => {
    const label = await labelApi.create(projectId, data);
    set((state) => ({
      labelsByProject: {
        ...state.labelsByProject,
        [projectId]: [...(state.labelsByProject[projectId] || []), label],
      },
    }));
    return label;
  },

  /**
   * Update a label in the store.
   */
  updateLabel: async (labelId, projectId, data) => {
    const updated = await labelApi.update(labelId, data);
    set((state) => ({
      labelsByProject: {
        ...state.labelsByProject,
        [projectId]: (state.labelsByProject[projectId] || []).map((l) =>
          l.id === labelId ? { ...l, ...updated } : l
        ),
      },
    }));
    return updated;
  },

  /**
   * Delete a label from the store.
   */
  deleteLabel: async (labelId, projectId) => {
    await labelApi.delete(labelId);
    set((state) => ({
      labelsByProject: {
        ...state.labelsByProject,
        [projectId]: (state.labelsByProject[projectId] || []).filter(
          (l) => l.id !== labelId
        ),
      },
    }));
    return true;
  },

  /**
   * Get cached labels for a project.
   * NOTE: This is a non-reactive getter. In components, prefer:
   *   const labels = useLabelStore((s) => s.labelsByProject[projectId]) || [];
   */
  getProjectLabels: (projectId) => {
    return get().labelsByProject[projectId] || [];
  },

  clear: () => set({ labelsByProject: {} }),
}));
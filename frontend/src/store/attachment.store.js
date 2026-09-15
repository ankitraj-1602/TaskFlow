import { create } from 'zustand';
import { attachmentApi } from '../api/attachment.api';

export const useAttachmentStore = create((set, get) => ({
  attachmentsByTask: {}, // { taskId: [...] }
  isUploading: false,
  uploadProgress: 0,
  isLoading: false,

  loadTaskAttachments: async (taskId, force = false) => {
    const cached = get().attachmentsByTask[taskId];
    if (!force && cached) return cached;

    set({ isLoading: true });
    try {
      const attachments = await attachmentApi.getByTask(taskId);
      set((state) => ({
        attachmentsByTask: { ...state.attachmentsByTask, [taskId]: attachments },
        isLoading: false,
      }));
      return attachments;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  uploadAttachment: async (taskId, file) => {
    set({ isUploading: true, uploadProgress: 0 });
    try {
      const attachment = await attachmentApi.upload(taskId, file, (percent) => {
        set({ uploadProgress: percent });
      });

      set((state) => ({
        attachmentsByTask: {
          ...state.attachmentsByTask,
          [taskId]: [attachment, ...(state.attachmentsByTask[taskId] || [])],
        },
        isUploading: false,
        uploadProgress: 0,
      }));

      return attachment;
    } catch (error) {
      set({ isUploading: false, uploadProgress: 0 });
      throw error;
    }
  },

  deleteAttachment: async (attachmentId, taskId) => {
    try {
      await attachmentApi.delete(attachmentId);
      set((state) => ({
        attachmentsByTask: {
          ...state.attachmentsByTask,
          [taskId]: (state.attachmentsByTask[taskId] || []).filter(
            (a) => a.id !== attachmentId
          ),
        },
      }));
      return true;
    } catch (error) {
      throw error;
    }
  },

  // ─── Socket-driven updates ──────────────────────
  addAttachmentFromSocket: (attachment, taskId) => {
    set((state) => {
      const existing = state.attachmentsByTask[taskId] || [];
      if (existing.find((a) => a.id === attachment.id)) return state;

      return {
        attachmentsByTask: {
          ...state.attachmentsByTask,
          [taskId]: [attachment, ...existing],
        },
      };
    });
  },

  removeAttachmentFromSocket: (attachmentId, taskId) => {
    set((state) => ({
      attachmentsByTask: {
        ...state.attachmentsByTask,
        [taskId]: (state.attachmentsByTask[taskId] || []).filter(
          (a) => a.id !== attachmentId
        ),
      },
    }));
  },

  clear: () => set({ attachmentsByTask: {} }),
}));
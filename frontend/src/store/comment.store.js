import { create } from 'zustand';
import { commentApi } from '../api/comment.api';

export const useCommentStore = create((set, get) => ({
  comments: [],
  isLoading: false,
  taskId: null,

  loadComments: async (taskId, force = false) => {
    const state = get();

    if (!force && state.taskId === taskId && state.comments.length >= 0) {
      return state.comments;
    }

    set({ isLoading: true, taskId });
    try {
      const comments = await commentApi.getByTask(taskId);
      set({ comments, isLoading: false });
      return comments;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  addComment: async (taskId, data) => {
    const comment = await commentApi.create(taskId, data);

    set((state) => {
      // Reply → insert into parent's replies
      if (comment.parentId) {
        return {
          comments: state.comments.map((c) =>
            c.id === comment.parentId
              ? { ...c, replies: [...(c.replies || []), comment] }
              : c
          ),
        };
      }
      // Top-level → append
      return {
        comments: [...state.comments, comment],
      };
    });

    return comment;
  },

  updateComment: async (commentId, content) => {
    const updated = await commentApi.update(commentId, content);

    set((state) => ({
      comments: state.comments.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            content: updated.content,
            isEdited: updated.isEdited,
            editedAt: updated.editedAt,
          };
        }
        return {
          ...c,
          replies: (c.replies || []).map((r) =>
            r.id === commentId
              ? {
                  ...r,
                  content: updated.content,
                  isEdited: updated.isEdited,
                  editedAt: updated.editedAt,
                }
              : r
          ),
        };
      }),
    }));

    return updated;
  },

  deleteComment: async (commentId) => {
    await commentApi.delete(commentId);

    set((state) => ({
      comments: state.comments
        .filter((c) => c.id !== commentId)
        .map((c) => ({
          ...c,
          replies: (c.replies || []).filter((r) => r.id !== commentId),
        })),
    }));

    return true;
  },

  clearComments: () => {
    set({ comments: [], taskId: null });
  },
}));
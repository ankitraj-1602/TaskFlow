import { create } from 'zustand';
import { commentApi } from '../api/comment.api';

export const useCommentStore = create((set, get) => ({
  comments: [],
  isLoading: false,
  taskId: null,

  // ─── Load ─────────────────────────────────────────
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

  // ─── Mutations ────────────────────────────────────
  addComment: async (taskId, data) => {
    const comment = await commentApi.create(taskId, data);

    set((state) => {
      // Idempotent — skip if already exists
      const existsTop = state.comments.find((c) => c.id === comment.id);
      const existsAsReply = state.comments.some((c) =>
        (c.replies || []).find((r) => r.id === comment.id)
      );
      if (existsTop || existsAsReply) return state;

      if (comment.parentId) {
        return {
          comments: state.comments.map((c) =>
            c.id === comment.parentId
              ? { ...c, replies: [...(c.replies || []), comment] }
              : c
          ),
        };
      }
      return { comments: [...state.comments, comment] };
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

  // ─── Socket-driven updates (idempotent) ───────────
  addCommentFromSocket: (comment, taskId) => {
    // Only relevant if we're currently viewing this task's comments
    if (get().taskId !== taskId) return;

    set((state) => {
      // Idempotent — skip if already exists at any level
      const existsTop = state.comments.find((c) => c.id === comment.id);
      const existsAsReply = state.comments.some((c) =>
        (c.replies || []).find((r) => r.id === comment.id)
      );
      if (existsTop || existsAsReply) return state;

      if (comment.parentId) {
        return {
          comments: state.comments.map((c) =>
            c.id === comment.parentId
              ? { ...c, replies: [...(c.replies || []), comment] }
              : c
          ),
        };
      }
      return { comments: [...state.comments, comment] };
    });
  },

  updateCommentFromSocket: (comment) => {
    set((state) => ({
      comments: state.comments.map((c) => {
        if (c.id === comment.id) {
          return {
            ...c,
            content: comment.content,
            isEdited: comment.isEdited,
            editedAt: comment.editedAt,
          };
        }
        return {
          ...c,
          replies: (c.replies || []).map((r) =>
            r.id === comment.id
              ? {
                  ...r,
                  content: comment.content,
                  isEdited: comment.isEdited,
                  editedAt: comment.editedAt,
                }
              : r
          ),
        };
      }),
    }));
  },

  removeCommentFromSocket: (commentId) => {
    set((state) => ({
      comments: state.comments
        .filter((c) => c.id !== commentId)
        .map((c) => ({
          ...c,
          replies: (c.replies || []).filter((r) => r.id !== commentId),
        })),
    }));
  },

  // ─── Cleanup ──────────────────────────────────────
  clearComments: () => {
    set({ comments: [], taskId: null });
  },
}));
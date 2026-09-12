const CommentQueries = require('../db/queries/comment.queries');
const MentionQueries = require('../db/queries/mention.queries');
const TaskQueries = require('../db/queries/task.queries');
const ProjectQueries = require('../db/queries/project.queries');
const WorkspaceQueries = require('../db/queries/workspace.queries');
const UserQueries = require('../db/queries/user.queries');

class CommentService {
  /**
   * Extract @mentions from comment content.
   * Format: @email or @name. We'll use @email for reliability.
   */
  extractMentionEmails(content) {
    const regex = /@([\w.+-]+@[\w-]+\.[\w.-]+)/g;
    const matches = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      matches.push(match[1]);
    }
    return [...new Set(matches)]; // dedupe
  }

  /**
   * Resolve mentioned emails to user IDs, but only those who are
   * workspace members (to prevent mentioning outsiders).
   */
  async resolveMentionsToUserIds(emails, workspaceId) {
    if (emails.length === 0) return [];

    const members = await WorkspaceQueries.getMembers(workspaceId);
    const memberEmails = new Set(members.map((m) => m.email.toLowerCase()));

    const validUserIds = [];
    for (const email of emails) {
      if (memberEmails.has(email.toLowerCase())) {
        const user = await UserQueries.findByEmail(email);
        if (user) validUserIds.push(user.id);
      }
    }
    return validUserIds;
  }

  async createComment(taskId, userId, data) {
    const task = await TaskQueries.findById(taskId);
    if (!task) throw new Error('Task not found');

    const project = await ProjectQueries.findById(task.project_id);
    const hasAccess = await this.checkWorkspaceAccess(
      project.workspace_id,
      userId
    );
    if (!hasAccess) throw new Error('You do not have access to this task');

    // Validate parent comment belongs to same task
    if (data.parentId) {
      const parent = await CommentQueries.findById(data.parentId);
      if (!parent || parent.task_id !== taskId) {
        throw new Error('Parent comment not found');
      }
    }

    // Create comment
    const comment = await CommentQueries.create({
      content: data.content,
      taskId,
      authorId: userId,
      parentId: data.parentId,
    });

    // Extract and store mentions
    const emails = this.extractMentionEmails(data.content);
    const mentionedUserIds = await this.resolveMentionsToUserIds(
      emails,
      project.workspace_id
    );
    if (mentionedUserIds.length > 0) {
      await MentionQueries.createMany(comment.id, mentionedUserIds);
    }

    // Return enriched comment
    return this.enrichComment(comment, mentionedUserIds);
  }

  async getTaskComments(taskId, userId) {
    const task = await TaskQueries.findById(taskId);
    if (!task) throw new Error('Task not found');

    const project = await ProjectQueries.findById(task.project_id);
    const hasAccess = await this.checkWorkspaceAccess(
      project.workspace_id,
      userId
    );
    if (!hasAccess) throw new Error('You do not have access to this task');

    const comments = await CommentQueries.findByTask(taskId);
    return comments.map((c) => this.enrichCommentTree(c));
  }

  async updateComment(commentId, userId, content) {
    const comment = await CommentQueries.findById(commentId);
    if (!comment) throw new Error('Comment not found');

    // Only author can edit
    if (comment.author_id !== userId) {
      throw new Error('You can only edit your own comments');
    }

    const updated = await CommentQueries.update(commentId, content);

    // Re-sync mentions
    await MentionQueries.deleteByComment(commentId);
    const task = await TaskQueries.findById(comment.task_id);
    const project = await ProjectQueries.findById(task.project_id);
    const emails = this.extractMentionEmails(content);
    const mentionedUserIds = await this.resolveMentionsToUserIds(
      emails,
      project.workspace_id
    );
    if (mentionedUserIds.length > 0) {
      await MentionQueries.createMany(commentId, mentionedUserIds);
    }

    return this.enrichComment(updated, mentionedUserIds);
  }

  async deleteComment(commentId, userId) {
    const comment = await CommentQueries.findById(commentId);
    if (!comment) throw new Error('Comment not found');

    // Only author OR MANAGER+ can delete
    const task = await TaskQueries.findById(comment.task_id);
    const project = await ProjectQueries.findById(task.project_id);
    const workspaceRole = await this.getWorkspaceRole(
      project.workspace_id,
      userId
    );

    const isAuthor = comment.author_id === userId;
    const isManager = ['OWNER', 'ADMIN', 'MANAGER'].includes(workspaceRole);

    if (!isAuthor && !isManager) {
      throw new Error('You do not have permission to delete this comment');
    }

    await CommentQueries.delete(commentId);
    return true;
  }

  // ─── Helpers ───────────────────────────────────────
  enrichComment(comment, mentionedUserIds = []) {
    if (!comment) return null;
    return {
      id: comment.id,
      content: comment.content,
      taskId: comment.task_id,
      authorId: comment.author_id,
      parentId: comment.parent_id,
      isEdited: comment.is_edited,
      editedAt: comment.edited_at,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      mentionedUserIds,
    };
  }

  enrichCommentTree(comment) {
    return {
      id: comment.id,
      content: comment.content,
      taskId: comment.task_id,
      authorId: comment.author_id,
      authorName: comment.author_name,
      authorEmail: comment.author_email,
      authorPicture: comment.author_picture,
      parentId: comment.parent_id,
      isEdited: comment.is_edited,
      editedAt: comment.edited_at,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      replies: (comment.replies || []).map((r) => this.enrichCommentTree(r)),
    };
  }

  async checkWorkspaceAccess(workspaceId, userId) {
    const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
    if (isOwner) return true;
    return WorkspaceQueries.isMember(workspaceId, userId);
  }

  async getWorkspaceRole(workspaceId, userId) {
    const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
    if (isOwner) return 'OWNER';
    return WorkspaceQueries.getUserRole(workspaceId, userId);
  }
}

module.exports = CommentService;
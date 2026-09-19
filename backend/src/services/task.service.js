// // const TaskQueries = require('../db/queries/task.queries');
// // const ProjectQueries = require('../db/queries/project.queries');
// // const WorkspaceQueries = require('../db/queries/workspace.queries');
// // const ActivityService = require('./activity.service');
// // const activityService = new ActivityService();
// // const NotificationService = require('./notification.service');
// // const notificationService = new NotificationService();
// // const { emitToWorkspace } = require('../config/socket');
// // const { invalidateCache, buildKey } = require('../utils/cache.utils');

// // class TaskService {
// //   async createTask(projectId, userId, data) {
// //     const project = await ProjectQueries.findById(projectId);
// //     if (!project) {
// //       throw new Error('Project not found');
// //     }

// //     const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
// //     if (!hasAccess) {
// //       throw new Error('You do not have access to this project');
// //     }

// //     // Convert user_id → workspace_member_id
// //     let workspaceMemberId = null;
// //     if (data.assigneeId) {
// //       const members = await WorkspaceQueries.getMembers(project.workspace_id);
// //       const workspaceMember = members.find((m) => m.user_id === data.assigneeId);
// //       if (!workspaceMember) {
// //         throw new Error('Assignee is not a member of this workspace');
// //       }
// //       workspaceMemberId = workspaceMember.id;
// //     }

// //     const task = await TaskQueries.create({
// //       title: data.title,
// //       description: data.description,
// //       status: data.status || 'TODO',
// //       priority: data.priority || 'MEDIUM',
// //       dueDate: data.dueDate,
// //       storyPoints: data.storyPoints,
// //       projectId,
// //       createdById: userId,
// //       assigneeId: workspaceMemberId,
// //       reporterId: userId,
// //       metadata: data.metadata,
// //     });

// //     // Log activity
// //     await activityService.log({
// //       action: 'CREATED',
// //       userId,
// //       workspaceId: project.workspace_id,
// //       projectId,
// //       taskId: task.id,
// //       changes: { title: task.title },
// //     });

// //     // Notify assignee
// //     if (workspaceMemberId && data.assigneeId) {
// //       await notificationService.notifyTaskAssigned({
// //         userId: data.assigneeId,
// //         actorId: userId,
// //         taskId: task.id,
// //         taskTitle: task.title,
// //         projectId,
// //         workspaceId: project.workspace_id,
// //       });
// //     }

// //     await this.invalidateTaskCaches(project.workspace_id);

// //     // ⬇️ THE FIX: Re-fetch with joins before returning
// //     const fresh = await TaskQueries.findById(task.id);
// //     return this.enrichTask(fresh);
// //   }
// //   async getTask(taskId, userId) {
// //     const task = await TaskQueries.findById(taskId);
// //     if (!task) {
// //       throw new Error('Task not found');
// //     }

// //     const project = await ProjectQueries.findById(task.project_id);
// //     const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
// //     if (!hasAccess) {
// //       throw new Error('You do not have access to this task');
// //     }

// //     return this.enrichTask(task);
// //   }

// //   async getProjectTasks(projectId, userId, filters = {}) {
// //     // Verify project exists and user has access
// //     const project = await ProjectQueries.findById(projectId);
// //     if (!project) {
// //       throw new Error('Project not found');
// //     }

// //     const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
// //     if (!hasAccess) {
// //       throw new Error('You do not have access to this project');
// //     }

// //     const tasks = await TaskQueries.findByProject(projectId, filters);

// //     // If pagination is requested, return with count
// //     if (filters.limit) {
// //       const total = await TaskQueries.countByProject(projectId, filters);
// //       return {
// //         data: tasks.map(this.enrichTask),
// //         total,
// //         page: parseInt(filters.page) || 1,
// //         limit: parseInt(filters.limit),
// //       };
// //     }

// //     return tasks.map(this.enrichTask);
// //   }

// //   async updateTask(taskId, userId, data) {
// //     const task = await TaskQueries.findById(taskId);
// //     if (!task) {
// //       throw new Error('Task not found');
// //     }

// //     const project = await ProjectQueries.findById(task.project_id);
// //     const workspaceRole = await this.getWorkspaceRole(project.workspace_id, userId);

// //     if (!workspaceRole) {
// //       throw new Error('You do not have access to this task');
// //     }

// //     // RBAC
// //     const isOwnTask =
// //       task.created_by_id === userId || task.assignee_user_id === userId;
// //     const canEditAnyTask = ['MANAGER', 'ADMIN', 'OWNER'].includes(workspaceRole);
// //     const canEditOwnTask = workspaceRole === 'MEMBER' && isOwnTask;

// //     if (!canEditAnyTask && !canEditOwnTask) {
// //       throw new Error('You do not have permission to edit this task');
// //     }

// //     // ⬇️ Outer scope for change tracking
// //     const changes = {};
// //     const updateData = {};

// //     // ─── Title ────────────────────────────────────────
// //     if (data.title !== undefined && data.title !== task.title) {
// //       updateData.title = data.title;
// //       changes.title = { from: task.title, to: data.title };
// //     }

// //     // ─── Description ──────────────────────────────────
// //     if (data.description !== undefined) {
// //       updateData.description = data.description;
// //       // Not tracked as a change (often noisy) — add if you want
// //     }

// //     // ─── Status ───────────────────────────────────────
// //     if (data.status !== undefined && data.status !== task.status) {
// //       updateData.status = data.status;
// //       changes.status = { from: task.status, to: data.status };
// //     }

// //     // ─── Priority ─────────────────────────────────────
// //     if (data.priority !== undefined && data.priority !== task.priority) {
// //       updateData.priority = data.priority;
// //       changes.priority = { from: task.priority, to: data.priority };
// //     }

// //     // ─── Due Date ─────────────────────────────────────
// //     if (data.dueDate !== undefined) {
// //       updateData.due_date = data.dueDate;
// //     }

// //     // ─── Story Points ─────────────────────────────────
// //     if (data.storyPoints !== undefined) {
// //       updateData.story_points = data.storyPoints;
// //     }

// //     // ─── Metadata ─────────────────────────────────────
// //     if (data.metadata !== undefined) {
// //       updateData.metadata = data.metadata;
// //     }

// //     // ─── Assignee ─────────────────────────────────────
// //     if (data.assigneeId !== undefined) {
// //       // Resolve target (user_id → workspace_member_id or null)
// //       let newAssigneeId = null;

// //       if (data.assigneeId !== null && data.assigneeId !== '') {
// //         const members = await WorkspaceQueries.getMembers(project.workspace_id);
// //         const workspaceMember = members.find(
// //           (m) => m.user_id === data.assigneeId
// //         );
// //         if (!workspaceMember) {
// //           throw new Error('Assignee is not a member of this workspace');
// //         }
// //         newAssigneeId = workspaceMember.id;
// //       }

// //       // ⬇️ Only update + log if the value ACTUALLY changed
// //       const oldAssigneeId = task.assignee_id || null;

// //       if (oldAssigneeId !== newAssigneeId) {
// //         updateData.assignee_id = newAssigneeId;
// //         changes.assignee = {
// //           from: oldAssigneeId,
// //           to: newAssigneeId,
// //         };
// //       }
// //       // If unchanged → skip update + skip logging
// //     }

// //     // ─── Persist ──────────────────────────────────────
// //     const updated = await TaskQueries.update(taskId, updateData);

// //     // ─── Log activities ───────────────────────────────
// //     if (changes.status) {
// //       await activityService.log({
// //         action: 'STATUS_CHANGED',
// //         userId,
// //         workspaceId: project.workspace_id,
// //         projectId: project.id,
// //         taskId,
// //         changes: changes.status,
// //       });
// //     }

// //     if (changes.priority) {
// //       await activityService.log({
// //         action: 'PRIORITY_CHANGED',
// //         userId,
// //         workspaceId: project.workspace_id,
// //         projectId: project.id,
// //         taskId,
// //         changes: changes.priority,
// //       });
// //     }

// //     if (changes.assignee) {
// //       await activityService.log({
// //         action: task.assignee_id ? 'REASSIGNED' : 'ASSIGNED',
// //         userId,
// //         workspaceId: project.workspace_id,
// //         projectId: project.id,
// //         taskId,
// //         changes: changes.assignee,
// //       });
// //     }

// //     // Generic update log — only if no specific changes were logged
// //     const hasSpecificChange =
// //       changes.status || changes.priority || changes.assignee;
// //     if (!hasSpecificChange && Object.keys(changes).length > 0) {
// //       await activityService.log({
// //         action: 'UPDATED',
// //         userId,
// //         workspaceId: project.workspace_id,
// //         projectId: project.id,
// //         taskId,
// //         changes,
// //       });
// //     }

// //     if (changes.assignee && changes.assignee.to) {
// //       // Find the user_id for the new workspace_member_id
// //       const members = await WorkspaceQueries.getMembers(project.workspace_id);
// //       const newAssignee = members.find((m) => m.id === changes.assignee.to);
// //       if (newAssignee) {
// //         await notificationService.notifyTaskAssigned({
// //           userId: newAssignee.user_id,
// //           actorId: userId,
// //           taskId,
// //           taskTitle: updated.title,
// //           projectId: project.id,
// //         });
// //       }
// //     }

// //     const fresh = await TaskQueries.findById(taskId);
// //     emitToWorkspace(project.workspace_id, 'task:updated', {
// //       task: this.enrichTask(fresh),
// //       projectId: project.id,
// //       workspaceId: project.workspace_id,
// //       actorId: userId,
// //     });

// //     await this.invalidateTaskCaches(project.workspace_id);

// //     // Re-fetch with all joins
// //     return this.enrichTask(fresh);
// //   }
// //   async updateTaskStatus(taskId, userId, status, position) {
// //     const task = await TaskQueries.findById(taskId);
// //     if (!task) throw new Error('Task not found');

// //     const project = await ProjectQueries.findById(task.project_id);
// //     const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
// //     if (!hasAccess) throw new Error('You do not have access to this task');

// //     const oldStatus = task.status;
// //     const oldPosition = task.position;

// //     await TaskQueries.updateStatus(taskId, status, position);

// //     if (oldStatus !== status) {
// //       await activityService.log({
// //         action: status === 'DONE' ? 'COMPLETED' : 'STATUS_CHANGED',
// //         userId,
// //         workspaceId: project.workspace_id,
// //         projectId: project.id,
// //         taskId,
// //         changes: { from: oldStatus, to: status },
// //       });
// //     } else if (oldPosition !== position) {
// //       await activityService.log({
// //         action: 'MOVED',
// //         userId,
// //         workspaceId: project.workspace_id,
// //         projectId: project.id,
// //         taskId,
// //         changes: { from: oldPosition, to: position },
// //       });
// //     }

// //     if (oldStatus !== status) {
// //       const members = await WorkspaceQueries.getMembers(project.workspace_id);
// //       const assignee = members.find((m) => m.id === task.assignee_id);
// //       if (assignee && assignee.user_id !== userId) {
// //         await notificationService.notifyStatusChanged({
// //           userId: assignee.user_id,
// //           actorId: userId,
// //           taskId,
// //           taskTitle: task.title,
// //           from: oldStatus,
// //           to: status,
// //           projectId: project.id,
// //         });
// //       }
// //     }

// //     const fresh = await TaskQueries.findById(taskId);
// //     emitToWorkspace(project.workspace_id, 'task:moved', {
// //       taskId,
// //       status,
// //       position,
// //       projectId: project.id,
// //       workspaceId: project.workspace_id,
// //       actorId: userId,
// //     });

// //     await this.invalidateTaskCaches(project.workspace_id);

// //     return this.enrichTask(fresh);
// //   }

// //   async reorderTasks(projectId, userId, status, taskIds) {
// //     const project = await ProjectQueries.findById(projectId);
// //     if (!project) {
// //       throw new Error('Project not found');
// //     }

// //     const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
// //     if (!hasAccess) {
// //       throw new Error('You do not have access to this project');
// //     }

// //     await TaskQueries.reorderTasks(projectId, status, taskIds);

// //     await this.invalidateTaskCaches(project.workspace_id);

// //     return true;
// //   }

// //   async deleteTask(taskId, userId) {
// //     const task = await TaskQueries.findById(taskId);
// //     if (!task) {
// //       throw new Error('Task not found');
// //     }

// //     const project = await ProjectQueries.findById(task.project_id);
// //     const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
// //     if (!hasAccess) {
// //       throw new Error('You do not have access to this task');
// //     }

// //     await activityService.log({
// //       action: 'DELETED',
// //       userId,
// //       workspaceId: project.workspace_id,
// //       projectId: project.id,
// //       taskId,
// //       changes: { title: task.title },
// //     });

// //     emitToWorkspace(project.workspace_id, 'task:deleted', {
// //       taskId,
// //       projectId: project.id,
// //       workspaceId: project.workspace_id,
// //       actorId: userId,
// //     });

// //     await TaskQueries.delete(taskId);
// //     await this.invalidateTaskCaches(project.workspace_id);
// //     return true;
// //   }

// //   async archiveTask(taskId, userId) {
// //     const task = await TaskQueries.findById(taskId);
// //     if (!task) {
// //       throw new Error('Task not found');
// //     }

// //     const project = await ProjectQueries.findById(task.project_id);
// //     const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
// //     if (!hasAccess) {
// //       throw new Error('You do not have access to this task');
// //     }

// //     const result = await TaskQueries.archive(taskId);

// //     await activityService.log({
// //       action: 'ARCHIVED',
// //       userId,
// //       workspaceId: project.workspace_id,
// //       projectId: project.id,
// //       taskId,
// //     });

// //     emitToWorkspace(project.workspace_id, 'task:archived', {
// //       taskId,
// //       projectId: project.id,
// //       workspaceId: project.workspace_id,
// //     });

// //     await this.invalidateTaskCaches(project.workspace_id);
// //     return result;
// //   }

// //   async unarchiveTask(taskId, userId) {
// //     const task = await TaskQueries.findById(taskId);
// //     if (!task) {
// //       throw new Error('Task not found');
// //     }

// //     const project = await ProjectQueries.findById(task.project_id);
// //     const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
// //     if (!hasAccess) {
// //       throw new Error('You do not have access to this task');
// //     }

// //     const result = await TaskQueries.unarchive(taskId);

// //     await activityService.log({
// //       action: 'RESTORED',
// //       userId,
// //       workspaceId: project.workspace_id,
// //       projectId: project.id,
// //       taskId,
// //     });

// //     emitToWorkspace(project.workspace_id, 'task:unarchived', {
// //       taskId,
// //       projectId: project.id,
// //       workspaceId: project.workspace_id,
// //     });

// //     await this.invalidateTaskCaches(project.workspace_id);

// //     // For unarchive: 'task:unarchived'
// //     return result;
// //   }

// //   async duplicateTask(taskId, userId) {
// //     const task = await TaskQueries.findById(taskId);
// //     if (!task) throw new Error('Task not found');

// //     const project = await ProjectQueries.findById(task.project_id);
// //     const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
// //     if (!hasAccess) throw new Error('You do not have access to this task');

// //     // ⬇️ Duplicate FIRST, THEN emit
// //     const duplicated = await TaskQueries.duplicate(taskId, userId);

// //     // Re-fetch with joins
// //     const fresh = await TaskQueries.findById(duplicated.id);

// //     emitToWorkspace(project.workspace_id, 'task:created', {
// //       task: this.enrichTask(fresh),
// //       projectId: project.id,
// //       workspaceId: project.workspace_id,
// //       actorId: userId,
// //     });

// //     // ⬇️ INVALIDATE
// //     await this.invalidateTaskCaches(project.workspace_id);

// //     return this.enrichTask(fresh);
// //   }

// //   async getTaskStats(projectId, userId) {
// //     const project = await ProjectQueries.findById(projectId);
// //     if (!project) {
// //       throw new Error('Project not found');
// //     }

// //     const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
// //     if (!hasAccess) {
// //       throw new Error('You do not have access to this project');
// //     }

// //     const stats = await TaskQueries.getStatsByProject(projectId);

// //     return {
// //       total: parseInt(stats.total),
// //       byStatus: {
// //         todo: parseInt(stats.todo),
// //         inProgress: parseInt(stats.in_progress),
// //         review: parseInt(stats.review),
// //         done: parseInt(stats.done),
// //         blocked: parseInt(stats.blocked),
// //       },
// //       byPriority: {
// //         urgent: parseInt(stats.urgent),
// //         high: parseInt(stats.high),
// //         medium: parseInt(stats.medium),
// //         low: parseInt(stats.low),
// //       },
// //       overdue: parseInt(stats.overdue),
// //     };
// //   }

// //   async getMyTasks(userId, filters = {}) {
// //     const tasks = await TaskQueries.getMyTasks(userId, filters);
// //     return tasks.map(this.enrichTask);
// //   }


// //   // Helper methods
// //   enrichTask(task) {
// //     if (!task) return null;

// //     return {
// //       id: task.id,
// //       title: task.title,
// //       description: task.description,
// //       status: task.status,
// //       priority: task.priority,
// //       dueDate: task.due_date,
// //       storyPoints: task.story_points,
// //       position: task.position,
// //       isArchived: task.is_archived,
// //       metadata: task.metadata,
// //       projectId: task.project_id,
// //       projectName: task.project_name,
// //       workspaceId: task.workspace_id,
// //       createdById: task.created_by_id,
// //       createdByName: task.created_by_name,
// //       createdByEmail: task.created_by_email,
// //       assigneeId: task.assignee_id,
// //       assigneeUserId: task.assignee_user_id,
// //       assigneeName: task.assignee_name,
// //       assigneeEmail: task.assignee_email,
// //       assigneePicture: task.assignee_picture,
// //       reporterId: task.reporter_id,
// //       reporterName: task.reporter_name,
// //       commentCount: parseInt(task.comment_count || 0),
// //       attachmentCount: parseInt(task.attachment_count || 0),
// //       createdAt: task.created_at,
// //       updatedAt: task.updated_at,
// //       completedAt: task.completed_at,
// //     };
// //   }

// // async checkWorkspaceAccess(workspaceId, userId) {
// //   const access = await WorkspaceQueries.getWorkspaceAccess(workspaceId, userId);
// //   return access.isOwner || access.isMember;
// // }

// //   async invalidateTaskCaches(workspaceId) {
// //     await invalidateCache(buildKey('dashboard', '*', workspaceId));
// //   }

// //   async checkProjectAccess(project, userId) {
// //     return this.checkWorkspaceAccess(project.workspace_id, userId);
// //   }
// // async getWorkspaceMember(workspaceId, userId) {
// //   return WorkspaceQueries.findMemberByUser(workspaceId, userId);
// // }

// //   async getWorkspaceRole(workspaceId, userId) {
// //     const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
// //     if (isOwner) return 'OWNER';
// //     return WorkspaceQueries.getUserRole(workspaceId, userId);
// //   }
// // }

// // module.exports = TaskService;

// const TaskQueries = require('../db/queries/task.queries');
// const ProjectQueries = require('../db/queries/project.queries');
// const WorkspaceQueries = require('../db/queries/workspace.queries');
// const ActivityService = require('./activity.service');
// const activityService = new ActivityService();
// const NotificationService = require('./notification.service');
// const notificationService = new NotificationService();
// const { emitToWorkspace } = require('../config/socket');
// const { invalidateCache, buildKey, cacheWrapper } = require('../utils/cache.utils');

// class TaskService {
//   async createTask(projectId, userId, data) {
//     const project = await ProjectQueries.findById(projectId);
//     if (!project) throw new Error('Project not found');

//     const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
//     if (!hasAccess) throw new Error('You do not have access to this project');

//     // Convert user_id → workspace_member_id
//     let workspaceMemberId = null;
//     if (data.assigneeId) {
//       const workspaceMember = await WorkspaceQueries.findMemberByUser(
//         project.workspace_id,
//         data.assigneeId
//       );
//       if (!workspaceMember) {
//         throw new Error('Assignee is not a member of this workspace');
//       }
//       workspaceMemberId = workspaceMember.id;
//     }

//     const task = await TaskQueries.create({
//       title: data.title,
//       description: data.description,
//       status: data.status || 'TODO',
//       priority: data.priority || 'MEDIUM',
//       dueDate: data.dueDate,
//       storyPoints: data.storyPoints,
//       projectId,
//       createdById: userId,
//       assigneeId: workspaceMemberId,
//       reporterId: userId,
//       metadata: data.metadata,
//     });

//     await activityService.log({
//       action: 'CREATED',
//       userId,
//       workspaceId: project.workspace_id,
//       projectId,
//       taskId: task.id,
//       changes: { title: task.title },
//     });

//     if (workspaceMemberId && data.assigneeId) {
//       await notificationService.notifyTaskAssigned({
//         userId: data.assigneeId,
//         actorId: userId,
//         taskId: task.id,
//         taskTitle: task.title,
//         projectId,
//         workspaceId: project.workspace_id,
//       });
//     }

//     await this.invalidateTaskCaches(project.workspace_id);

//     if (data.assigneeId && data.assigneeId !== userId) {
//       await invalidateCache(buildKey('mytasks', data.assigneeId, '*'));
//     }

//     // Also invalidate the creator's
//     await invalidateCache(buildKey('mytasks', userId, '*'));

//     const fresh = await TaskQueries.findById(task.id);
//     return this.enrichTask(fresh);
//   }

//   async getTask(taskId, userId) {
//     const task = await TaskQueries.findById(taskId);
//     if (!task) throw new Error('Task not found');

//     const project = await ProjectQueries.findById(task.project_id);
//     const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
//     if (!hasAccess) throw new Error('You do not have access to this task');

//     return this.enrichTask(task);
//   }

//   async getProjectTasks(projectId, userId, filters = {}) {
//     const project = await ProjectQueries.findById(projectId);
//     if (!project) throw new Error('Project not found');

//     const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
//     if (!hasAccess) throw new Error('You do not have access to this project');

//     const tasks = await TaskQueries.findByProject(projectId, filters);

//     if (filters.limit) {
//       const total = await TaskQueries.countByProject(projectId, filters);
//       return {
//         data: tasks.map(this.enrichTask),
//         total,
//         page: parseInt(filters.page) || 1,
//         limit: parseInt(filters.limit),
//       };
//     }

//     return tasks.map(this.enrichTask);
//   }

//   async updateTask(taskId, userId, data) {
//     const task = await TaskQueries.findById(taskId);
//     if (!task) throw new Error('Task not found');

//     const project = await ProjectQueries.findById(task.project_id);
//     const workspaceRole = await this.getWorkspaceRole(project.workspace_id, userId);

//     if (!workspaceRole) throw new Error('You do not have access to this task');

//     // RBAC
//     const isOwnTask =
//       task.created_by_id === userId || task.assignee_user_id === userId;
//     const canEditAnyTask = ['MANAGER', 'ADMIN', 'OWNER'].includes(workspaceRole);
//     const canEditOwnTask = workspaceRole === 'MEMBER' && isOwnTask;

//     if (!canEditAnyTask && !canEditOwnTask) {
//       throw new Error('You do not have permission to edit this task');
//     }

//     const changes = {};
//     const updateData = {};

//     if (data.title !== undefined && data.title !== task.title) {
//       updateData.title = data.title;
//       changes.title = { from: task.title, to: data.title };
//     }

//     if (data.description !== undefined) {
//       updateData.description = data.description;
//     }

//     if (data.status !== undefined && data.status !== task.status) {
//       updateData.status = data.status;
//       changes.status = { from: task.status, to: data.status };
//     }

//     if (data.priority !== undefined && data.priority !== task.priority) {
//       updateData.priority = data.priority;
//       changes.priority = { from: task.priority, to: data.priority };
//     }

//     if (data.dueDate !== undefined) updateData.due_date = data.dueDate;
//     if (data.storyPoints !== undefined) updateData.story_points = data.storyPoints;
//     if (data.metadata !== undefined) updateData.metadata = data.metadata;

//     // ─── Assignee ─────────────────────────────────────
//     if (data.assigneeId !== undefined) {
//       let newAssigneeId = null;

//       if (data.assigneeId !== null && data.assigneeId !== '') {
//         const workspaceMember = await WorkspaceQueries.findMemberByUser(
//           project.workspace_id,
//           data.assigneeId
//         );
//         if (!workspaceMember) {
//           throw new Error('Assignee is not a member of this workspace');
//         }
//         newAssigneeId = workspaceMember.id;
//       }

//       const oldAssigneeId = task.assignee_id || null;

//       if (oldAssigneeId !== newAssigneeId) {
//         updateData.assignee_id = newAssigneeId;
//         changes.assignee = { from: oldAssigneeId, to: newAssigneeId };
//       }
//     }

//     const updated = await TaskQueries.update(taskId, updateData);

//     // ─── Activity logs ────────────────────────────────
//     if (changes.status) {
//       await activityService.log({
//         action: 'STATUS_CHANGED',
//         userId,
//         workspaceId: project.workspace_id,
//         projectId: project.id,
//         taskId,
//         changes: changes.status,
//       });
//     }

//     if (changes.priority) {
//       await activityService.log({
//         action: 'PRIORITY_CHANGED',
//         userId,
//         workspaceId: project.workspace_id,
//         projectId: project.id,
//         taskId,
//         changes: changes.priority,
//       });
//     }

//     if (changes.assignee) {
//       await activityService.log({
//         action: task.assignee_id ? 'REASSIGNED' : 'ASSIGNED',
//         userId,
//         workspaceId: project.workspace_id,
//         projectId: project.id,
//         taskId,
//         changes: changes.assignee,
//       });
//     }

//     const hasSpecificChange =
//       changes.status || changes.priority || changes.assignee;
//     if (!hasSpecificChange && Object.keys(changes).length > 0) {
//       await activityService.log({
//         action: 'UPDATED',
//         userId,
//         workspaceId: project.workspace_id,
//         projectId: project.id,
//         taskId,
//         changes,
//       });
//     }

//     // ─── Notify new assignee ──────────────────────────
//     if (changes.assignee && changes.assignee.to) {
//       const newAssignee = await WorkspaceQueries.findMemberById(
//         project.workspace_id,
//         changes.assignee.to
//       );
//       if (newAssignee) {
//         await notificationService.notifyTaskAssigned({
//           userId: newAssignee.user_id,
//           actorId: userId,
//           taskId,
//           taskTitle: updated.title,
//           projectId: project.id,
//           workspaceId: project.workspace_id,   // ⬅️ ADD
//         });
//       }
//     }

//     const fresh = await TaskQueries.findById(taskId);
//     emitToWorkspace(project.workspace_id, 'task:updated', {
//       task: this.enrichTask(fresh),
//       projectId: project.id,
//       workspaceId: project.workspace_id,
//       actorId: userId,
//     });

//     await this.invalidateTaskCaches(project.workspace_id);

//     if (data.assigneeId && data.assigneeId !== userId) {
//       await invalidateCache(buildKey('mytasks', data.assigneeId, '*'));
//     }

//     // Also invalidate the creator's
//     await invalidateCache(buildKey('mytasks', userId, '*'));

//     return this.enrichTask(fresh);
//   }

//   async updateTaskStatus(taskId, userId, status, position) {
//     const task = await TaskQueries.findById(taskId);
//     if (!task) throw new Error('Task not found');

//     const project = await ProjectQueries.findById(task.project_id);
//     const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
//     if (!hasAccess) throw new Error('You do not have access to this task');

//     const oldStatus = task.status;
//     const oldPosition = task.position;

//     await TaskQueries.updateStatus(taskId, status, position);

//     if (oldStatus !== status) {
//       await activityService.log({
//         action: status === 'DONE' ? 'COMPLETED' : 'STATUS_CHANGED',
//         userId,
//         workspaceId: project.workspace_id,
//         projectId: project.id,
//         taskId,
//         changes: { from: oldStatus, to: status },
//       });
//     } else if (oldPosition !== position) {
//       await activityService.log({
//         action: 'MOVED',
//         userId,
//         workspaceId: project.workspace_id,
//         projectId: project.id,
//         taskId,
//         changes: { from: oldPosition, to: position },
//       });
//     }

//     if (oldStatus !== status) {
//       const assignee = task.assignee_id
//         ? await WorkspaceQueries.findMemberById(project.workspace_id, task.assignee_id)
//         : null;

//       if (assignee && assignee.user_id !== userId) {
//         await notificationService.notifyStatusChanged({
//           userId: assignee.user_id,
//           actorId: userId,
//           taskId,
//           taskTitle: task.title,
//           from: oldStatus,
//           to: status,
//           projectId: project.id,
//           workspaceId: project.workspace_id,   // ⬅️ ADD
//         });
//       }
//     }

//     const fresh = await TaskQueries.findById(taskId);
//     emitToWorkspace(project.workspace_id, 'task:moved', {
//       taskId,
//       status,
//       position,
//       projectId: project.id,
//       workspaceId: project.workspace_id,
//       actorId: userId,
//     });

//     await this.invalidateTaskCaches(project.workspace_id);

//     return this.enrichTask(fresh);
//   }

//   async reorderTasks(projectId, userId, status, taskIds) {
//     const project = await ProjectQueries.findById(projectId);
//     if (!project) throw new Error('Project not found');

//     const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
//     if (!hasAccess) throw new Error('You do not have access to this project');

//     await TaskQueries.reorderTasks(projectId, status, taskIds);
//     await this.invalidateTaskCaches(project.workspace_id);

//     return true;
//   }
// async deleteTask(taskId, userId) {
//   const task = await TaskQueries.findById(taskId);
//   if (!task) throw new Error('Task not found');

//   const project = await ProjectQueries.findById(task.project_id);
//   const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
//   if (!hasAccess) throw new Error('You do not have access to this task');

//   await activityService.log({
//     action: 'DELETED',
//     userId,
//     workspaceId: project.workspace_id,
//     projectId: project.id,
//     taskId,
//     changes: { title: task.title },
//   });

//   emitToWorkspace(project.workspace_id, 'task:deleted', {
//     taskId,
//     projectId: project.id,
//     workspaceId: project.workspace_id,
//     actorId: userId,
//   });

//   await TaskQueries.delete(taskId);
//   await this.invalidateTaskCaches(project.workspace_id);

//   // Invalidate my-tasks cache for both creator and assignee (if any)
//   await invalidateCache(
//     buildKey('mytasks', userId, '*'),
//     ...(task.assignee_user_id && task.assignee_user_id !== userId
//       ? [buildKey('mytasks', task.assignee_user_id, '*')]
//       : [])
//   );

//   return true;
// }

//   async archiveTask(taskId, userId) {
//     const task = await TaskQueries.findById(taskId);
//     if (!task) throw new Error('Task not found');

//     const project = await ProjectQueries.findById(task.project_id);
//     const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
//     if (!hasAccess) throw new Error('You do not have access to this task');

//     const result = await TaskQueries.archive(taskId);

//     await activityService.log({
//       action: 'ARCHIVED',
//       userId,
//       workspaceId: project.workspace_id,
//       projectId: project.id,
//       taskId,
//     });

//     emitToWorkspace(project.workspace_id, 'task:archived', {
//       taskId,
//       projectId: project.id,
//       workspaceId: project.workspace_id,
//     });

//     await this.invalidateTaskCaches(project.workspace_id);

//     return result;
//   }

//   async unarchiveTask(taskId, userId) {
//     const task = await TaskQueries.findById(taskId);
//     if (!task) throw new Error('Task not found');

//     const project = await ProjectQueries.findById(task.project_id);
//     const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
//     if (!hasAccess) throw new Error('You do not have access to this task');

//     const result = await TaskQueries.unarchive(taskId);

//     await activityService.log({
//       action: 'RESTORED',
//       userId,
//       workspaceId: project.workspace_id,
//       projectId: project.id,
//       taskId,
//     });

//     emitToWorkspace(project.workspace_id, 'task:unarchived', {
//       taskId,
//       projectId: project.id,
//       workspaceId: project.workspace_id,
//     });

//     await this.invalidateTaskCaches(project.workspace_id);

//     return result;
//   }

//   async duplicateTask(taskId, userId) {
//     const task = await TaskQueries.findById(taskId);
//     if (!task) throw new Error('Task not found');

//     const project = await ProjectQueries.findById(task.project_id);
//     const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
//     if (!hasAccess) throw new Error('You do not have access to this task');

//     const duplicated = await TaskQueries.duplicate(taskId, userId);
//     const fresh = await TaskQueries.findById(duplicated.id);

//     emitToWorkspace(project.workspace_id, 'task:created', {
//       task: this.enrichTask(fresh),
//       projectId: project.id,
//       workspaceId: project.workspace_id,
//       actorId: userId,
//     });

//     await this.invalidateTaskCaches(project.workspace_id);

//     return this.enrichTask(fresh);
//   }

//   async getTaskStats(projectId, userId) {
//     const project = await ProjectQueries.findById(projectId);
//     if (!project) throw new Error('Project not found');

//     const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
//     if (!hasAccess) throw new Error('You do not have access to this project');

//     const stats = await TaskQueries.getStatsByProject(projectId);

//     return {
//       total: parseInt(stats.total),
//       byStatus: {
//         todo: parseInt(stats.todo),
//         inProgress: parseInt(stats.in_progress),
//         review: parseInt(stats.review),
//         done: parseInt(stats.done),
//         blocked: parseInt(stats.blocked),
//       },
//       byPriority: {
//         urgent: parseInt(stats.urgent),
//         high: parseInt(stats.high),
//         medium: parseInt(stats.medium),
//         low: parseInt(stats.low),
//       },
//       overdue: parseInt(stats.overdue),
//     };
//   }

//   async getMyTasks(userId, filters = {}) {
//     // ─── Normalize filters ─────────────────────────────
//     const page = Math.max(1, parseInt(filters.page) || 1);
//     const limit = Math.min(100, Math.max(1, parseInt(filters.limit) || 20));
//     const status = filters.status || 'all';
//     const projectId = filters.projectId || 'all';

//     // ─── Build cache key ───────────────────────────────
//     const cacheKey = buildKey(
//       'mytasks',
//       userId,
//       'status', status,
//       'project', projectId,
//       'page', page,
//       'limit', limit
//     );
//     // → "mytasks:<userId>:status:TODO:project:all:page:1:limit:20"

//     // ─── Cache wrapper ─────────────────────────────────
//     return cacheWrapper(cacheKey, 30, async () => {
//       const result = await TaskQueries.getMyTasks(userId, {
//         status: filters.status,
//         projectId: filters.projectId,
//         page,
//         limit,
//       });

//       return {
//         data: result.data.map((t) => this.enrichTask(t)),
//         total: result.total,
//         page: result.page,
//         limit: result.limit,
//         totalPages: result.totalPages,
//       };
//     });
//   }

//   // ─── Helpers ────────────────────────────────────────
//   enrichTask(task) {
//     if (!task) return null;

//     return {
//       id: task.id,
//       title: task.title,
//       description: task.description,
//       status: task.status,
//       priority: task.priority,
//       dueDate: task.due_date,
//       storyPoints: task.story_points,
//       position: task.position,
//       isArchived: task.is_archived,
//       metadata: task.metadata,
//       projectId: task.project_id,
//       projectName: task.project_name,
//       workspaceId: task.workspace_id,
//       createdById: task.created_by_id,
//       createdByName: task.created_by_name,
//       createdByEmail: task.created_by_email,
//       assigneeId: task.assignee_id,
//       assigneeUserId: task.assignee_user_id,
//       assigneeName: task.assignee_name,
//       assigneeEmail: task.assignee_email,
//       assigneePicture: task.assignee_picture,
//       reporterId: task.reporter_id,
//       reporterName: task.reporter_name,
//       commentCount: parseInt(task.comment_count || 0),
//       attachmentCount: parseInt(task.attachment_count || 0),
//       createdAt: task.created_at,
//       updatedAt: task.updated_at,
//       completedAt: task.completed_at,
//     };
//   }

//   async checkWorkspaceAccess(workspaceId, userId) {
//     const access = await WorkspaceQueries.getWorkspaceAccess(workspaceId, userId);
//     return access.isOwner || access.isMember;
//   }

//   async invalidateTaskCaches(workspaceId) {
//     await invalidateCache(buildKey('dashboard', '*', workspaceId));
//   }

//   async checkProjectAccess(project, userId) {
//     return this.checkWorkspaceAccess(project.workspace_id, userId);
//   }

//   async getWorkspaceMember(workspaceId, userId) {
//     return WorkspaceQueries.findMemberByUser(workspaceId, userId);   // ⬅️ FIXED
//   }

//   async getWorkspaceRole(workspaceId, userId) {
//     const access = await WorkspaceQueries.getWorkspaceAccess(workspaceId, userId);
//     if (access.isOwner) return 'OWNER';
//     return access.role;
//   }
// }

// module.exports = TaskService;


const TaskQueries = require('../db/queries/task.queries');
const ProjectQueries = require('../db/queries/project.queries');
const WorkspaceQueries = require('../db/queries/workspace.queries');
const ActivityService = require('./activity.service');
const activityService = new ActivityService();
const NotificationService = require('./notification.service');
const notificationService = new NotificationService();
const { emitToWorkspace } = require('../config/socket');
const { invalidateCache, buildKey, cacheWrapper } = require('../utils/cache.utils');
const logger = require('../config/logger');

class TaskService {
  async createTask(projectId, userId, data) {
    const project = await ProjectQueries.findById(projectId);
    if (!project) throw new Error('Project not found');

    const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
    if (!hasAccess) throw new Error('You do not have access to this project');

    // Convert user_id → workspace_member_id
    let workspaceMemberId = null;
    if (data.assigneeId) {
      const workspaceMember = await WorkspaceQueries.findMemberByUser(
        project.workspace_id,
        data.assigneeId
      );
      if (!workspaceMember) {
        throw new Error('Assignee is not a member of this workspace');
      }
      workspaceMemberId = workspaceMember.id;
    }

    const task = await TaskQueries.create({
      title: data.title,
      description: data.description,
      status: data.status || 'TODO',
      priority: data.priority || 'MEDIUM',
      dueDate: data.dueDate,
      storyPoints: data.storyPoints,
      projectId,
      createdById: userId,
      assigneeId: workspaceMemberId,
      reporterId: userId,
      metadata: data.metadata,
    });

    await activityService.log({
      action: 'CREATED',
      userId,
      workspaceId: project.workspace_id,
      projectId,
      taskId: task.id,
      changes: { title: task.title },
    });

    if (workspaceMemberId && data.assigneeId) {
      try {
        await notificationService.notifyTaskAssigned({
          userId: data.assigneeId,
          actorId: userId,
          taskId: task.id,
          taskTitle: task.title,
          projectId,
          workspaceId: project.workspace_id,
        });
      } catch (notifError) {
        // ⚠️ Non-fatal — task is created, just notification failed
        logger.warn('Failed to notify assignee', {
          taskId: task.id,
          assigneeId: data.assigneeId,
          error: notifError.message,
        });
      }
    }

    await this.invalidateTaskCaches(project.workspace_id);

    if (data.assigneeId && data.assigneeId !== userId) {
      await invalidateCache(buildKey('mytasks', data.assigneeId, '*'));
    }

    await invalidateCache(buildKey('mytasks', userId, '*'));

    const fresh = await TaskQueries.findById(task.id);

    // ✅ Success log
    logger.info('Task created', {
      taskId: task.id,
      projectId,
      workspaceId: project.workspace_id,
      userId,
      title: task.title,
      status: task.status,
      priority: task.priority,
      assigneeId: data.assigneeId || null,
    });

    return this.enrichTask(fresh);
  }

  async getTask(taskId, userId) {
    const task = await TaskQueries.findById(taskId);
    if (!task) throw new Error('Task not found');

    const project = await ProjectQueries.findById(task.project_id);
    const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
    if (!hasAccess) throw new Error('You do not have access to this task');

    return this.enrichTask(task);
  }

  async getProjectTasks(projectId, userId, filters = {}) {
    const project = await ProjectQueries.findById(projectId);
    if (!project) throw new Error('Project not found');

    const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
    if (!hasAccess) throw new Error('You do not have access to this project');

    const tasks = await TaskQueries.findByProject(projectId, filters);

    if (filters.limit) {
      const total = await TaskQueries.countByProject(projectId, filters);
      return {
        data: tasks.map(this.enrichTask),
        total,
        page: parseInt(filters.page) || 1,
        limit: parseInt(filters.limit),
      };
    }

    return tasks.map(this.enrichTask);
  }

  async updateTask(taskId, userId, data) {
    const task = await TaskQueries.findById(taskId);
    if (!task) throw new Error('Task not found');

    const project = await ProjectQueries.findById(task.project_id);
    const workspaceRole = await this.getWorkspaceRole(project.workspace_id, userId);

    if (!workspaceRole) throw new Error('You do not have access to this task');

    // RBAC
    const isOwnTask =
      task.created_by_id === userId || task.assignee_user_id === userId;
    const canEditAnyTask = ['MANAGER', 'ADMIN', 'OWNER'].includes(workspaceRole);
    const canEditOwnTask = workspaceRole === 'MEMBER' && isOwnTask;

    if (!canEditAnyTask && !canEditOwnTask) {
      throw new Error('You do not have permission to edit this task');
    }

    const changes = {};
    const updateData = {};

    if (data.title !== undefined && data.title !== task.title) {
      updateData.title = data.title;
      changes.title = { from: task.title, to: data.title };
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.status !== undefined && data.status !== task.status) {
      updateData.status = data.status;
      changes.status = { from: task.status, to: data.status };
    }

    if (data.priority !== undefined && data.priority !== task.priority) {
      updateData.priority = data.priority;
      changes.priority = { from: task.priority, to: data.priority };
    }

    if (data.dueDate !== undefined) updateData.due_date = data.dueDate;
    if (data.storyPoints !== undefined) updateData.story_points = data.storyPoints;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    // ─── Assignee ─────────────────────────────────────
    if (data.assigneeId !== undefined) {
      let newAssigneeId = null;

      if (data.assigneeId !== null && data.assigneeId !== '') {
        const workspaceMember = await WorkspaceQueries.findMemberByUser(
          project.workspace_id,
          data.assigneeId
        );
        if (!workspaceMember) {
          throw new Error('Assignee is not a member of this workspace');
        }
        newAssigneeId = workspaceMember.id;
      }

      const oldAssigneeId = task.assignee_id || null;

      if (oldAssigneeId !== newAssigneeId) {
        updateData.assignee_id = newAssigneeId;
        changes.assignee = { from: oldAssigneeId, to: newAssigneeId };
      }
    }

    const updated = await TaskQueries.update(taskId, updateData);

    // ─── Activity logs ────────────────────────────────
    if (changes.status) {
      await activityService.log({
        action: 'STATUS_CHANGED',
        userId,
        workspaceId: project.workspace_id,
        projectId: project.id,
        taskId,
        changes: changes.status,
      });
    }

    if (changes.priority) {
      await activityService.log({
        action: 'PRIORITY_CHANGED',
        userId,
        workspaceId: project.workspace_id,
        projectId: project.id,
        taskId,
        changes: changes.priority,
      });
    }

    if (changes.assignee) {
      await activityService.log({
        action: task.assignee_id ? 'REASSIGNED' : 'ASSIGNED',
        userId,
        workspaceId: project.workspace_id,
        projectId: project.id,
        taskId,
        changes: changes.assignee,
      });
    }

    const hasSpecificChange =
      changes.status || changes.priority || changes.assignee;
    if (!hasSpecificChange && Object.keys(changes).length > 0) {
      await activityService.log({
        action: 'UPDATED',
        userId,
        workspaceId: project.workspace_id,
        projectId: project.id,
        taskId,
        changes,
      });
    }

    // ─── Notify new assignee ──────────────────────────
    if (changes.assignee && changes.assignee.to) {
      const newAssignee = await WorkspaceQueries.findMemberById(
        project.workspace_id,
        changes.assignee.to
      );
      if (newAssignee) {
        try {
          await notificationService.notifyTaskAssigned({
            userId: newAssignee.user_id,
            actorId: userId,
            taskId,
            taskTitle: updated.title,
            projectId: project.id,
            workspaceId: project.workspace_id,
          });
        } catch (notifError) {
          logger.warn('Failed to notify new assignee', {
            taskId,
            assigneeUserId: newAssignee.user_id,
            error: notifError.message,
          });
        }
      }
    }

    const fresh = await TaskQueries.findById(taskId);

    try {
      emitToWorkspace(project.workspace_id, 'task:updated', {
        task: this.enrichTask(fresh),
        projectId: project.id,
        workspaceId: project.workspace_id,
        actorId: userId,
      });
    } catch (socketError) {
      logger.warn('Failed to emit task:updated', {
        taskId,
        error: socketError.message,
      });
    }

    await this.invalidateTaskCaches(project.workspace_id);

    if (data.assigneeId && data.assigneeId !== userId) {
      await invalidateCache(buildKey('mytasks', data.assigneeId, '*'));
    }

    await invalidateCache(buildKey('mytasks', userId, '*'));

    // ✅ Success log — with change summary
    logger.info('Task updated', {
      taskId,
      projectId: project.id,
      workspaceId: project.workspace_id,
      userId,
      changes: Object.keys(changes),
    });

    return this.enrichTask(fresh);
  }

  async updateTaskStatus(taskId, userId, status, position) {
    const task = await TaskQueries.findById(taskId);
    if (!task) throw new Error('Task not found');

    const project = await ProjectQueries.findById(task.project_id);
    const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
    if (!hasAccess) throw new Error('You do not have access to this task');

    const oldStatus = task.status;
    const oldPosition = task.position;

    await TaskQueries.updateStatus(taskId, status, position);

    if (oldStatus !== status) {
      await activityService.log({
        action: status === 'DONE' ? 'COMPLETED' : 'STATUS_CHANGED',
        userId,
        workspaceId: project.workspace_id,
        projectId: project.id,
        taskId,
        changes: { from: oldStatus, to: status },
      });
    } else if (oldPosition !== position) {
      await activityService.log({
        action: 'MOVED',
        userId,
        workspaceId: project.workspace_id,
        projectId: project.id,
        taskId,
        changes: { from: oldPosition, to: position },
      });
    }

    if (oldStatus !== status) {
      const assignee = task.assignee_id
        ? await WorkspaceQueries.findMemberById(project.workspace_id, task.assignee_id)
        : null;

      if (assignee && assignee.user_id !== userId) {
        try {
          await notificationService.notifyStatusChanged({
            userId: assignee.user_id,
            actorId: userId,
            taskId,
            taskTitle: task.title,
            from: oldStatus,
            to: status,
            projectId: project.id,
            workspaceId: project.workspace_id,
          });
        } catch (notifError) {
          logger.warn('Failed to notify status change', {
            taskId,
            error: notifError.message,
          });
        }
      }
    }

    const fresh = await TaskQueries.findById(taskId);

    try {
      emitToWorkspace(project.workspace_id, 'task:moved', {
        taskId,
        status,
        position,
        projectId: project.id,
        workspaceId: project.workspace_id,
        actorId: userId,
      });
    } catch (socketError) {
      logger.warn('Failed to emit task:moved', {
        taskId,
        error: socketError.message,
      });
    }

    await this.invalidateTaskCaches(project.workspace_id);

    // ✅ Success log — only when status actually changed
    if (oldStatus !== status) {
      logger.info('Task status changed', {
        taskId,
        projectId: project.id,
        workspaceId: project.workspace_id,
        userId,
        from: oldStatus,
        to: status,
      });
    }

    return this.enrichTask(fresh);
  }

  async reorderTasks(projectId, userId, status, taskIds) {
    const project = await ProjectQueries.findById(projectId);
    if (!project) throw new Error('Project not found');

    const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
    if (!hasAccess) throw new Error('You do not have access to this project');

    await TaskQueries.reorderTasks(projectId, status, taskIds);
    await this.invalidateTaskCaches(project.workspace_id);

    // ✅ Success log
    logger.info('Tasks reordered', {
      projectId,
      workspaceId: project.workspace_id,
      userId,
      status,
      taskCount: taskIds.length,
    });

    return true;
  }

  async deleteTask(taskId, userId) {
    const task = await TaskQueries.findById(taskId);
    if (!task) throw new Error('Task not found');

    const project = await ProjectQueries.findById(task.project_id);
    const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
    if (!hasAccess) throw new Error('You do not have access to this task');

    await activityService.log({
      action: 'DELETED',
      userId,
      workspaceId: project.workspace_id,
      projectId: project.id,
      taskId,
      changes: { title: task.title },
    });

    try {
      emitToWorkspace(project.workspace_id, 'task:deleted', {
        taskId,
        projectId: project.id,
        workspaceId: project.workspace_id,
        actorId: userId,
      });
    } catch (socketError) {
      logger.warn('Failed to emit task:deleted', {
        taskId,
        error: socketError.message,
      });
    }

    await TaskQueries.delete(taskId);
    await this.invalidateTaskCaches(project.workspace_id);

    await invalidateCache(
      buildKey('mytasks', userId, '*'),
      ...(task.assignee_user_id && task.assignee_user_id !== userId
        ? [buildKey('mytasks', task.assignee_user_id, '*')]
        : [])
    );

    // ✅ Success log
    logger.info('Task deleted', {
      taskId,
      projectId: project.id,
      workspaceId: project.workspace_id,
      userId,
      title: task.title,
    });

    return true;
  }

  async archiveTask(taskId, userId) {
    const task = await TaskQueries.findById(taskId);
    if (!task) throw new Error('Task not found');

    const project = await ProjectQueries.findById(task.project_id);
    const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
    if (!hasAccess) throw new Error('You do not have access to this task');

    const result = await TaskQueries.archive(taskId);

    await activityService.log({
      action: 'ARCHIVED',
      userId,
      workspaceId: project.workspace_id,
      projectId: project.id,
      taskId,
    });

    try {
      emitToWorkspace(project.workspace_id, 'task:archived', {
        taskId,
        projectId: project.id,
        workspaceId: project.workspace_id,
      });
    } catch (socketError) {
      logger.warn('Failed to emit task:archived', {
        taskId,
        error: socketError.message,
      });
    }

    await this.invalidateTaskCaches(project.workspace_id);

    // ✅ Success log
    logger.info('Task archived', {
      taskId,
      projectId: project.id,
      workspaceId: project.workspace_id,
      userId,
    });

    return result;
  }

  async unarchiveTask(taskId, userId) {
    const task = await TaskQueries.findById(taskId);
    if (!task) throw new Error('Task not found');

    const project = await ProjectQueries.findById(task.project_id);
    const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
    if (!hasAccess) throw new Error('You do not have access to this task');

    const result = await TaskQueries.unarchive(taskId);

    await activityService.log({
      action: 'RESTORED',
      userId,
      workspaceId: project.workspace_id,
      projectId: project.id,
      taskId,
    });

    try {
      emitToWorkspace(project.workspace_id, 'task:unarchived', {
        taskId,
        projectId: project.id,
        workspaceId: project.workspace_id,
      });
    } catch (socketError) {
      logger.warn('Failed to emit task:unarchived', {
        taskId,
        error: socketError.message,
      });
    }

    await this.invalidateTaskCaches(project.workspace_id);

    // ✅ Success log
    logger.info('Task unarchived', {
      taskId,
      projectId: project.id,
      workspaceId: project.workspace_id,
      userId,
    });

    return result;
  }

  async duplicateTask(taskId, userId) {
    const task = await TaskQueries.findById(taskId);
    if (!task) throw new Error('Task not found');

    const project = await ProjectQueries.findById(task.project_id);
    const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
    if (!hasAccess) throw new Error('You do not have access to this task');

    const duplicated = await TaskQueries.duplicate(taskId, userId);
    const fresh = await TaskQueries.findById(duplicated.id);

    try {
      emitToWorkspace(project.workspace_id, 'task:created', {
        task: this.enrichTask(fresh),
        projectId: project.id,
        workspaceId: project.workspace_id,
        actorId: userId,
      });
    } catch (socketError) {
      logger.warn('Failed to emit task:created (duplicate)', {
        originalTaskId: taskId,
        error: socketError.message,
      });
    }

    await this.invalidateTaskCaches(project.workspace_id);

    // ✅ Success log
    logger.info('Task duplicated', {
      originalTaskId: taskId,
      newTaskId: duplicated.id,
      projectId: project.id,
      workspaceId: project.workspace_id,
      userId,
    });

    return this.enrichTask(fresh);
  }

  async getTaskStats(projectId, userId) {
    const project = await ProjectQueries.findById(projectId);
    if (!project) throw new Error('Project not found');

    const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
    if (!hasAccess) throw new Error('You do not have access to this project');

    const stats = await TaskQueries.getStatsByProject(projectId);

    return {
      total: parseInt(stats.total),
      byStatus: {
        todo: parseInt(stats.todo),
        inProgress: parseInt(stats.in_progress),
        review: parseInt(stats.review),
        done: parseInt(stats.done),
        blocked: parseInt(stats.blocked),
      },
      byPriority: {
        urgent: parseInt(stats.urgent),
        high: parseInt(stats.high),
        medium: parseInt(stats.medium),
        low: parseInt(stats.low),
      },
      overdue: parseInt(stats.overdue),
    };
  }

  async getMyTasks(userId, filters = {}) {
    const page = Math.max(1, parseInt(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit) || 20));
    const status = filters.status || 'all';
    const projectId = filters.projectId || 'all';

    const cacheKey = buildKey(
      'mytasks',
      userId,
      'status', status,
      'project', projectId,
      'page', page,
      'limit', limit
    );

    return cacheWrapper(cacheKey, 30, async () => {
      const result = await TaskQueries.getMyTasks(userId, {
        status: filters.status,
        projectId: filters.projectId,
        page,
        limit,
      });

      return {
        data: result.data.map((t) => this.enrichTask(t)),
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      };
    });
  }

  // ─── Helpers ────────────────────────────────────────
  enrichTask(task) {
    if (!task) return null;

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date,
      storyPoints: task.story_points,
      position: task.position,
      isArchived: task.is_archived,
      metadata: task.metadata,
      projectId: task.project_id,
      projectName: task.project_name,
      workspaceId: task.workspace_id,
      createdById: task.created_by_id,
      createdByName: task.created_by_name,
      createdByEmail: task.created_by_email,
      assigneeId: task.assignee_id,
      assigneeUserId: task.assignee_user_id,
      assigneeName: task.assignee_name,
      assigneeEmail: task.assignee_email,
      assigneePicture: task.assignee_picture,
      reporterId: task.reporter_id,
      reporterName: task.reporter_name,
      commentCount: parseInt(task.comment_count || 0),
      attachmentCount: parseInt(task.attachment_count || 0),
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      completedAt: task.completed_at,
    };
  }

  async checkWorkspaceAccess(workspaceId, userId) {
    const access = await WorkspaceQueries.getWorkspaceAccess(workspaceId, userId);
    return access.isOwner || access.isMember;
  }

  async invalidateTaskCaches(workspaceId) {
    await invalidateCache(buildKey('dashboard', '*', workspaceId));
  }

  async checkProjectAccess(project, userId) {
    return this.checkWorkspaceAccess(project.workspace_id, userId);
  }

  async getWorkspaceMember(workspaceId, userId) {
    return WorkspaceQueries.findMemberByUser(workspaceId, userId);
  }

  async getWorkspaceRole(workspaceId, userId) {
    const access = await WorkspaceQueries.getWorkspaceAccess(workspaceId, userId);
    if (access.isOwner) return 'OWNER';
    return access.role;
  }
}

module.exports = TaskService;
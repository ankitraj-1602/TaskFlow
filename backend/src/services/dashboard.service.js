// const DashboardQueries = require('../db/queries/dashboard.queries');
// const WorkspaceQueries = require('../db/queries/workspace.queries');

// class DashboardService {
//   async getWorkspaceStats(workspaceId, userId) {
//     await this.checkAccess(workspaceId, userId);

//     const stats = await DashboardQueries.getWorkspaceStats(workspaceId);
//     const recentActivityCount = await DashboardQueries.getRecentActivityCount(
//       workspaceId,
//       24
//     );

//     const total = parseInt(stats.total_tasks);
//     const completed = parseInt(stats.completed_tasks);

//     return {
//       overview: {
//         totalProjects: parseInt(stats.total_projects),
//         totalMembers: parseInt(stats.total_members),
//         totalTasks: total,
//         completedTasks: completed,
//         inProgressTasks: parseInt(stats.in_progress_tasks),
//         todoTasks: parseInt(stats.todo_tasks),
//         reviewTasks: parseInt(stats.review_tasks),
//         blockedTasks: parseInt(stats.blocked_tasks),
//         overdueTasks: parseInt(stats.overdue_tasks),
//         completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
//         recentActivityCount,
//       },
//       byPriority: {
//         urgent: parseInt(stats.urgent_tasks),
//         high: parseInt(stats.high_tasks),
//         medium: parseInt(stats.medium_tasks),
//         low: parseInt(stats.low_tasks),
//       },
//       byStatus: {
//         todo: parseInt(stats.todo_tasks),
//         inProgress: parseInt(stats.in_progress_tasks),
//         review: parseInt(stats.review_tasks),
//         done: completed,
//         blocked: parseInt(stats.blocked_tasks),
//       },
//     };
//   }

//   async getTaskTrends(workspaceId, userId, days = 30) {
//     await this.checkAccess(workspaceId, userId);

//     const rows = await DashboardQueries.getTaskTrends(workspaceId, days);

//     return rows.map((row) => ({
//       date: row.date,
//       created: parseInt(row.created),
//       completed: parseInt(row.completed),
//     }));
//   }

//   async getTeamProductivity(workspaceId, userId) {
//     await this.checkAccess(workspaceId, userId);

//     const rows = await DashboardQueries.getTeamProductivity(workspaceId);

//     return rows.map((row) => ({
//       userId: row.user_id,
//       name: row.name,
//       email: row.email,
//       profilePicture: row.profile_picture,
//       role: row.role,
//       completedTasks: parseInt(row.completed_tasks),
//       inProgressTasks: parseInt(row.in_progress_tasks),
//       overdueTasks: parseInt(row.overdue_tasks),
//       totalAssignedTasks: parseInt(row.total_assigned_tasks),
//     }));
//   }

//   async getProjectProgress(workspaceId, userId) {
//     await this.checkAccess(workspaceId, userId);

//     const rows = await DashboardQueries.getProjectProgress(workspaceId);

//     return rows.map((row) => ({
//       id: row.id,
//       name: row.name,
//       status: row.status,
//       dueDate: row.due_date,
//       totalTasks: parseInt(row.total_tasks),
//       completedTasks: parseInt(row.completed_tasks),
//       overdueTasks: parseInt(row.overdue_tasks),
//       completionPercentage: parseInt(row.completion_percentage),
//     }));
//   }

//   async getOverdueBreakdown(workspaceId, userId) {
//     await this.checkAccess(workspaceId, userId);

//     const rows = await DashboardQueries.getOverdueBreakdown(workspaceId);

//     return rows.map((row) => ({
//       userId: row.user_id,
//       name: row.name,
//       email: row.email,
//       profilePicture: row.profile_picture,
//       overdueCount: parseInt(row.overdue_count),
//       oldestOverdue: row.oldest_overdue,
//     }));
//   }

//   // ─── Helpers ────────────────────────────────────────
//   async checkAccess(workspaceId, userId) {
//     const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
//     if (isOwner) return true;
//     const isMember = await WorkspaceQueries.isMember(workspaceId, userId);
//     if (!isMember) {
//       throw new Error('You do not have access to this workspace');
//     }
//     return true;
//   }
// }

// module.exports = DashboardService;


const DashboardQueries = require('../db/queries/dashboard.queries');
const WorkspaceQueries = require('../db/queries/workspace.queries');
const { cacheWrapper, buildKey } = require('../utils/cache.utils');

class DashboardService {
  async getWorkspaceStats(workspaceId, userId) {
    await this.checkAccess(workspaceId, userId);

    const cacheKey = buildKey('dashboard', 'stats', workspaceId);

    // Cache for 60 seconds
    return cacheWrapper(cacheKey, 60, async () => {
      const stats = await DashboardQueries.getWorkspaceStats(workspaceId);
      const recentActivityCount = await DashboardQueries.getRecentActivityCount(
        workspaceId,
        24
      );

      const total = parseInt(stats.total_tasks);
      const completed = parseInt(stats.completed_tasks);

      return {
        overview: {
          totalProjects: parseInt(stats.total_projects),
          totalMembers: parseInt(stats.total_members),
          totalTasks: total,
          completedTasks: completed,
          inProgressTasks: parseInt(stats.in_progress_tasks),
          todoTasks: parseInt(stats.todo_tasks),
          reviewTasks: parseInt(stats.review_tasks),
          blockedTasks: parseInt(stats.blocked_tasks),
          overdueTasks: parseInt(stats.overdue_tasks),
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          recentActivityCount,
        },
        byPriority: {
          urgent: parseInt(stats.urgent_tasks),
          high: parseInt(stats.high_tasks),
          medium: parseInt(stats.medium_tasks),
          low: parseInt(stats.low_tasks),
        },
        byStatus: {
          todo: parseInt(stats.todo_tasks),
          inProgress: parseInt(stats.in_progress_tasks),
          review: parseInt(stats.review_tasks),
          done: completed,
          blocked: parseInt(stats.blocked_tasks),
        },
      };
    });
  }

  async getTaskTrends(workspaceId, userId, days = 30) {
    await this.checkAccess(workspaceId, userId);

    const cacheKey = buildKey('dashboard', 'trends', workspaceId, days);

    // Cache for 2 minutes (trends change slowly)
    return cacheWrapper(cacheKey, 120, async () => {
      const rows = await DashboardQueries.getTaskTrends(workspaceId, days);
      return rows.map((row) => ({
        date: row.date,
        created: parseInt(row.created),
        completed: parseInt(row.completed),
      }));
    });
  }

  async getTeamProductivity(workspaceId, userId) {
    await this.checkAccess(workspaceId, userId);

    const cacheKey = buildKey('dashboard', 'team', workspaceId);

    return cacheWrapper(cacheKey, 60, async () => {
      const rows = await DashboardQueries.getTeamProductivity(workspaceId);
      return rows.map((row) => ({
        userId: row.user_id,
        name: row.name,
        email: row.email,
        profilePicture: row.profile_picture,
        role: row.role,
        completedTasks: parseInt(row.completed_tasks),
        inProgressTasks: parseInt(row.in_progress_tasks),
        overdueTasks: parseInt(row.overdue_tasks),
        totalAssignedTasks: parseInt(row.total_assigned_tasks),
      }));
    });
  }

  async getProjectProgress(workspaceId, userId) {
    await this.checkAccess(workspaceId, userId);

    const cacheKey = buildKey('dashboard', 'projects', workspaceId);

    return cacheWrapper(cacheKey, 60, async () => {
      const rows = await DashboardQueries.getProjectProgress(workspaceId);
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        status: row.status,
        dueDate: row.due_date,
        totalTasks: parseInt(row.total_tasks),
        completedTasks: parseInt(row.completed_tasks),
        overdueTasks: parseInt(row.overdue_tasks),
        completionPercentage: parseInt(row.completion_percentage),
      }));
    });
  }

  async getOverdueBreakdown(workspaceId, userId) {
    await this.checkAccess(workspaceId, userId);

    const cacheKey = buildKey('dashboard', 'overdue', workspaceId);

    return cacheWrapper(cacheKey, 60, async () => {
      const rows = await DashboardQueries.getOverdueBreakdown(workspaceId);
      return rows.map((row) => ({
        userId: row.user_id,
        name: row.name,
        email: row.email,
        profilePicture: row.profile_picture,
        overdueCount: parseInt(row.overdue_count),
        oldestOverdue: row.oldest_overdue,
      }));
    });
  }

  async checkAccess(workspaceId, userId) {
  const access = await WorkspaceQueries.getWorkspaceAccess(workspaceId, userId);
  if (!access.isOwner && !access.isMember) {
    throw new Error('You do not have access to this workspace');
  }
  return true;
}
}

module.exports = DashboardService;
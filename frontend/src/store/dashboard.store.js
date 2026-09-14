import { create } from 'zustand';
import { dashboardApi } from '../api/dashboard.api';

export const useDashboardStore = create((set, get) => ({
  stats: null,
  trends: [],
  team: [],
  projects: [],
  overdue: [],
  selectedWorkspaceId: null,
  trendsRange: 30,
  isLoading: false,

  loadDashboard: async (workspaceId) => {
    set({ isLoading: true, selectedWorkspaceId: workspaceId });
    try {
      // Fire all requests in parallel
      const [stats, trends, team, projects, overdue] = await Promise.all([
        dashboardApi.getStats(workspaceId),
        dashboardApi.getTrends(workspaceId, get().trendsRange),
        dashboardApi.getTeamProductivity(workspaceId),
        dashboardApi.getProjectProgress(workspaceId),
        dashboardApi.getOverdueBreakdown(workspaceId),
      ]);

      set({
        stats,
        trends,
        team,
        projects,
        overdue,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  changeTrendsRange: async (days) => {
    const workspaceId = get().selectedWorkspaceId;
    if (!workspaceId) return;

    set({ trendsRange: days });
    try {
      const trends = await dashboardApi.getTrends(workspaceId, days);
      set({ trends });
    } catch (error) {
      throw error;
    }
  },

  clear: () => {
    set({
      stats: null,
      trends: [],
      team: [],
      projects: [],
      overdue: [],
      selectedWorkspaceId: null,
    });
  },
}));
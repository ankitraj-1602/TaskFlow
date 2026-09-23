import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ProtectedLayout } from '../components/Layout/ProtectedLayout';
import { EmailVerificationBanner } from '../components/UI/EmailVerificationBanner';
import { OverviewCards } from '../components/Dashboard/OverviewCards';
import { TrendChart } from '../components/Dashboard/TrendChart';
import { PriorityChart } from '../components/Dashboard/PriorityChart';
import { StatusChart } from '../components/Dashboard/StatusChart';
import { TeamProductivity } from '../components/Dashboard/TeamProductivity';
import { ProjectProgressList } from '../components/Dashboard/ProjectProgressList';
import { OverdueList } from '../components/Dashboard/OverdueList';
import { useAuthStore } from '../store/auth.store';
import { useWorkspaceStore } from '../store/workspace.store';
import { useDashboardStore } from '../store/dashboard.store';
import {
  ChartBarIcon,
  UsersIcon,
  FolderIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export const Dashboard = () => {
  const { user } = useAuthStore();
  const { workspaces, loadWorkspaces } = useWorkspaceStore();
  const {
    stats,
    trends,
    team,
    projects,
    overdue,
    trendsRange,
    isLoading,
    loadDashboard,
    changeTrendsRange,
  } = useDashboardStore();

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);

  // Load workspaces only when user is authenticated
  useEffect(() => {
    if (!user) return;
    if (workspaces.length > 0) {
      if (!selectedWorkspaceId) setSelectedWorkspaceId(workspaces[0].id);
      return;
    }

    loadWorkspaces()
      .then((list) => {
        if (list.length > 0 && !selectedWorkspaceId) {
          setSelectedWorkspaceId(list[0].id);
        }
      })
      .catch((error) => {
        if (error.response?.status !== 401) {
          toast.error('Failed to load workspaces');
        }
      });
  }, [user, workspaces.length, selectedWorkspaceId]);

  // Load dashboard when workspace changes
  useEffect(() => {
    if (!selectedWorkspaceId) return;

    loadDashboard(selectedWorkspaceId).catch((error) => {
      if (error.response?.status !== 401) {
        toast.error('Failed to load dashboard');
      }
    });
  }, [selectedWorkspaceId]);

  const handleRangeChange = async (days) => {
    try {
      await changeTrendsRange(days);
    } catch (error) {
      toast.error('Failed to load trends');
    }
  };

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <EmailVerificationBanner />

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name}!
            </h2>
            <p className="text-gray-600 mt-1">
              {stats?.overview?.recentActivityCount > 0
                ? `${stats.overview.recentActivityCount} activities in the last 24h`
                : "Here's what's happening in your workspace"}
            </p>
          </div>

          {/* Workspace Selector */}
          {workspaces.length > 0 && (
            <select
              value={selectedWorkspaceId || ''}
              onChange={(e) => setSelectedWorkspaceId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Empty state */}
        {workspaces.length === 0 && !isLoading && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FolderIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              No workspaces yet
            </h3>
            <p className="text-gray-500 mt-1">
              Create a workspace to see your dashboard
            </p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && !stats && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* Dashboard content */}
        {stats && (
          <>
            {/* Overview Cards */}
            <OverviewCards stats={stats} />

            {/* Trend + Priority */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ChartBarIcon className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Task Trends
                  </h3>
                </div>
                <TrendChart
                  data={trends}
                  range={trendsRange}
                  onRangeChange={handleRangeChange}
                />
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  By Priority
                </h3>
                <PriorityChart data={stats.byPriority} />
              </div>
            </div>

            {/* Status + Team */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  By Status
                </h3>
                <StatusChart data={stats.byStatus} />
              </div>

              <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <UsersIcon className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Team Productivity
                  </h3>
                </div>
                <TeamProductivity data={team} />
              </div>
            </div>

            {/* Projects + Overdue */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Project Progress
                </h3>
                <ProjectProgressList
                  data={projects}
                  workspaceId={selectedWorkspaceId}
                />
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Overdue Tasks
                  </h3>
                </div>
                <OverdueList data={overdue} />
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedLayout>
  );
};
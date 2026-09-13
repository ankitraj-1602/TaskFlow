import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ActivityItem } from './ActivityItem';
import { EmptyState } from '../UI/EmptyState';
import { useActivityStore } from '../../store/activity.store';
import {
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

/**
 * ActivityFeed
 * scope: 'task' | 'project' | 'workspace'
 * id: the task/project/workspace id
 */
export const ActivityFeed = ({
  scope,
  id,
  limit,
  showRefresh = false,
  compact = false,
  emptyMessage = 'No activity yet',
}) => {
  const {
    taskActivities,
    projectActivities,
    workspaceActivities,
    isLoading,
    loadTaskActivities,
    loadProjectActivities,
    loadWorkspaceActivities,
  } = useActivityStore();

  const [refreshing, setRefreshing] = useState(false);

  const getActivities = () => {
    if (scope === 'task') return taskActivities[id] || [];
    if (scope === 'project') return projectActivities[id] || [];
    if (scope === 'workspace') return workspaceActivities[id] || [];
    return [];
  };

  const load = (force = false) => {
    if (scope === 'task') return loadTaskActivities(id, force);
    if (scope === 'project')
      return loadProjectActivities(id, { limit: limit || 30 });
    if (scope === 'workspace')
      return loadWorkspaceActivities(id, { limit: limit || 10 });
    return Promise.resolve([]);
  };

  useEffect(() => {
    load().catch(() => {
      toast.error('Failed to load activity');
    });
  }, [scope, id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await load(true);
    } catch (error) {
      toast.error('Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const activities = getActivities();

  if (isLoading && activities.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-indigo-600"></div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-10">
        <ClockIcon className="h-7 w-7 mx-auto mb-2 text-gray-300" />
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {showRefresh && (
        <div className="flex justify-end mb-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-xs text-gray-500 hover:text-indigo-600 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors"
          >
            <ArrowPathIcon
              className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>
      )}
      <div className="divide-y divide-gray-100">
        {activities.map((activity) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
};
import React from 'react';
import {
  FolderIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { StatCard } from './StatCard';

export const OverviewCards = ({ stats }) => {
  if (!stats?.overview) return null;

  const { overview } = stats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        label="Projects"
        value={overview.totalProjects}
        icon={FolderIcon}
        color="bg-blue-500"
      />
      <StatCard
        label="Total Tasks"
        value={overview.totalTasks}
        icon={ClipboardDocumentListIcon}
        color="bg-indigo-500"
      />
      <StatCard
        label="Completed"
        value={overview.completedTasks}
        icon={CheckCircleIcon}
        color="bg-green-500"
        subtitle={`${overview.completionRate}% complete`}
      />
      <StatCard
        label="Overdue"
        value={overview.overdueTasks}
        icon={ExclamationTriangleIcon}
        color="bg-red-500"
      />
      <StatCard
        label="Members"
        value={overview.totalMembers}
        icon={UsersIcon}
        color="bg-purple-500"
      />
    </div>
  );
};
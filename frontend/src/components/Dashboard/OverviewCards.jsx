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
        tone="blue"
      />
      <StatCard
        label="Total Tasks"
        value={overview.totalTasks}
        icon={ClipboardDocumentListIcon}
        tone="indigo"
      />
      <StatCard
        label="Completed"
        value={overview.completedTasks}
        icon={CheckCircleIcon}
        tone="green"
        subtitle={`${overview.completionRate}% complete`}
      />
      <StatCard
        label="Overdue"
        value={overview.overdueTasks}
        icon={ExclamationTriangleIcon}
        tone="red"
      />
      <StatCard
        label="Members"
        value={overview.totalMembers}
        icon={UsersIcon}
        tone="purple"
      />
    </div>
  );
};
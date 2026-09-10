import React from 'react';
import { Badge } from './Badge';

const statusConfig = {
  PLANNING: { label: 'Planning', variant: 'info' },
  ACTIVE: { label: 'Active', variant: 'success' },
  ON_HOLD: { label: 'On Hold', variant: 'warning' },
  COMPLETED: { label: 'Completed', variant: 'purple' },
  ARCHIVED: { label: 'Archived', variant: 'default' },
  TODO: { label: 'To Do', variant: 'default' },
  IN_PROGRESS: { label: 'In Progress', variant: 'info' },
  REVIEW: { label: 'Review', variant: 'warning' },
  DONE: { label: 'Done', variant: 'success' },
  BLOCKED: { label: 'Blocked', variant: 'danger' },
};

export const StatusBadge = ({ status, size = 'md' }) => {
  const config = statusConfig[status] || { label: status, variant: 'default' };
  return (
    <Badge variant={config.variant} size={size}>
      {config.label}
    </Badge>
  );
};
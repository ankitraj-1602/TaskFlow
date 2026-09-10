import React from 'react';
import { Badge } from './Badge';

const priorityConfig = {
  LOW: { label: 'Low', variant: 'info' },
  MEDIUM: { label: 'Medium', variant: 'warning' },
  HIGH: { label: 'High', variant: 'danger' },
  URGENT: { label: 'Urgent', variant: 'danger' },
};

export const PriorityBadge = ({ priority, size = 'md' }) => {
  const config = priorityConfig[priority] || { label: priority, variant: 'default' };
  return (
    <Badge variant={config.variant} size={size}>
      {config.label}
    </Badge>
  );
};
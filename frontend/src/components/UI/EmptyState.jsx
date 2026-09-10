import React from 'react';
import { Button } from '../Forms/Button';

export const EmptyState = ({ 
  icon = '📋', 
  title, 
  description, 
  actionLabel, 
  onAction 
}) => {
  return (
    <div className="text-center py-12 bg-white rounded-lg shadow">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="text-gray-600 mt-1">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
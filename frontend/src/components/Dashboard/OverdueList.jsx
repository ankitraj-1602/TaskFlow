import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export const OverdueList = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-green-600 text-sm">
        <span className="text-2xl mb-2 block">✨</span>
        No overdue tasks. Great job!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div
          key={item.userId}
          className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg"
        >
          <div className="flex items-center gap-3">
            {item.profilePicture ? (
              <img
                src={item.profilePicture}
                alt={item.name}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">{item.name}</p>
              <p className="text-xs text-gray-500">
                Oldest: {formatDistanceToNow(new Date(item.oldestOverdue), { addSuffix: true })}
              </p>
            </div>
          </div>
          <span className="text-lg font-bold text-red-600">
            {item.overdueCount}
          </span>
        </div>
      ))}
    </div>
  );
};
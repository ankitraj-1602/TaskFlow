import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { activityIcon } from './activityIcons';

export const ActivityItem = ({ activity, compact = false }) => {
  const { Icon, color, bg } = activityIcon(activity.action);

  const timestamp = activity.createdAt
    ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })
    : '';

  const initials = activity.userName?.charAt(0).toUpperCase() || 'U';

  return (
    <div className={`flex gap-3 ${compact ? 'py-2' : 'py-3'}`}>
      {/* User Avatar (if not compact) */}
      {!compact && (
        <>
          {activity.userPicture ? (
            <img
              src={activity.userPicture}
              alt={activity.userName}
              className="h-8 w-8 rounded-full flex-shrink-0 mt-0.5"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-indigo-600 text-xs font-semibold">
                {initials}
              </span>
            </div>
          )}
        </>
      )}

      {/* Compact: action icon instead of avatar */}
      {compact && (
        <div className={`h-8 w-8 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          {!compact && (
            <div className={`h-6 w-6 rounded ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
              <Icon className={`h-3.5 w-3.5 ${color}`} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700">
              {activity.description || (
                <>
                  <span className="font-medium text-gray-900">
                    {activity.userName}
                  </span>{' '}
                  performed <span className="font-medium">{activity.action}</span>
                </>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{timestamp}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
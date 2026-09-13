import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  UserPlusIcon,
  ChatBubbleLeftIcon,
  AtSymbolIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const typeConfig = {
  TASK_ASSIGNED: {
    Icon: UserPlusIcon,
    color: 'text-indigo-600',
    bg: 'bg-indigo-100',
  },
  TASK_MENTIONED: {
    Icon: AtSymbolIcon,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
  },
  COMMENT_ADDED: {
    Icon: ChatBubbleLeftIcon,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  TASK_STATUS_CHANGED: {
    Icon: ArrowPathIcon,
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
  },
  TASK_COMPLETED: {
    Icon: CheckCircleIcon,
    color: 'text-green-600',
    bg: 'bg-green-100',
  },
  WORKSPACE_INVITATION: {
    Icon: EnvelopeIcon,
    color: 'text-indigo-600',
    bg: 'bg-indigo-100',
  },
};

export const NotificationItem = ({ notification, onRead, onDelete }) => {
  const navigate = useNavigate();
  const config = typeConfig[notification.type] || {
    Icon: ChatBubbleLeftIcon,
    color: 'text-gray-600',
    bg: 'bg-gray-100',
  };

  const { Icon, color, bg } = config;

  const handleClick = async () => {
    // Mark as read
    if (!notification.isRead) {
      await onRead(notification.id);
    }

    // Navigate to relevant task
    const taskId = notification.data?.taskId;
    const projectId = notification.data?.projectId;
    const workspaceId = notification.data?.workspaceId;

    if (taskId && projectId && workspaceId) {
      // Navigate to task page (future: deep link to the task itself)
      navigate(
        `/workspaces/${workspaceId}/projects/${projectId}/tasks?taskId=${taskId}`
      );
    } else if (workspaceId) {
      navigate(`/workspaces/${workspaceId}`);
    } else {
      navigate('/dashboard');
    }
  };

  const timestamp = notification.createdAt
    ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
    : '';

  return (
    <div
      className={`group flex gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
        !notification.isRead ? 'bg-indigo-50/50' : ''
      }`}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className={`h-9 w-9 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''} text-gray-900`}>
          {notification.content}
        </p>
        {notification.actorName && (
          <p className="text-xs text-gray-500 mt-0.5">
            by {notification.actorName}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">{timestamp}</p>
      </div>

      {/* Unread dot */}
      {!notification.isRead && (
        <div className="h-2 w-2 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
      )}

      {/* Delete button (hover) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity flex-shrink-0 p-1"
        title="Delete"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
};
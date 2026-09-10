import React from 'react';
import { StatusBadge } from '../UI/StatusBadge';
import { PriorityBadge } from '../UI/PriorityBadge';
import {
  CalendarIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

export const TaskCard = ({ task, onClick, isDragging }) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-all ${
        isDragging ? 'opacity-50 rotate-2' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
          {task.title}
        </h4>
        <PriorityBadge priority={task.priority} size="sm" />
      </div>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          {task.dueDate && (
            <div className={`flex items-center ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {task.commentCount > 0 && (
            <div className="flex items-center">
              <ChatBubbleLeftIcon className="h-3.5 w-3.5 mr-0.5" />
              <span>{task.commentCount}</span>
            </div>
          )}
          {task.attachmentCount > 0 && (
            <div className="flex items-center">
              <PaperClipIcon className="h-3.5 w-3.5 mr-0.5" />
              <span>{task.attachmentCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Assignee */}
      {task.assigneeName && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center">
          {task.assigneePicture ? (
            <img
              src={task.assigneePicture}
              alt={task.assigneeName}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-600 text-xs font-medium">
                {task.assigneeName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="ml-2 text-xs text-gray-600 truncate">
            {task.assigneeName}
          </span>
        </div>
      )}
    </div>
  );
};
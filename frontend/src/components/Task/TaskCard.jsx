import React from 'react';
import { StatusBadge } from '../UI/StatusBadge';
import { PriorityBadge } from '../UI/PriorityBadge';
import {
  CalendarIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { LabelBadge } from '../Label/LabelBadge';

export const TaskCard = ({ task, onClick, isDragging }) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:shadow-md hover:border-gray-200 transition-all ${
        isDragging ? 'opacity-50 rotate-2' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
          {task.title}
        </h4>
        <PriorityBadge priority={task.priority} size="sm" />
      </div>
      {task.labels && task.labels.length > 0 && (
  <div className="flex flex-wrap gap-1 mt-1.5">
    {task.labels.slice(0, 3).map((label) => (
      <LabelBadge key={label.id} label={label} size="xs" />
    ))}
    {task.labels.length > 3 && (
      <span className="text-[10px] text-gray-500 self-center">
        +{task.labels.length - 3}
      </span>
    )}
  </div>
)}

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <div className={`flex items-center ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2.5">
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
              className="h-6 w-6 rounded-full object-cover ring-1 ring-gray-100"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-indigo-50 flex items-center justify-center ring-1 ring-indigo-100">
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
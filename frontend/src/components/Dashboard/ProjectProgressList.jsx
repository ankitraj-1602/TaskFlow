import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../UI/StatusBadge';

export const ProjectProgressList = ({ data, workspaceId }) => {
  const navigate = useNavigate();

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No projects yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((project) => (
        <div
          key={project.id}
          onClick={() =>
            navigate(
              `/workspaces/${workspaceId}/projects/${project.id}`
            )
          }
          className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-gray-900">
                {project.name}
              </h4>
              <StatusBadge status={project.status} size="sm" />
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {project.completionPercentage}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                project.completionPercentage >= 80
                  ? 'bg-green-500'
                  : project.completionPercentage >= 50
                  ? 'bg-blue-500'
                  : 'bg-yellow-500'
              }`}
              style={{ width: `${project.completionPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>
              {project.completedTasks} of {project.totalTasks} tasks done
            </span>
            {project.overdueTasks > 0 && (
              <span className="text-red-600 font-medium">
                {project.overdueTasks} overdue
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
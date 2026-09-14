import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ProtectedLayout } from '../components/Layout/ProtectedLayout';
import { EmptyState } from '../components/UI/EmptyState';
import { StatusBadge } from '../components/UI/StatusBadge';
import { projectApi } from '../api/project.api';
import {
  FolderIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  UserGroupIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

export const ProjectsList = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await projectApi.getAllMyProjects();
        setProjects(data);
      } catch (error) {
        toast.error('Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Group by workspace
  const grouped = projects.reduce((acc, p) => {
    const key = p.workspaceId;
    if (!acc[key]) {
      acc[key] = {
        workspaceId: p.workspaceId,
        workspaceName: p.workspaceName,
        projects: [],
      };
    }
    acc[key].projects.push(p);
    return acc;
  }, {});

  const groups = Object.values(grouped).filter((g) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.workspaceName.toLowerCase().includes(q) ||
      g.projects.some(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      )
    );
  });

  return (
    <ProtectedLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
            <p className="text-gray-600 mt-1">
              All projects across your workspaces
            </p>
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : groups.length === 0 ? (
          <EmptyState
            icon="📁"
            title={searchQuery ? 'No projects found' : 'No projects yet'}
            description={
              searchQuery
                ? 'Try a different search'
                : 'Create a project inside a workspace to see it here'
            }
          />
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <div key={group.workspaceId}>
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() =>
                      navigate(`/workspaces/${group.workspaceId}`)
                    }
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    {group.workspaceName}
                  </button>
                  <span className="text-xs text-gray-500">
                    ({group.projects.length} projects)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.projects.map((project) => {
                    const completion =
                      project.taskCount > 0
                        ? Math.round(
                            (project.completedTaskCount / project.taskCount) *
                              100
                          )
                        : 0;

                    return (
                      <div
                        key={project.id}
                        onClick={() =>
                          navigate(
                            `/workspaces/${project.workspaceId}/projects/${project.id}`
                          )
                        }
                        className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-5 cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1">
                            {project.name}
                          </h3>
                          <StatusBadge status={project.status} size="sm" />
                        </div>

                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                          {project.description || 'No description'}
                        </p>

                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full"
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                          {completion}% complete
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                          <div className="flex items-center">
                            <ClipboardDocumentListIcon className="h-3.5 w-3.5 mr-1" />
                            {project.taskCount} tasks
                          </div>
                          <div className="flex items-center">
                            <UserGroupIcon className="h-3.5 w-3.5 mr-1" />
                            {project.memberCount} members
                          </div>
                          {project.dueDate && (
                            <div className="flex items-center col-span-2">
                              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                              Due{' '}
                              {new Date(
                                project.dueDate
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
};
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ProtectedLayout } from '../components/Layout/ProtectedLayout';
import { Input } from '../components/Forms/Input';
import { Button } from '../components/Forms/Button';
import { Modal } from '../components/UI/Modal';
import { StatusBadge } from '../components/UI/StatusBadge';
import { EmptyState } from '../components/UI/EmptyState';
import { useProjectStore } from '../store/project.store';
import { useWorkspaceStore } from '../store/workspace.store';
import { usePermission } from '../hooks/usePermission';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  CalendarIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ArrowLeftIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

const createProjectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(1000).optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED']).default('PLANNING'),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
});

export const Projects = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const {
    projects,
    loadWorkspaceProjects,
    createProject,
    isLoading,
  } = useProjectStore();
  const { workspaces } = useWorkspaceStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const workspace = workspaces.find((w) => w.id === workspaceId);

  // ─── RBAC ──────────────────────────────────────────────
  const workspaceRole =
    workspace?.owner_role === 'OWNER'
      ? 'OWNER'
      : workspace?.member_role || workspace?.userRole || 'VIEWER';

  const { isManager } = usePermission(workspaceRole);
  // isManager = OWNER | ADMIN | MANAGER (can create projects)
  // ───────────────────────────────────────────────────────

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      status: 'PLANNING',
    },
  });

  useEffect(() => {
    loadWorkspaceProjects(workspaceId, { isArchived: showArchived });
  }, [workspaceId, showArchived]);

  const onSubmit = async (data) => {
    try {
      const project = await createProject(workspaceId, data);
      toast.success('Project created successfully!');
      setShowCreateModal(false);
      reset();
      navigate(`/workspaces/${workspaceId}/projects/${project.id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      !searchQuery ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => navigate(`/workspaces/${workspaceId}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {workspace?.name} - Projects
            </h2>
            <p className="text-gray-600 mt-1">Manage your projects</p>
          </div>

          {/* ⬇️ RBAC: Only MANAGER+ sees the button */}
          {isManager && (
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-5 w-5 mr-2" />
              New Project
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-2"
                />
                Show archived
              </label>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading && projects.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            icon="📁"
            title={
              searchQuery || statusFilter ? 'No projects found' : 'No projects yet'
            }
            description={
              searchQuery || statusFilter
                ? 'Try adjusting your filters'
                : isManager
                ? 'Create your first project to get started'
                : 'No projects have been created yet'
            }
            actionLabel={
              !searchQuery && !statusFilter && isManager
                ? 'Create Project'
                : undefined
            }
            onAction={
              !searchQuery && !statusFilter && isManager
                ? () => setShowCreateModal(true)
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() =>
                  navigate(`/workspaces/${workspaceId}/projects/${project.id}`)
                }
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                    {project.name}
                  </h3>
                  <StatusBadge status={project.status} />
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {project.description || 'No description'}
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center text-gray-500">
                    <ClipboardDocumentListIcon className="h-4 w-4 mr-1" />
                    <span>{project.task_count || 0} tasks</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <UserGroupIcon className="h-4 w-4 mr-1" />
                    <span>{project.member_count || 0} members</span>
                  </div>
                  {project.due_date && (
                    <div className="flex items-center text-gray-500 col-span-2">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <span>
                        Due {new Date(project.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Project Modal — RBAC: only rendered for MANAGER+ */}
        {isManager && (
          <Modal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false);
              reset();
            }}
            title="Create New Project"
            size="lg"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Project Name"
                type="text"
                fullWidth
                placeholder="Website Redesign"
                error={errors.name?.message}
                {...register('name')}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your project..."
                  className={`w-full px-3 py-2 border ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  {...register('description')}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register('status')}
                >
                  <option value="PLANNING">Planning</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  fullWidth
                  error={errors.startDate?.message}
                  {...register('startDate')}
                />
                <Input
                  label="Due Date"
                  type="date"
                  fullWidth
                  error={errors.dueDate?.message}
                  {...register('dueDate')}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={isLoading}>
                  Create Project
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </ProtectedLayout>
  );
};
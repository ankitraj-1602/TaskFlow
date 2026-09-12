import React, { useEffect, useState } from 'react';
import { Button } from '../Forms/Button';
import { ProjectMemberRow } from './ProjectMemberRow';
import { AddProjectMemberModal } from './AddProjectMemberModal';
import { useProjectStore } from '../../store/project.store';
import { useAuthStore } from '../../store/auth.store';
import { usePermission } from '../../hooks/usePermission';
import { UserPlusIcon } from '@heroicons/react/24/outline';

export const ProjectMembersTab = ({ projectId, workspaceRole }) => {
  const { user } = useAuthStore();
  const {
    projectMembers,
    currentProject,
    loadProjectMembers,
    isLoadingMembers,        // ⬅️ Changed
  } = useProjectStore();
  const { isManager } = usePermission(workspaceRole);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadProjectMembers(projectId);
  }, [projectId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Project Members ({projectMembers.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Team members with access to this project
          </p>
        </div>
        {isManager && (
          <Button onClick={() => setShowAddModal(true)}>
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Add Member
          </Button>
        )}
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoadingMembers && projectMembers.length === 0 ? (        // ⬅️ Changed
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : projectMembers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No project members yet</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projectMembers.map((member) => (
                <ProjectMemberRow
                  key={member.id}
                  member={member}
                  projectId={projectId}
                  currentUserId={user?.id}
                  workspaceRole={workspaceRole}
                  isProjectCreator={currentProject?.created_by_id}
                  isProjectOwner={currentProject?.owner_id}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddProjectMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        projectId={projectId}
      />
    </div>
  );
};
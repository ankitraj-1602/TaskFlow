import React, { useEffect, useState } from 'react';
import { Button } from '../Forms/Button';
import { ProjectMemberRow } from './ProjectMemberRow';
import { AddProjectMemberModal } from './AddProjectMemberModal';
import { useProjectStore } from '../../store/project.store';
import { useAuthStore } from '../../store/auth.store';
import { usePermission } from '../../hooks/usePermission';
import { UserPlusIcon, UsersIcon } from '@heroicons/react/24/outline';

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
            Project Members <span className="text-gray-400 font-normal">({projectMembers.length})</span>
          </h3>
          <p className="text-sm text-gray-500 mt-1">
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoadingMembers && projectMembers.length === 0 ? (        // ⬅️ Changed
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-indigo-600"></div>
          </div>
        ) : projectMembers.length === 0 ? (
          <div className="text-center py-16">
            <UsersIcon className="h-8 w-8 text-gray-300 mx-auto" />
            <p className="text-gray-500 text-sm mt-3">No project members yet</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wide">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wide">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wide">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
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
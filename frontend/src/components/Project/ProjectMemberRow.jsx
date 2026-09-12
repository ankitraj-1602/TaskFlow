import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Badge } from '../UI/Badge';
import { Button } from '../Forms/Button';
import { useProjectStore } from '../../store/project.store';
import { usePermission } from '../../hooks/usePermission';
import { TrashIcon } from '@heroicons/react/24/outline';

const roleVariant = {
  OWNER: 'purple',
  ADMIN: 'danger',
  MANAGER: 'warning',
  MEMBER: 'info',
  VIEWER: 'default',
};

export const ProjectMemberRow = ({
  member,
  projectId,
  currentUserId,
  workspaceRole,
  isProjectCreator,
  isProjectOwner,
}) => {
  const { removeProjectMember, isLoadingMembers } = useProjectStore();  // ⬅️ Changed
  const { isManager } = usePermission(workspaceRole);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const isCurrentUser = member.user_id === currentUserId;

  // Can remove if: manager+ AND not self
  const canRemove = isManager && !isCurrentUser;

  const handleRemove = async () => {
    try {
      await removeProjectMember(projectId, member.id);
      toast.success('Member removed from project');
      setShowRemoveConfirm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove');
    }
  };

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4">
          <div className="flex items-center">
            {member.profile_picture ? (
              <img
                src={member.profile_picture}
                alt={member.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 font-medium">
                  {member.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {member.name}
                {isCurrentUser && (
                  <span className="ml-2 text-xs text-gray-500">(You)</span>
                )}
              </p>
              <p className="text-sm text-gray-500">{member.email}</p>
            </div>
          </div>
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <Badge variant={roleVariant[member.role] || 'default'}>
            {member.role}
          </Badge>
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {member.joined_at
            ? new Date(member.joined_at).toLocaleDateString()
            : '—'}
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-right">
          {canRemove && (
            <button
              onClick={() => setShowRemoveConfirm(true)}
              className="text-red-600 hover:text-red-800"
              title="Remove from project"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </td>
      </tr>

      {showRemoveConfirm && (
        <tr>
          <td colSpan={4} className="px-6 py-4 bg-red-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-800">
                Remove <strong>{member.name}</strong> from this project? They'll
                remain in the workspace.
              </p>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowRemoveConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleRemove}
                  loading={isLoadingMembers}       // ⬅️ Changed
                >
                  Remove
                </Button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
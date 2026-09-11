import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Badge } from '../UI/Badge';
import { Button } from '../Forms/Button';
import { useWorkspaceStore } from '../../store/workspace.store';
import { usePermission } from '../../hooks/usePermission';
import { TrashIcon } from '@heroicons/react/24/outline';

const roleVariant = {
  OWNER: 'purple',
  ADMIN: 'danger',
  MANAGER: 'warning',
  MEMBER: 'info',
  VIEWER: 'default',
};

export const MemberRow = ({ member, workspaceId, currentUserId, userRole }) => {
      const { updateMemberRole, removeMember, isLoading } = useWorkspaceStore();
const { isOwner } = usePermission(userRole);  // ⬅️ Pass userRole

const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [changingRole, setChangingRole] = useState(false);

  const isCurrentUser = member.user_id === currentUserId;
  const isMemberOwner = member.role === 'OWNER';

  const handleRoleChange = async (newRole) => {
    if (newRole === member.role) return;
    
    setChangingRole(true);
    try {
      await updateMemberRole(workspaceId, member.id, newRole);
      toast.success('Role updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    } finally {
      setChangingRole(false);
    }
  };

  const handleRemove = async () => {
    try {
      await removeMember(workspaceId, member.user_id);
      toast.success('Member removed');
      setShowRemoveConfirm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <>
      <tr className="hover:bg-gray-50">
        {/* User */}
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

        {/* Role */}
        <td className="px-6 py-4 whitespace-nowrap">
          {isMemberOwner || !isOwner ? (
            <Badge variant={roleVariant[member.role]}>
              {member.role}
            </Badge>
          ) : (
            <select
              value={member.role}
              onChange={(e) => handleRoleChange(e.target.value)}
              disabled={changingRole}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="VIEWER">Viewer</option>
              <option value="MEMBER">Member</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          )}
        </td>

        {/* Joined */}
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {member.joined_at
            ? new Date(member.joined_at).toLocaleDateString()
            : '—'}
        </td>

        {/* Actions */}
        <td className="px-6 py-4 whitespace-nowrap text-right">
          {isOwner && !isMemberOwner && !isCurrentUser && (
            <button
              onClick={() => setShowRemoveConfirm(true)}
              className="text-red-600 hover:text-red-800"
              title="Remove member"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </td>
      </tr>

      {/* Remove confirmation modal */}
      {showRemoveConfirm && (
        <tr>
          <td colSpan={4} className="px-6 py-4 bg-red-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-800">
                Remove <strong>{member.name}</strong> from this workspace?
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
                  loading={isLoading}
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
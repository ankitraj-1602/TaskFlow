import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Badge } from '../UI/Badge';
import { Button } from '../Forms/Button';
import { useWorkspaceStore } from '../../store/workspace.store';
import { usePermission } from '../../hooks/usePermission';
import { TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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
      await removeMember(workspaceId, member.id);
      toast.success('Member removed');
      setShowRemoveConfirm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <>
      <tr className="hover:bg-gray-50/70 transition-colors">
        {/* User */}
        <td className="px-6 py-4">
          <div className="flex items-center">
            {member.profile_picture ? (
              <img
                src={member.profile_picture}
                alt={member.name}
                className="h-10 w-10 rounded-full object-cover ring-1 ring-gray-100"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center ring-1 ring-indigo-100">
                <span className="text-indigo-600 font-medium">
                  {member.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {member.name}
                {isCurrentUser && (
                  <span className="ml-2 text-xs font-normal text-gray-400">(You)</span>
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
              className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Remove member"
              aria-label={`Remove ${member.name}`}
            >
              <TrashIcon className="h-4.5 w-4.5" />
            </button>
          )}
        </td>
      </tr>

      {/* Remove confirmation modal */}
      {showRemoveConfirm && (
        <tr>
          <td colSpan={4} className="px-6 py-4 bg-red-50/60 border-y border-red-100">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <ExclamationTriangleIcon className="h-4.5 w-4.5 text-red-500 shrink-0" />
                <p className="text-sm text-gray-700">
                  Remove <span className="font-medium text-gray-900">{member.name}</span> from this workspace?
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
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
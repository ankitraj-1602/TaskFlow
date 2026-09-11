import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../Forms/Button';
import { Badge } from '../UI/Badge';
import { MemberRow } from './MemberRow';
import { InviteMemberModal } from './InviteMemberModal';
import { useWorkspaceStore } from '../../store/workspace.store';
import { useAuthStore } from '../../store/auth.store';
import { usePermission } from '../../hooks/usePermission';
import { UserPlusIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';

export const MembersTab = ({ workspaceId, userRole }) => {
  const { user } = useAuthStore();
  const { 
    members, 
    pendingInvitations,
    loadWorkspaceMembers, 
    loadPendingInvitations,
    cancelInvitation,
    isLoading 
  } = useWorkspaceStore();
const { canManageMembers } = usePermission(userRole); 
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    loadWorkspaceMembers(workspaceId);
    if (canManageMembers) {
      loadPendingInvitations(workspaceId);
    }
  }, [workspaceId]);

  const handleCancelInvitation = async (invitationId) => {
    try {
      await cancelInvitation(workspaceId, invitationId);
      toast.success('Invitation cancelled');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Team Members ({members.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage who has access to this workspace
          </p>
        </div>
        {canManageMembers && (
          <Button onClick={() => setShowInviteModal(true)}>
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading && members.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No members yet</p>
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
              {members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  workspaceId={workspaceId}
                  currentUserId={user?.id}
                  userRole={userRole}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pending Invitations */}
      {canManageMembers && pendingInvitations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Pending Invitations ({pendingInvitations.length})
          </h3>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingInvitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <ClockIcon className="h-5 w-5 text-yellow-500 mr-2" />
                        <span className="text-sm text-gray-900">{inv.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="warning">{inv.role}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(inv.expires_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleCancelInvitation(inv.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Cancel invitation"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        workspaceId={workspaceId}
      />
    </div>
  );
};
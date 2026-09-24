import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ProtectedLayout } from '../components/Layout/ProtectedLayout';
import { EmptyState } from '../components/UI/EmptyState';
import { Badge } from '../components/UI/Badge';
import { workspaceApi } from '../api/workspace.api';
import { MagnifyingGlassIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import Loader from '../components/Loader';

const roleVariant = {
  OWNER: 'purple',
  ADMIN: 'danger',
  MANAGER: 'warning',
  MEMBER: 'info',
  VIEWER: 'default',
};

export const Team = () => {
  const navigate = useNavigate();
  const [team, setTeam] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await workspaceApi.getMyTeam();
        setTeam(data);
      } catch (error) {
        toast.error('Failed to load team');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filtered = team.filter((group) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      group.workspaceName.toLowerCase().includes(q) ||
      group.members.some(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q)
      )
    );
  });

  return (
    <ProtectedLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Team</h2>
            <p className="text-gray-600 mt-1">
              All members across your workspaces
            </p>
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader/>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="👥"
            title={searchQuery ? 'No members found' : 'No team yet'}
            description={
              searchQuery
                ? 'Try a different search'
                : 'Join a workspace to see your team here'
            }
          />
        ) : (
          <div className="space-y-8">
            {filtered.map((group) => (
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
                    ({group.members.length} members)
                  </span>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {group.members.map((member) => (
                        <tr key={member.memberId} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              {member.profilePicture ? (
                                <img
                                  src={member.profilePicture}
                                  alt={member.name}
                                  className="h-10 w-10 rounded-full"
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
                                </p>
                                <p className="text-sm text-gray-500">
                                  {member.email}
                                </p>
                                {member.jobTitle && (
                                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                    <BriefcaseIcon className="h-3 w-3" />
                                    {member.jobTitle}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={roleVariant[member.role] || 'default'}>
                              {member.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {member.joinedAt
                              ? new Date(member.joinedAt).toLocaleDateString()
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
};
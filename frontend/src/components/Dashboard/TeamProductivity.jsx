import React from 'react';
import { Badge } from '../UI/Badge';

const roleVariant = {
  OWNER: 'purple',
  ADMIN: 'danger',
  MANAGER: 'warning',
  MEMBER: 'info',
  VIEWER: 'default',
};

export const TeamProductivity = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No team members to display
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Member
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Role
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
              Assigned
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
              Completed
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
              In Progress
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
              Overdue
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((member) => (
            <tr key={member.userId} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="flex items-center">
                  {member.profilePicture ? (
                    <img
                      src={member.profilePicture}
                      alt={member.name}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 text-xs font-medium">
                        {member.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <Badge variant={roleVariant[member.role] || 'default'}>
                  {member.role}
                </Badge>
              </td>
              <td className="px-4 py-3 text-center text-sm text-gray-700">
                {member.totalAssignedTasks}
              </td>
              <td className="px-4 py-3 text-center text-sm font-medium text-green-600">
                {member.completedTasks}
              </td>
              <td className="px-4 py-3 text-center text-sm font-medium text-blue-600">
                {member.inProgressTasks}
              </td>
              <td className="px-4 py-3 text-center text-sm">
                {member.overdueTasks > 0 ? (
                  <span className="font-medium text-red-600">
                    {member.overdueTasks}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
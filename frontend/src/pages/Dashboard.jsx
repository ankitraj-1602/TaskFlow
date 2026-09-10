import React from 'react';
import { ProtectedLayout } from '../components/Layout/ProtectedLayout';
import { useAuthStore } from '../store/auth.store';
import { EmailVerificationBanner } from '../components/UI/EmailVerificationBanner';

export const Dashboard = () => {
  const { user } = useAuthStore();

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        {/* Email Verification Banner (shows only if unverified) */}
        <EmailVerificationBanner />

        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your projects today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Projects', value: '0', color: 'bg-blue-500' },
            { label: 'Tasks', value: '0', color: 'bg-green-500' },
            { label: 'Completed', value: '0', color: 'bg-purple-500' },
            { label: 'Team Members', value: '0', color: 'bg-orange-500' },
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`${stat.color} h-3 w-3 rounded-full mr-2`}></div>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Placeholder for charts and recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <p className="text-gray-500 text-sm">No recent activity to show.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Upcoming Tasks
            </h3>
            <p className="text-gray-500 text-sm">No upcoming tasks.</p>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
};
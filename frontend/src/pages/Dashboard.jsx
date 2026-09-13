import React from 'react';
import { ProtectedLayout } from '../components/Layout/ProtectedLayout';
import { useAuthStore } from '../store/auth.store';
import { EmailVerificationBanner } from '../components/UI/EmailVerificationBanner';
import {
  FolderIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  UsersIcon,
  ClockIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

const stats = [
  { label: 'Total Projects', value: '0', icon: FolderIcon, color: 'bg-blue-50', iconColor: 'text-blue-600' },
  { label: 'Tasks', value: '0', icon: ClipboardDocumentListIcon, color: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  { label: 'Completed', value: '0', icon: CheckCircleIcon, color: 'bg-violet-50', iconColor: 'text-violet-600' },
  { label: 'Team Members', value: '0', icon: UsersIcon, color: 'bg-amber-50', iconColor: 'text-amber-600' },
];

export const Dashboard = () => {
  const { user } = useAuthStore();

  return (
    <ProtectedLayout>
      <div className="space-y-8">
        {/* Email Verification Banner (shows only if unverified) */}
        <EmailVerificationBanner />

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-gray-500 mt-1">
            Here's what's happening with your projects today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center">
                  <div className={`${stat.color} h-11 w-11 rounded-xl flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  <div className="ml-3.5">
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Placeholder for charts and recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="text-center py-10">
              <ClockIcon className="h-7 w-7 text-gray-300 mx-auto" />
              <p className="text-gray-500 text-sm mt-3">No recent activity to show.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Upcoming Tasks
            </h3>
            <div className="text-center py-10">
              <CalendarDaysIcon className="h-7 w-7 text-gray-300 mx-auto" />
              <p className="text-gray-500 text-sm mt-3">No upcoming tasks.</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
};
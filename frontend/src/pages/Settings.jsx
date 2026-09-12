import React, { useState } from 'react';
import { ProtectedLayout } from '../components/Layout/ProtectedLayout';
import { AccountTab } from '../components/Settings/AccountTab';
import { SecurityTab } from '../components/Settings/SecurityTab';
import { DangerZoneTab } from '../components/Settings/DangerZoneTab';
import {
  UserCircleIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const tabs = [
  { id: 'account', name: 'Account', icon: UserCircleIcon },
  { id: 'security', name: 'Security', icon: ShieldCheckIcon },
  { id: 'danger', name: 'Danger Zone', icon: ExclamationTriangleIcon },
];

export const Settings = () => {
  const [activeTab, setActiveTab] = useState('account');

  return (
    <ProtectedLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-600 mt-1">
            Manage your account, security, and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? tab.id === 'danger'
                        ? 'border-red-600 text-red-600'
                        : 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'account' && <AccountTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'danger' && <DangerZoneTab />}
      </div>
    </ProtectedLayout>
  );
};  
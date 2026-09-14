import React from 'react';

export const StatCard = ({ label, value, icon: Icon, color = 'bg-indigo-500', subtitle }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`${color} h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
};
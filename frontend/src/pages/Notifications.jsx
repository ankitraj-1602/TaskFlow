import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ProtectedLayout } from '../components/Layout/ProtectedLayout';
import { NotificationItem } from '../components/Notification/NotificationItem';
import { Button } from '../components/Forms/Button';
import { EmptyState } from '../components/UI/EmptyState';
import { useNotificationStore } from '../store/notification.store';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
];

export const Notifications = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotificationStore();

  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadNotifications({
      unreadOnly: filter === 'unread',
      limit: 50,
    }).catch(() => {
      toast.error('Failed to load notifications');
    });
  }, [filter]);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      toast.success('All marked as read');
    } catch (error) {
      toast.error('Failed');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Delete all notifications?')) return;
    try {
      await clearAll();
      toast.success('Cleared');
    } catch (error) {
      toast.error('Failed');
    }
  };

  return (
    <ProtectedLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
            <p className="text-gray-600 mt-1">
              {unreadCount > 0
                ? `${unreadCount} unread`
                : 'All caught up'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
                <CheckIcon className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="secondary" size="sm" onClick={handleClearAll}>
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === f.id
                  ? 'bg-indigo-100 text-indigo-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.label}
              {f.id === 'unread' && unreadCount > 0 && (
                <span className="ml-2 text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading && notifications.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon="🔔"
              title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              description="You're all caught up!"
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
};
import React, { Fragment, useEffect, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { useNotificationStore } from '../../store/notification.store';
import { NotificationDropdown } from '../Notification/NotificationDropdown';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { CommandPalette } from '../Search/CommandPalette';

export const Navbar = () => {
  const { user, logout } = useAuthStore();
  const { unreadCount, startPolling, stopPolling,loadUnreadCount } = useNotificationStore();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
  const handler = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setShowSearch(true);
    }
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-end px-6 py-3">

<button
  onClick={() => setShowSearch(true)}
  className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors w-64"
>
  <MagnifyingGlassIcon className="h-4 w-4" />
  <span>Search...</span>
  <kbd className="ml-auto text-[10px] font-semibold text-gray-400 border border-gray-300 rounded px-1.5 py-0.5">
    ⌘K
  </kbd>
</button>

{/* For mobile — just icon */}
<button
  onClick={() => setShowSearch(true)}
  className="md:hidden text-gray-500 hover:text-gray-700 p-1"
>
  <MagnifyingGlassIcon className="h-6 w-6" />
</button>
        <div className="flex items-center space-x-4">
          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className="text-gray-500 hover:text-gray-700 relative p-1"
            >
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-semibold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <NotificationDropdown
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
          </div>

          {/* User menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center space-x-3 focus:outline-none">
              <div className="flex items-center space-x-2">
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 font-medium text-sm">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">
                  {user?.name}
                </span>
              </div>
              <svg
                className="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/profile"
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex items-center px-4 py-2 text-sm text-gray-700`}
                    >
                      <UserCircleIcon className="h-5 w-5 mr-2" />
                      Profile
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/settings"
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex items-center px-4 py-2 text-sm text-gray-700`}
                    >
                      <Cog6ToothIcon className="h-5 w-5 mr-2" />
                      Settings
                    </Link>
                  )}
                </Menu.Item>
                <hr className="my-1" />
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex items-center w-full px-4 py-2 text-sm text-red-600`}
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                      Logout
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
      <CommandPalette
  isOpen={showSearch}
  onClose={() => setShowSearch(false)}
/>
    </header>
    
  );
};
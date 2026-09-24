// import React from 'react';
// import { NavLink } from 'react-router-dom';
// import {
//   HomeIcon,
//   ClipboardDocumentListIcon,
//   UsersIcon,
//   Cog6ToothIcon,
//   FolderIcon,
//   Squares2X2Icon,
//   CheckCircleIcon,
//   BellIcon,
// } from '@heroicons/react/24/outline';

// const navigation = [
//   { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
//   { name: 'My Tasks', href: '/my-tasks', icon: CheckCircleIcon },
//   { name: 'Projects', href: '/projects', icon: FolderIcon },
//   { name: 'Team', href: '/team', icon: UsersIcon },
//   { name: 'Notifications', href: '/notifications', icon: BellIcon },
//   { name: 'Workspaces', href: '/workspaces', icon: Squares2X2Icon },
//   { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
// ];

// export const Sidebar = () => {
//   return (
//     <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
//       <div className="flex items-center justify-center h-15 border-b border-gray-200">
//         <h1 className="text-2xl font-bold text-indigo-600">TaskFlow</h1>
//       </div>

//       <nav className="flex-1 px-4 py-4 space-y-1">
//         {navigation.map((item) => {
//           const Icon = item.icon;
//           return (
//             <NavLink
//               key={item.name}
//               to={item.href}
//               className={({ isActive }) =>
//                 `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
//                   isActive
//                     ? 'bg-indigo-50 text-indigo-600'
//                     : 'text-gray-700 hover:bg-gray-50'
//                 }`
//               }
//             >
//               <Icon className="h-5 w-5 mr-3" />
//               {item.name}
//             </NavLink>
//           );
//         })}
//       </nav>

//       <div className="p-4 border-t border-gray-200">
//         <div className="text-xs text-gray-500">
//           <p>TaskFlow v1.0.0</p>
//           <p className="mt-1">© 2026 TaskFlow Inc.</p>
//         </div>
//       </div>
//     </div>
//   );
// };

import React, { Fragment } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon,
  UsersIcon,
  Cog6ToothIcon,
  FolderIcon,
  Squares2X2Icon,
  CheckCircleIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'My Tasks', href: '/my-tasks', icon: CheckCircleIcon },
  { name: 'Projects', href: '/projects', icon: FolderIcon },
  { name: 'Team', href: '/team', icon: UsersIcon },
  { name: 'Notifications', href: '/notifications', icon: BellIcon },
  { name: 'Workspaces', href: '/workspaces', icon: Squares2X2Icon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export const Sidebar = ({ isOpen = false, onClose = () => { } }) => {
  const location = useLocation();

  const navLinks = (
    <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        return (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onClose}
            className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-gray-700 hover:bg-gray-50'
              }`}
          >
            <Icon className="h-5 w-5 mr-3" />
            {item.name}
          </NavLink>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="p-4 border-t border-gray-200">
      <div className="text-xs text-gray-500">
        <p>TaskFlow v1.0.0</p>
        <p className="mt-1">© 2026 TaskFlow Inc.</p>
      </div>
    </div>
  );

  const header = (
    <div className="relative flex items-center justify-center h-16 px-4 border-b border-gray-200">
      <h1 className="text-2xl font-bold text-indigo-600">
        TaskFlow
      </h1>

      <button
        onClick={onClose}
        className="absolute right-4 md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
        aria-label="Close sidebar"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );

  return (
    <>
      {/* ─── Desktop sidebar (always visible on md+) ─── */}
      <div className="hidden md:flex md:w-64 md:flex-col bg-white border-r border-gray-200 h-screen sticky top-0">
        {header}
        {navLinks}
        {footer}
      </div>

      {/* ─── Mobile drawer ─── */}
      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 md:hidden" onClose={onClose}>
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>

          {/* Sidebar panel */}
          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-200 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-200 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="w-64 max-w-[80vw] bg-white flex flex-col">
                {header}
                {navLinks}
                {footer}
              </Dialog.Panel>
            </Transition.Child>

            {/* Click-outside area */}
            <div className="flex-1" onClick={onClose} />
          </div>
        </Dialog>
      </Transition>
    </>
  );
};
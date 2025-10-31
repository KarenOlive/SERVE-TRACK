'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const roleThemes = {
    student: {
      bg: 'bg-blue-600',
      text: 'text-blue-600',
      border: 'border-blue-600',
      hover: 'hover:bg-blue-100',
      light: 'bg-blue-50'
    },
    nonprofit: {
      bg: 'bg-green-600',
      text: 'text-green-600', 
      border: 'border-green-600',
      hover: 'hover:bg-green-100',
      light: 'bg-green-50'
    },
    admin: {
      bg: 'bg-purple-600',
      text: 'text-purple-600',
      border: 'border-purple-600',
      hover: 'hover:bg-purple-100',
      light: 'bg-purple-50'
    }
  };

// Navigation items for each role
const navigation = {
  student: [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'My Profile', href: '/dashboard/student/profile', icon: '👤' },
    { name: 'Browse Opportunities', href: '/opportunities', icon: '🔍' },
    { name: 'My Applications', href: '/dashboard/student/applications', icon: '📝' },
    { name: 'Log Hours', href: '/dashboard/student/hours/log', icon: '⏱️' },
    { name: 'Hour History', href: '/dashboard/student/hours', icon: '📊' },
    { name: 'Progress Reports', href: '/dashboard/student/reports', icon: '📈' },
  ],
  nonprofit: [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'Organization Profile', href: '/dashboard/site/profile', icon: '🏢' },
    { name: 'Manage Opportunities', href: '/dashboard/site/opportunities', icon: '💼' },
    { name: 'Applications', href: '/dashboard/site/applications', icon: '📨' },
    { name: 'Hour Verification', href: '/dashboard/site/verification', icon: '✅' },
    { name: 'Impact Reports', href: '/dashboard/site/reports', icon: '📈' },
  ],
  admin: [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'Admin Profile', href: '/dashboard/admin/profile', icon: '👤' },
    { name: 'University Management', href: '/dashboard/admin/universities', icon: '🎓' },
    { name: 'User Management', href: '/dashboard/admin/users', icon: '👥' },
    { name: 'Analytics', href: '/dashboard/admin/analytics', icon: '📊' },
    { name: 'System Reports', href: '/dashboard/admin/reports', icon: '📈' },
    { name: 'System Settings', href: '/dashboard/admin/settings', icon: '⚙️' },
  ]
};


export default function DashboardSidebar({ user, onLogout, mobile = false, onClose }) {
  const pathname = usePathname();
  const theme = roleThemes[user.userType];
  const navItems = navigation[user.userType] || [];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo and Brand */}
      <div className={`flex items-center justify-between h-16 px-4 ${theme.bg} text-white`}>
        <div className="flex items-center space-x-2">
          <span className="text-xl"></span>
          <h1 className="text-lg font-bold">ServeTrack</h1>
        </div>
        {mobile && (
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-black hover:bg-opacity-20"
          >
            <span className="text-white"></span>
          </button>
        )}
      </div>

      {/* User Info */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme.bg} text-white font-semibold`}>
            {user.firstName?.[0]}{user.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user.userType}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? `${theme.bg} text-white`
                  : `text-gray-700 hover:bg-gray-100 ${theme.hover}`
              }`}
              onClick={mobile ? onClose : undefined}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span className="mr-3">🚪</span>
          Sign Out
        </button>
      </div>
    </div>
  );

  if (mobile) {
    return (
      <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
        {sidebarContent}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-64">
      {sidebarContent}
    </div>
  );
}
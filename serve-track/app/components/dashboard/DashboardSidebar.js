'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  X, 
  LogOut, 
  Home, 
  User, 
  Search, 
  FileText, 
  Clock, 
  BarChart3, 
  TrendingUp, 
  Building, 
  Briefcase, 
  Mail, 
  CheckSquare, 
  CheckCircle2,
  GraduationCap, 
  Users, 
  Settings,
  Bell
} from 'lucide-react';

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

// Navigation items for each role with Lucide icons
const getNavigation = (notificationCount) => ({
  student: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Profile', href: '/dashboard/student/profile', icon: User },
    { name: 'Browse Opportunities', href: '/opportunities', icon: Search },
    { name: 'My Applications', href: '/dashboard/student/applications', icon: FileText },
    { name: 'Log Hours', href: '/dashboard/student/hours/log', icon: Clock },
    { name: 'Hour History', href: '/dashboard/student/hours', icon: BarChart3 },
    { name: 'Progress Reports', href: '/dashboard/student/reports', icon: TrendingUp },
  ],
  nonprofit: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Organization Profile', href: '/dashboard/site/profile', icon: Building },
    { name: 'Manage Opportunities', href: '/dashboard/site/opportunities', icon: Briefcase },
    { name: 'Student Applications', href: '/dashboard/site/applications', icon: Mail },
    { name: 'Hour Verification', href: '/dashboard/site/verifications', icon: CheckSquare },
    { name: 'Impact Reports', href: '/dashboard/site/reports', icon: BarChart3 },
  ],
  admin: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Admin Profile', href: '/dashboard/admin/profile', icon: User },
    { 
      name: 'Approval Requests', 
      href: '/dashboard/admin/approval-requests', 
      icon: CheckCircle2, 
      badge: notificationCount > 0 ? notificationCount : null
    },
    { name: 'University Management', href: '/dashboard/admin/universities', icon: GraduationCap },
    { name: 'User Management', href: '/dashboard/admin/users', icon: Users },
    { name: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
    { name: 'System Reports', href: '/dashboard/admin/reports', icon: TrendingUp },
    { name: 'System Settings', href: '/dashboard/admin/settings', icon: Settings },
  ]
});

export default function DashboardSidebar({ user, onLogout, mobile = false, onClose }) {
  const pathname = usePathname();
  const theme = roleThemes[user.userType];
  const [notificationCount, setNotificationCount] = useState(0);

  // Fetch notification count only for admin users
  const fetchNotificationCount = async () => {
    if (user.userType !== 'admin') return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setNotificationCount(data.notifications?.length || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notification count:', err);
    }
  };

  useEffect(() => {
    fetchNotificationCount();
  }, [user.userType]);

  const navItems = getNavigation(notificationCount)[user.userType] || [];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo and Brand */}
      <div className={`flex items-center justify-between h-16 px-4 ${theme.bg} text-white`}>
        <div className="flex items-center space-x-2">
          <h1 className="text-lg font-bold">ServeTrack</h1>
        </div>
        {mobile && (
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-black hover:bg-opacity-20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
            <span className="sr-only">Close sidebar</span>
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
          const IconComponent = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? `${theme.bg} text-white`
                  : `text-gray-700 hover:bg-gray-100 ${theme.hover}`
              }`}
              onClick={mobile ? onClose : undefined}
            >
              <div className="flex items-center">
                <IconComponent className="w-5 h-5 mr-3" />
                {item.name}
              </div>
              {item.badge && item.badge > 0 && (
                <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full ${
                  isActive ? 'bg-white text-purple-600' : 'bg-purple-100 text-purple-600'
                }`}>
                  {item.badge}
                </span>
              )}
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
          <LogOut className="w-5 h-5 mr-3" />
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
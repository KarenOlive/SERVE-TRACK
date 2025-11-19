'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, ChevronDown, User, LogOut } from 'lucide-react';
import { getUserDashboardPath, getUserDisplayName } from '@/lib/userUtils';

const roleBadges = {
    student: {
      text: 'text-blue-600',
      bg: 'bg-blue-100',
      border: 'border-blue-600'
    },
    nonprofit: {
      text: 'text-green-600',
      bg: 'bg-green-100', 
      border: 'border-green-600'
    },
    admin: {
      text: 'text-purple-600',
      bg: 'bg-purple-100',
      border: 'border-purple-600'
    },
    university_admin: {
    
      text: 'text-indigo-600',
      bg: 'bg-indigo-100',
      border: 'border-indigo-600'
    }
  };

export default function DashboardHeader({ user, onMenuClick, onLogout }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
 // Add fallback to prevent undefined theme
 const theme = roleBadges[user.userType] || roleBadges.admin;

 // Get display name for user type
 const userTypeDisplay = getUserDisplayName(user.userType);

  return (
    <header className="flex-shrink-0 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left side - Mobile menu button and title */}
        <div className="flex items-center">
          <button
            type="button"
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
            onClick={onMenuClick}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="ml-2 lg:ml-0">
            <h1 className="text-lg font-semibold text-gray-900">
              ServeTrack Dashboard
            </h1>
          </div>
        </div>

        {/* Right side - User menu */}
        <div className="flex items-center space-x-4">
          {/* Role badge */}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${theme.bg} ${theme.text} ${theme.border} capitalize`}>
            {userTypeDisplay}
          </span>

          {/* User menu */}
          <div className="relative">
            <button
              className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-royal-blue"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${roleBadges[user.userType].bg} ${roleBadges[user.userType].text} font-semibold`}>
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <span className="hidden md:block text-gray-700">
                {user.firstName} {user.lastName}
              </span>
              <ChevronDown className="hidden md:block w-4 h-4" />
            </button>

            {/* User dropdown menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                  Signed in as {user.firstName} {user.lastName}
                </div>
                <Link
                  href={`/dashboard/${getUserDashboardPath(user.userType)}/profile`}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <User className="w-4 h-4 mr-2" />
                  Your Profile
                </Link>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    onLogout();
                  }}
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {userMenuOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        ></div>
      )}
    </header>
  );
}
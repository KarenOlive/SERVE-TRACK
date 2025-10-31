'use client';

import { useState, useEffect } from 'react';
import StatCard from '../ui/StatCard';
import ActivityFeed from '../dashboard/ActivityFeed';
import Link from 'next/link';

export default function AdminDashboardHome({ user }) {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const data = await response.json();
        setStats(data.stats);
        setRecentActivity(data.recentActivity);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-2 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-3">⚠️</div>
          <p className="text-gray-900 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">
          System Administration 
        </h1>
        <p className="text-gray-600 mt-2">
          Manage the ServeTrack platform and monitor system activity.
        </p>
      </div>

      {/* System Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats.totalStudents.toLocaleString()}
          color="purple"
          icon="🎓"
          subtitle="Registered users"
        />
        <StatCard
          title="Organizations"
          value={stats.totalOrganizations}
          color="purple"
          icon="🏢"
          subtitle="Nonprofit partners"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          color="purple"
          icon="⏳"
          subtitle="Require attention"
        />
        <StatCard
          title="System Users"
          value={stats.systemUsers.toLocaleString()}
          color="purple"
          icon="👥"
          subtitle="Total platform users"
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Admin Actions
          </h3>
          <div className="space-y-3">
            <Link 
              href="/dashboard/admin/universities"
              className="block w-full text-left p-4 rounded-lg border border-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🎓</span>
                <div>
                  <p className="font-medium text-purple-900">Manage Universities</p>
                  <p className="text-sm text-purple-700">Configure university settings and requirements</p>
                </div>
              </div>
            </Link>
            
            <Link 
              href="/dashboard/admin/users"
              className="block w-full text-left p-4 rounded-lg border border-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">👥</span>
                <div>
                  <p className="font-medium text-blue-900">User Management</p>
                  <p className="text-sm text-blue-700">Manage all platform users</p>
                </div>
              </div>
            </Link>

            <Link 
              href="/dashboard/admin/analytics"
              className="block w-full text-left p-4 rounded-lg border border-green-600 bg-green-50 hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-medium text-green-900">View Analytics</p>
                  <p className="text-sm text-green-700">Platform usage and impact reports</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <ActivityFeed activities={recentActivity} />
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import StatCard from '../ui/StatCard';
import ActivityFeed from '../dashboard/ActivityFeed';
import Link from 'next/link';
import { 
  GraduationCap, Building, Bell, Users, BarChart3, Shield, AlertTriangle, Hourglass } from 'lucide-react';

export default function AdminDashboardHome({ user }) {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine if this is a university admin
  const isUniversityAdmin = user.userType === 'university_admin';

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
          <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isUniversityAdmin ? 'border-indigo-600' : 'border-purple-600'}`}></div>
          <p className="mt-2 text-gray-600">Loading {isUniversityAdmin ? 'university' : 'admin'} dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-900 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className={`mt-3 px-4 py-2 ${isUniversityAdmin ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded-lg`}
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
          {isUniversityAdmin ? 'University Administration' : 'System Administration'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isUniversityAdmin 
            ? 'Manage your university\'s ServeTrack platform and monitor activity.'
            : 'Manage the ServeTrack platform and monitor system activity.'
          }
        </p>
      </div>

      {/* System Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={isUniversityAdmin ? "University Students" : "Total Students"}
          value={stats.totalStudents?.toLocaleString() || '0'}
          color={isUniversityAdmin ? "indigo" : "purple"}
          icon={<GraduationCap className="w-7 h-7 text-indigo-500" />}
          subtitle={isUniversityAdmin ? "From your university" : "Registered users"}
        />
        <StatCard
          title={isUniversityAdmin ? "Partner Organizations" : "Organizations"}
          value={stats.totalOrganizations || '0'}
          color={isUniversityAdmin ? "indigo" : "purple"}
          icon={<Building className="w-7 h-7 text-indigo-500" />}
          subtitle={isUniversityAdmin ? "Working with your university" : "Nonprofit partners"}
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals || '0'}
          color={isUniversityAdmin ? "indigo" : "purple"}
          icon={<Bell className="w-7 h-7 text-indigo-500" />}
          subtitle="Require attention"
        />
        <StatCard
          title={isUniversityAdmin ? "Active Users" : "System Users"}
          value={stats.systemUsers?.toLocaleString() || stats.activeUsers?.toLocaleString() || '0'}
          color={isUniversityAdmin ? "indigo" : "purple"}
          icon={<Users className="w-7 h-7 text-indigo-500" />}
          subtitle={isUniversityAdmin ? "From your university" : "Total platform users"}
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {isUniversityAdmin ? 'University Admin Actions' : 'Admin Actions'}
          </h3>
          <div className="space-y-3">
            <Link 
              href="/dashboard/admin/universities"
              className={`block w-full text-left p-4 rounded-lg border ${isUniversityAdmin ? 'border-indigo-600 bg-indigo-50 hover:bg-indigo-100' : 'border-purple-600 bg-purple-50 hover:bg-purple-100'} transition-colors`}
            >
              <div className="flex items-center space-x-3">
                <GraduationCap className={`w-6 h-6 ${isUniversityAdmin ? 'text-indigo-600' : 'text-purple-600'}`} />
                <div>
                  <p className={`font-medium ${isUniversityAdmin ? 'text-indigo-900' : 'text-purple-900'}`}>Manage Universities</p>
                  <p className={`text-sm ${isUniversityAdmin ? 'text-indigo-700' : 'text-purple-700'}`}>
                    {isUniversityAdmin ? 'Configure your university settings' : 'Configure university settings and requirements'}
                  </p>
                </div>
              </div>
            </Link>
            
            <Link 
              href="/dashboard/admin/users"
              className="block w-full text-left p-4 rounded-lg border border-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">User Management</p>
                  <p className="text-sm text-blue-700">
                    {isUniversityAdmin ? 'Manage users from your university' : 'Manage all platform users'}
                  </p>
                </div>
              </div>
            </Link>

            <Link 
              href="/dashboard/admin/analytics"
              className="block w-full text-left p-4 rounded-lg border border-green-600 bg-green-50 hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">View Analytics</p>
                  <p className="text-sm text-green-700">
                    {isUniversityAdmin ? 'University usage and impact reports' : 'Platform usage and impact reports'}
                  </p>
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
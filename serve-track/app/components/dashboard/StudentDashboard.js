'use client';

import { useState, useEffect } from 'react';
import StatCard from '../ui/StatCard';
import ProgressBar from '../ui/ProgressBar';
import ActivityFeed from '../dashboard/ActivityFeed';
import Link from 'next/link';

export default function StudentDashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/student/dashboard', {
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
        console.error('Error fetching student data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading your dashboard...</p>
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
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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

  const progressPercentage = (stats.completedHours / stats.requiredHours) * 100;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.firstName}! 
        </h1>
        <p className="text-gray-600 mt-2">
          Track your community service progress and find new opportunities.
        </p>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Service Hour Progress
        </h2>
        <div className="space-y-4">
          <ProgressBar 
            value={stats.completedHours}
            max={stats.requiredHours}
            label={`${stats.completedHours} / ${stats.requiredHours} hours completed`}
            color="blue"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Verified Hours"
              value={stats.verifiedHours}
              color="blue"
              icon="✅"
              subtitle="Approved by organizations"
            />
            <StatCard
              title="Pending Applications"
              value={stats.pendingApplications}
              color="blue"
              icon="📝"
              subtitle="Awaiting response"
            />
            <StatCard
              title="Hours Needed"
              value={stats.hoursNeeded}
              color="blue"
              icon="🎯"
              subtitle="To complete requirement"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link 
              href="/opportunities"
              className="block w-full text-left p-4 rounded-lg border border-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🔍</span>
                <div>
                  <p className="font-medium text-blue-900">Browse Opportunities</p>
                  <p className="text-sm text-blue-700">Find volunteer positions that match your interests</p>
                </div>
              </div>
            </Link>
            
            <Link 
              href="/dashboard/student/hours/log"
              className="block w-full text-left p-4 rounded-lg border border-green-600 bg-green-50 hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">⏱️</span>
                <div>
                  <p className="font-medium text-green-900">Log Hours</p>
                  <p className="text-sm text-green-700">Record your completed service hours</p>
                </div>
              </div>
            </Link>

            <Link 
              href="/dashboard/student/applications"
              className="block w-full text-left p-4 rounded-lg border border-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="font-medium text-purple-900">My Applications</p>
                  <p className="text-sm text-purple-700">Track your opportunity applications</p>
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
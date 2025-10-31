'use client';

import { useState, useEffect } from 'react';
import StatCard from '../ui/StatCard';
import ActivityFeed from '../dashboard/ActivityFeed';
import Link from 'next/link';
import CreateOpportunityModal from '../opportunities/CreateOpportunityModal';

export default function SiteDashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [topVolunteers, setTopVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    console.log('User object:', user);
    console.log('User profile:', user.profile);
  }, [user]);
  
  useEffect(() => {
    const fetchNonprofitData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/site/dashboard', {
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
        setTopVolunteers(data.topVolunteers || []);
      } catch (error) {
        console.error('Error fetching nonprofit data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    console.log('User object:', user);
    console.log('User profile:', user.profile);

    fetchNonprofitData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
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
            className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
          Welcome, {user.profile?.organization_name || 'Organization'}! 🏢
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your volunteer opportunities and track community impact.
        </p>
      </div>

      {/* Organization Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Volunteers"
          value={stats.totalVolunteers}
          color="green"
          icon="👥"
          subtitle="All time"
        />
        <StatCard
          title="Pending Applications"
          value={stats.pendingApplications}
          color="green"
          icon="📝"
          subtitle="Need review"
        />
        <StatCard
          title="Hours This Month"
          value={stats.hoursThisMonth}
          color="green"
          icon="⏱️"
          subtitle="Volunteer hours"
        />
        <StatCard
          title="Active Opportunities"
          value={stats.activeOpportunities}
          color="green"
          icon="💼"
          subtitle="Currently listed"
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="block w-full text-left p-4 rounded-lg border border-green-600 bg-green-50 hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">➕</span>
                <div>
                  <p className="font-medium text-green-900">Create Opportunity</p>
                  <p className="text-sm text-green-700">Post a new volunteer position</p>
                </div>
              </div>
            </button>

            <CreateOpportunityModal 
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onSuccess={(opportunity) => {
                // You can refresh the opportunities list or show a success message
                console.log('Opportunity created:', opportunity);
                // Optionally refresh the dashboard data
              }}
            />
            
            <Link 
              href="/dashboard/site/applications"
              className="block w-full text-left p-4 rounded-lg border border-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="font-medium text-blue-900">Review Applications</p>
                  <p className="text-sm text-blue-700">Manage volunteer applications</p>
                </div>
              </div>
            </Link>

            <Link 
              href="/dashboard/site/verification"
              className="block w-full text-left p-4 rounded-lg border border-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-medium text-purple-900">Verify Hours</p>
                  <p className="text-sm text-purple-700">Approve volunteer time submissions</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <ActivityFeed activities={recentActivity} />
      </div>

      {/* Top Volunteers */}
      {topVolunteers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Volunteers This Month
          </h3>
          <div className="space-y-3">
            {topVolunteers.map((volunteer, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-medium">
                    {volunteer.firstName?.[0]}{volunteer.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {volunteer.firstName} {volunteer.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{volunteer.universityName}</p>
                  </div>
                </div>
                <span className="font-semibold text-green-600">{volunteer.hours} hours</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
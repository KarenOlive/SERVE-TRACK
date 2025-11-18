'use client';

import { useState, useEffect } from 'react';
import StatCard from '../ui/StatCard';
import ActivityFeed from '../dashboard/ActivityFeed';
import Link from 'next/link';
import OpportunityModal from '../opportunities/OpportunityModal';
import { useToast } from '../../hooks/useToast';
import {
  Building,
  Users,
  FileText,
  Clock,
  Briefcase,
  Plus,
  ClipboardList,
  CheckCircle,
  AlertTriangle,
  Hourglass,
  Loader2,
  X
} from 'lucide-react';

export default function SiteDashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [topVolunteers, setTopVolunteers] = useState([]);
  const [orgProfile, setOrgProfile] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { addToast, ToastContainer } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [showIncompleteBanner, setShowIncompleteBanner] = useState(true);
  const [showVerifiedBanner, setShowVerifiedBanner] = useState(true);
  const [showRejectedBanner, setShowRejectedBanner] = useState(true);

  const fetchNonprofitData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/site/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch dashboard data');

      const data = await response.json();
      setStats(data.stats);
      setRecentActivity(data.recentActivity);
      setTopVolunteers(data.topVolunteers || []);
      setOrgProfile(data.orgProfile || null);
      setUserProfile(data.userProfile || null);
      setError(null);
    } catch (err) {
      console.error('Error fetching nonprofit data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNonprofitData();
  }, [user]);

  const handleDismissVerified = () => setShowVerifiedBanner(false);

  // --- Banners ---
  const renderVerificationBanner = () => {
    const profileComplete = userProfile?.profile_complete;
    const verificationStatus = orgProfile?.verification_status;

    if (!profileComplete && showIncompleteBanner) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-yellow-800 flex justify-between items-start">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 mt-0.5 text-yellow-700" />
            <div>
              <p className="font-medium">Your profile is incomplete.</p>
              <p className="text-sm">
                Complete it to request verification and unlock posting privileges.
              </p>
            </div>
          </div>
          <button onClick={() => setShowIncompleteBanner(false)}>
            <X className="w-4 h-4 text-yellow-700 hover:text-yellow-900" />
          </button>
        </div>
      );
    }

    if (profileComplete && verificationStatus === 'pending') {
      return (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-blue-800 flex justify-between items-start">
          <div className="flex items-start space-x-2">
            <Hourglass className="w-5 h-5 mt-0.5 text-blue-700" />
            <div>
              <p className="font-medium">Verification Pending</p>
              <p className="text-sm">
                Your verification request is currently under review.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (verificationStatus === 'verified' && showVerifiedBanner) {
      return (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-green-800 flex justify-between items-start">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 mt-0.5 text-green-700" />
            <div>
              <p className="font-medium">Organization Verified</p>
              <p className="text-sm">
                You can now post opportunities and manage volunteers.
              </p>
            </div>
          </div>
          <button onClick={handleDismissVerified}>
            <X className="w-4 h-4 text-green-700 hover:text-green-900" />
          </button>
        </div>
      );
    }

    if (verificationStatus === 'rejected' && showRejectedBanner) {
      return (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-800 flex justify-between items-start">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 mt-0.5 text-red-700" />
            <div>
              <p className="font-medium">Verification Rejected</p>
              <p className="text-sm">
                Your organization’s verification was not approved. Please review your profile information, make corrections, and resubmit a verification request.
              </p>
              {orgProfile?.rejection_reason && (
                <div className="mt-2 p-2 bg-red-100 text-red-800 rounded">
                  <strong className="text-sm">Reason:</strong>
                  <p className="text-sm mt-1 whitespace-pre-line">{orgProfile.rejection_reason}</p>
                </div>
              )}
              <Link 
                href="/dashboard/site/profile" 
                className="text-sm font-medium text-red-700 underline hover:text-red-900 mt-1 inline-block"
              >
                Go to Profile
              </Link>
            </div>
          </div>
          <button onClick={() => setShowRejectedBanner(false)}>
            <X className="w-4 h-4 text-red-700 hover:text-red-900" />
          </button>
        </div>
      );
    }

    return null;
  };

  // --- Loading / Error ---
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        <p className="ml-2 text-gray-600">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertTriangle className="w-10 h-10 text-red-500 mb-2" />
        <p className="text-gray-900 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Try Again
        </button>
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

  // --- Main Dashboard ---
  return (
    <div className="relative space-y-6">
      {/* Refresh overlay */}
      {refreshing && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-40">
          <Loader2 className="w-10 h-10 animate-spin text-green-600" />
          <p className="mt-2 text-gray-700 font-medium">Refreshing data...</p>
        </div>
      )}

      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          Welcome, {orgProfile?.organization_name || 'Organization'}!
          <Building className="ml-2 w-6 h-6" />
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your volunteer opportunities and track community impact.
        </p>
      </div>

      {/* Verification Banner */}
      {renderVerificationBanner()}

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Volunteers"
          value={stats.totalVolunteers}
          color="green"
          icon={<Users className="w-6 h-6" />}
          subtitle="All time"
        />
        <StatCard
          title="Pending Applications"
          value={stats.pendingApplications}
          color="green"
          icon={<FileText className="w-6 h-6" />}
          subtitle="Need review"
        />
        <StatCard
          title="Hours This Month"
          value={stats.hoursThisMonth}
          color="green"
          icon={<Clock className="w-6 h-6" />}
          subtitle="Volunteer hours"
        />
        <StatCard
          title="Active Opportunities"
          value={stats.activeOpportunities}
          color="green"
          icon={<Briefcase className="w-6 h-6" />}
          subtitle="Currently listed"
        />
      </div>

      {/* Quick Actions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={orgProfile?.verification_status !== 'verified'}
              className={`block w-full text-left p-4 rounded-lg border transition-colors ${
                orgProfile?.verification_status === 'verified'
                  ? 'border-green-600 bg-green-50 hover:bg-green-100'
                  : 'border-gray-300 bg-gray-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Plus className={`w-6 h-6 ${
                  orgProfile?.verification_status === 'verified' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <div>
                  <p className={`font-medium ${
                    orgProfile?.verification_status === 'verified' ? 'text-green-900' : 'text-gray-500'
                  }`}>
                    Create Opportunity
                  </p>
                  <p className={`text-sm ${
                    orgProfile?.verification_status === 'verified' ? 'text-green-700' : 'text-gray-400'
                  }`}>
                    {orgProfile?.verification_status === 'verified' 
                      ? 'Post a new volunteer position' 
                      : 'Verify your organization to post opportunities'}
                  </p>
                </div>
              </div>
            </button>

            <OpportunityModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onSuccess={(opportunity) => {
                addToast(`Opportunity "${opportunity.title}" created successfully!`, "success");
                setShowCreateModal(false);
                setRefreshing(true);
                fetchNonprofitData();
              }}
            />

            <Link
              href="/dashboard/site/applications"
              className="block w-full text-left p-4 rounded-lg border border-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <ClipboardList className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Review Applications</p>
                  <p className="text-sm text-blue-700">Manage volunteer applications</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/site/verifications"
              className="block w-full text-left p-4 rounded-lg border border-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900">Verify Hours</p>
                  <p className="text-sm text-purple-700">Approve volunteer time submissions</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <ActivityFeed activities={recentActivity} />
      </div>

      {/* Top Volunteers */}
      {topVolunteers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Volunteers This Month</h3>
          <div className="space-y-3">
            {topVolunteers.map((volunteer, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100"
              >
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

      <ToastContainer />
    </div>
  );
}

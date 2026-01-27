'use client';

import { useState, useEffect } from 'react';
import OpportunityModal from '../../../components/opportunities/OpportunityModal';
import { useToast } from '@/app/hooks/useToast';
import { Plus, AlertTriangle, CheckCircle, Hourglass, Loader2, RefreshCw } from 'lucide-react'; // Added Lucide icons

export default function ManageOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // New state for verification checks
  const [orgProfile, setOrgProfile] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const { addToast, ToastContainer } = useToast();

  // Fetch organization profile and verification status
  const fetchOrgProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/site/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOrgProfile(data.orgProfile || null);
        setUserProfile(data.userProfile || null);
      }
    } catch (error) {
      console.error('Error fetching organization profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  // Re-fetch whenever refreshKey changes
  useEffect(() => {
    fetchOpportunities();
    fetchOrgProfile();
  }, [refreshKey]);

  // Fetch all opportunities
  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/site/opportunities', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch opportunities');

      const data = await response.json();
      setOpportunities(data.opportunities || []);
      setError('');
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      setError('Failed to load opportunities');
      addToast('Failed to load opportunities', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Check if organization can create opportunities
  const canCreateOpportunities = () => {
    return orgProfile?.verification_status === 'verified';
  };

  // Get create opportunity button state and message
  const getCreateButtonState = () => {
    if (profileLoading) {
      return { disabled: true, message: 'Checking verification status...' };
    }

    if (!userProfile?.profile_complete) {
      return { 
        disabled: true, 
        message: 'Complete your profile to post opportunities' 
      };
    }

    if (orgProfile?.verification_status === 'pending') {
      return { 
        disabled: true, 
        message: 'Verification pending - cannot post opportunities yet' 
      };
    }

    if (orgProfile?.verification_status === 'rejected') {
      return { 
        disabled: true, 
        message: 'Verification rejected - update profile and resubmit' 
      };
    }

    if (orgProfile?.verification_status === 'verified') {
      return { 
        disabled: false, 
        message: 'Create new volunteer opportunity' 
      };
    }

    // Default case (unverified)
    return { 
      disabled: true, 
      message: 'Verify your organization to post opportunities' 
    };
  };

  // Render verification banner similar to dashboard
  const renderVerificationBanner = () => {
    const profileComplete = userProfile?.profile_complete;
    const verificationStatus = orgProfile?.verification_status;

    if (!profileComplete) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 mt-0.5 text-yellow-700 flex-shrink-0" />
            <div>
              <p className="font-medium">Your profile is incomplete.</p>
              <p className="text-sm">
                Complete it to request verification and unlock posting privileges.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (verificationStatus === 'pending') {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
          <div className="flex items-start space-x-2">
            <Hourglass className="w-5 h-5 mt-0.5 text-blue-700 flex-shrink-0" />
            <div>
              <p className="font-medium">Verification Pending</p>
              <p className="text-sm">
                Your verification request is under review. You'll be able to post opportunities once verified.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (verificationStatus === 'rejected') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 mt-0.5 text-red-700 flex-shrink-0" />
            <div>
              <p className="font-medium">Verification Rejected</p>
              <p className="text-sm">
                Your organization's verification was not approved. Please update your profile and resubmit for verification.
              </p>
              {orgProfile?.rejection_reason && (
                <div className="mt-2 p-2 bg-red-100 text-red-800 rounded text-sm">
                  <strong>Reason:</strong> {orgProfile.rejection_reason}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Triggered after creating or editing
  const handleOpportunitySaved = (updatedOpportunity) => {
    setShowModal(false);
    addToast(
      updatedOpportunity.id ? 'Opportunity updated successfully!' : 'Opportunity created successfully!',
      'success'
    );
    // Force reload from DB to ensure freshness
    setRefreshKey(prev => prev + 1);
  };

  // Handle edit (fetch single record)
  const handleEditOpportunity = async (opportunityId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/site/opportunities/${opportunityId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch opportunity details');

      const data = await response.json();
      setSelectedOpportunity(data.opportunity);
      setShowModal(true);
    } catch (error) {
      console.error('Error loading opportunity for edit:', error);
      addToast('Failed to load opportunity details', 'error');
    }
  };

  // Handle delete
  const handleDeleteOpportunity = async (opportunityId) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/site/opportunities/${opportunityId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete opportunity');

      addToast('Opportunity deleted successfully!', 'success');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      addToast('Failed to delete opportunity', 'error');
    }
  };

  // Handle activate/deactivate
  const handleUpdateOpportunityStatus = async (opportunityId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/site/opportunities/${opportunityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update opportunity');

      addToast(
        `Opportunity ${newStatus === 'active' ? 'activated' : 'deactivated'}!`,
        'success'
      );
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error updating opportunity:', error);
      addToast('Failed to update opportunity', 'error');
    }
  };

  // Status badge helper
  const getStatusBadge = (status) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      draft: 'bg-yellow-100 text-yellow-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  // Handle create button
  const handleCreateOpportunity = () => {
    if (!canCreateOpportunities()) {
      addToast('Your organization must be verified to create opportunities', 'warning');
      return;
    }
    setSelectedOpportunity(null);
    setShowModal(true);
  };

  const createButtonState = getCreateButtonState();

  // Loading indicator
  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <p className="mt-2 text-gray-600">Loading opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Opportunities</h1>
          <p className="text-gray-600 mt-1">
            Create and manage your volunteer opportunities
          </p>
        </div>
        <div className="flex items-center gap-3">
        <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-100 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleCreateOpportunity}
            disabled={createButtonState.disabled}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              createButtonState.disabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            title={createButtonState.message}
          >
            <Plus className="w-4 h-4" />
            Create Opportunity
          </button>
        </div>
      </div>

      {/* Verification Banner */}
      {renderVerificationBanner()}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Table or Empty State */}
      {opportunities.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {canCreateOpportunities() ? 'No opportunities yet' : 'Opportunities'}
          </h3>
          <p className="text-gray-600 mb-4">
            {canCreateOpportunities() 
              ? 'Create your first volunteer opportunity to get started'
              : createButtonState.message
            }
          </p>
          {canCreateOpportunities() && (
            <button
              onClick={handleCreateOpportunity}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create Your First Opportunity
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opportunity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applications</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {opportunities.map((opportunity) => (
                  <tr key={opportunity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{opportunity.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{opportunity.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{opportunity.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-600 font-medium">{opportunity.application_count || 0}</span>
                        {opportunity.pending_applications > 0 && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                            {opportunity.pending_applications} pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(opportunity.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {opportunity.created_at ? new Date(opportunity.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() =>
                            handleUpdateOpportunityStatus(
                              opportunity.id,
                              opportunity.status === 'active' ? 'inactive' : 'active'
                            )
                          }
                          className={`px-3 py-1 rounded text-xs ${
                            opportunity.status === 'active'
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {opportunity.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleEditOpportunity(opportunity.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteOpportunity(opportunity.id)}
                          className="text-red-600 hover:text-red-900 text-xs px-2"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shared Modal */}
      {showModal && (
        <OpportunityModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={handleOpportunitySaved}
          opportunity={selectedOpportunity}
        />
      )}

      <ToastContainer />
    </div>
  );
}
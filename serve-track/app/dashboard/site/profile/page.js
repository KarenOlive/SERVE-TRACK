'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/app/hooks/useToast';
import ProfileForm from '@/app/components/dashboard/ProfileForm';
import { AlertTriangle, CheckCircle, Clock, Edit, MailCheck, UserCheck } from 'lucide-react';

export default function SiteProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requestingVerification, setRequestingVerification] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { addToast, ToastContainer } = useToast();

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/site/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || 'Failed to load profile', 'error');
        setProfile(null);
        return;
      }
  
      setProfile(data.profile);
    } catch (err) {
      addToast('Could not load profile. Please try again later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.target);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/site/profile', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.fromEntries(formData)),
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to save profile');
      
      addToast('Profile updated successfully', 'success');
      setShowForm(false);
      fetchProfile();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestVerification = async () => {
    setRequestingVerification(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/site/request-verification', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await res.json();
      
      if (res.ok) {
        addToast('Verification request sent successfully!', 'success');
        fetchProfile();
      } else {
        addToast(data.error || 'Failed to request verification', 'error');
      }
    } catch (err) {
      addToast('Network error. Please try again.', 'error');
    } finally {
      setRequestingVerification(false);
    }
  };

  useEffect(() => { 
    fetchProfile(); 
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">Loading profile...</div>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <UserCheck className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Pending Review';
      default:
        return 'Unverified';
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h1 className="text-2xl font-bold mb-6">Organization Profile</h1>
      
      {/* Status Alerts */}
      {profile && !profile.profile_complete && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Profile Incomplete</p>
            <p className="text-sm text-yellow-700 mt-1">
              Complete your organization profile to request verification and unlock additional features.
            </p>
          </div>
        </div>
      )}

      {profile?.verification_status === 'pending' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
          <Clock className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">Verification Pending</p>
            <p className="text-sm text-blue-700 mt-1">
              Your verification request is under review. You'll be notified once it's processed.
            </p>
          </div>
        </div>
      )}

      {profile?.verification_status === 'rejected' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Verification Rejected</p>
            <p className="text-sm text-red-700 mt-1">
              Your organization’s verification was not approved. Please review your profile information, make corrections, and resubmit a verification request.
            </p>
            {profile.rejection_reason && (
              <div className="mt-3 p-3 bg-red-100 text-red-800 rounded">
                <strong className="text-sm">Reason:</strong>
                <p className="text-sm mt-1 whitespace-pre-line">{profile.rejection_reason}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!showForm ? (
        <>
          {/* Profile Display */}
          <div className="bg-gradient-to-r from-green-50 to-white p-7 rounded-2xl border border-gray-200 shadow-sm mb-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-semibold text-gray-900 font-sans">Your Organization</h2>
              <div className="flex items-center space-x-2">
                {getStatusIcon(profile?.verification_status)}
                <span className={`font-semibold ${
                  profile?.verification_status === 'verified'
                    ? 'text-green-600'
                    : profile?.verification_status === 'pending'
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}>
                  {getStatusText(profile?.verification_status)}
                </span>
              </div>
            </div>
            
            <div className="space-y-4 text-gray-800">
              <div>
                <strong className="text-gray-700">Name:</strong>
                <p className="mt-1">{profile?.organization_name || 'Not provided'}</p>
              </div>
              <div>
                <strong className="text-gray-700">Description:</strong>
                <p className="mt-1">{profile?.organization_description || 'Not provided'}</p>
              </div>
              <div>
                <strong className="text-gray-700">Phone:</strong>
                <p className="mt-1">{profile?.contact_phone || 'Not provided'}</p>
              </div>
              <div>
                <strong className="text-gray-700">Address:</strong>
                <p className="mt-1">{profile?.address || 'Not provided'}</p>
              </div>
              <div>
                <strong className="text-gray-700">Location:</strong>
                <p className="mt-1">{profile?.location || 'Not provided'}</p>
              </div>
              <div>
                <strong className="text-gray-700">Website:</strong>
                <p className="mt-1">{profile?.website || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              {profile?.profile_complete ? 'Update Profile' : 'Complete Profile'}
            </button>

            {(profile?.verification_status === 'unverified' || profile?.verification_status === 'rejected') && profile?.profile_complete && (
              <button
                onClick={handleRequestVerification}
                disabled={requestingVerification}
                className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MailCheck className="w-4 h-4 mr-2" />
                {requestingVerification ? 'Requesting...' : 'Request Verification'}
              </button>
            )}
          </div>
        </>
      ) : (
        <ProfileForm
          profile={profile}
          onSave={handleSave}
          saving={saving}
          onCancel={() => setShowForm(false)}
        />
      )}

      <ToastContainer />
    </div>
  );
}

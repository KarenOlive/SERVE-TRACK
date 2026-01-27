'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/app/hooks/useToast';
import ProfileFormDynamic from '@/app/components/ui/ProfileFormDynamic';
import { profileSchemas } from '@/lib/profileSchemas';
import { User, Edit, Mail, Phone, MapPin, Globe, Building, Shield, User2 } from 'lucide-react';

export default function AdminProfilePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { addToast, ToastContainer } = useToast();

  // Get user from localStorage on component mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        addToast('Error loading user data', 'error');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return; // Wait until currentUser is available

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('/api/admin/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch profile');

        const data = await response.json();
        setProfile(data.profile);

        // Only fetch universities if user is a university admin
        if (currentUser.userType === 'university_admin') {
          const uniResponse = await fetch('/api/admin/universities', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (uniResponse.ok) {
            const uniData = await uniResponse.json();
            setUniversities(uniData.universities || []);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        addToast('Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser, addToast]);

  const handleSave = async (updatedProfile) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedProfile)
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const data = await response.json();
      setProfile(data.profile);
      setIsEditing(false);
      addToast('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      addToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (!currentUser || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Profile not found</p>
        </div>
      </div>
    );
  }

  // Determine the correct schema based on user type
  const getSchema = () => {
    if (currentUser.userType === 'university_admin') {
      return profileSchemas.university_admin;
    }
    return profileSchemas.admin; // Use admin schema for system admins
  };

  const schema = getSchema();

  if (isEditing) {
    return (
      <div className="max-w-2xl mx-auto">
        <ProfileFormDynamic 
          schema={schema}
          profile={profile}
          universities={currentUser.userType === 'university_admin' ? universities : []}
          onSave={handleSave}
          saving={saving}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <ProfileCard 
        profile={profile}
        userType={currentUser.userType}
        universities={universities}
        onEdit={() => setIsEditing(true)}
      />
      <ToastContainer />
    </div>
  );
}

// Profile Card Component
function ProfileCard({ profile, userType, universities, onEdit }) {
  const getUniversityName = (universityId) => {
    const university = universities.find(u => u.id === universityId);
    return university ? university.name : 'Not assigned';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 border border-gray-200 bg-opacity-20 rounded-full flex items-center justify-center">
            {userType === 'university_admin' ? <User2 className="w-8 h-8 text-white" /> :
              <Shield className="w-8 h-8 text-white" />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {profile.first_name} {profile.last_name}
              </h1>
              <p className="text-purple-200 capitalize">
                {userType === 'university_admin' ? 'University Administrator' : 'System Administrator'}
              </p>
            </div>
          </div>
          <button
            onClick={onEdit}
            className="flex items-center space-x-2 border hover:border-gray-400 text-white px-4 py-2 rounded-lg transition-all"
          >
            <Edit className="w-5 h-5" />
            <span>Update Profile</span>
          </button>
        </div>
      </div>

      {/* Profile Information */}
      <div className="p-6 space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-gray-600" />
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField label="First Name" value={profile.first_name} />
            <InfoField label="Last Name" value={profile.last_name} />
            <InfoField 
              label="Email" 
              value={profile.email} 
              icon={<Mail className="w-5 h-5" />}
            />
          </div>
        </div>

        {/* University Information (only for university admins) */}
        {userType === 'university_admin' && profile.university_id && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building className="w-5 h-5 mr-2 text-gray-600" />
              University Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField 
                label="University" 
                value={getUniversityName(profile.university_id)}
              />
            </div>
          </div>
        )}

        {/* Permissions (only for university admins) */}
        {userType === 'university_admin' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Permissions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PermissionField 
                label="Manage Students" 
                enabled={profile.can_manage_students} 
              />
              <PermissionField 
                label="Manage Nonprofits" 
                enabled={profile.can_manage_nonprofits} 
              />
              <PermissionField 
                label="Manage Admins" 
                enabled={profile.can_manage_admins} 
              />
            </div>
          </div>
        )}

        {/* Contact Information (if available) */}
        {/* {(profile.phone || profile.address) && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Phone className="w-5 h-5 mr-2 text-gray-600" />
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.phone && (
                <InfoField 
                  label="Phone" 
                  value={profile.phone} 
                  icon={<Phone className="w-4 h-4" />}
                />
              )}
              {profile.address && (
                <InfoField 
                  label="Address" 
                  value={profile.address} 
                  icon={<MapPin className="w-4 h-4" />}
                />
              )}
              {profile.website && (
                <InfoField 
                  label="Website" 
                  value={profile.website} 
                  icon={<Globe className="w-4 h-4" />}
                  isLink={true}
                />
              )}
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
}

// Helper component for info fields
function InfoField({ label, value, icon, isLink = false }) {
  return (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
      {icon && <div className="text-gray-500 mt-0.5">{icon}</div>}
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        {isLink ? (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-words"
          >
            {value}
          </a>
        ) : (
          <p className="text-gray-900 break-words">{value || 'Not provided'}</p>
        )}
      </div>
    </div>
  );
}

// Helper component for permission fields
function PermissionField({ label, enabled }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${
      enabled ? 'bg-purple-50 border border-indigo-200' : 'bg-gray-50 border border-gray-200'
    }`}>
      <span className={`font-medium ${enabled ? 'text-purple-800' : 'text-gray-600'}`}>
        {label}
      </span>
      <div className={`flex items-center space-x-1 ${
        enabled ? 'text-purple-600' : 'text-gray-400'
      }`}>
        {enabled ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </div>
  );
}
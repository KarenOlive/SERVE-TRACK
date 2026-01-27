'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/app/hooks/useToast';
import { profileSchemas } from '@/lib/profileSchemas';
import ProfileFormDynamic from '@/app/components/ui/ProfileFormDynamic';
import { User, Edit, Mail, Book, GraduationCap, Clock } from 'lucide-react';

export default function StudentProfilePage() {
  const [profile, setProfile] = useState(null);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { addToast, ToastContainer } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/student/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load profile');

      setProfile(data.profile);
      setUniversities(data.universities || []);
    } catch (err) {
      addToast(err.message || 'Error loading profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      setProfile(data.profile);
      setUniversities(data.universities || []);
      setIsEditing(false);
      addToast('Profile updated successfully', 'success');

    } catch (err) {
      addToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (loading) {
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

  if (isEditing) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <ProfileFormDynamic
          schema={profileSchemas.student}
          profile={profile}
          universities={universities}
          onSave={handleSave}
          saving={saving}
          onCancel={handleCancel}
        />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <ProfileCard 
        profile={profile}
        universities={universities}
        onEdit={() => setIsEditing(true)}
      />
      <ToastContainer />
    </div>
  );
}

// Profile Card Component for Students
function ProfileCard({ profile, universities, onEdit }) {
  const getUniversityName = (universityId) => {
    const university = universities.find(u => u.id === universityId);
    return university ? university.name : 'Not assigned';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 border border-gray-200 bg-opacity-20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {profile.first_name} {profile.last_name}
              </h1>
              <p className="text-blue-200">Student</p>
            </div>
          </div>
          <button
            onClick={onEdit}
            className="flex items-center space-x-2 border hover:border-gray-400 text-white px-4 py-2 rounded-lg transition-all"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
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
            <InfoField 
              label="Student ID" 
              value={profile.student_id} 
              icon={<Book className="w-5 h-5" />}
            />
          </div>
        </div>

        {/* Academic Information */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <GraduationCap className="w-5 h-5 mr-2 text-gray-600" />
            Academic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField 
              label="University" 
              value={getUniversityName(profile.university_id)}
            />
            <InfoField 
              label="Major" 
              value={profile.major || 'Not specified'}
            />
          </div>
        </div>

        {/* Service Hours */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-600" />
            Service Hours
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <p className="text-sm font-medium text-blue-800">Total Verified Hours</p>
                <p className="text-2xl font-bold text-blue-900">
                  {profile.total_verified_hours || 0}
                </p>
              </div>
              <div className="text-blue-600">
                <Clock className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
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
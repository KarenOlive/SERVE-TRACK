/* File: app/dashboard/admin/users/page.js */
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/app/hooks/useToast';
import UserFormModal from '@/app/components/admin/UserFormModal';
import { Users, UserPlus, Key, Edit, Trash2, Shield, Building, ShieldCheck, UserCog, Loader2, GraduationCap } from 'lucide-react';

export default function AdminUsers() {
  const [admins, setAdmins] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [resettingPasswordId, setResettingPasswordId] = useState(null);

  const { addToast, ToastContainer } = useToast();

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/admin-users', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch admins');
      setAdmins(data.admins || []);
      setUniversities(data.universities || []);
    } catch (err) {
      addToast(err.message || 'Error fetching admins', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleModalSubmit = async (formData) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = selectedAdmin ? `/api/admin/admin-users/${selectedAdmin.id}` : '/api/admin/admin-users';
      const method = selectedAdmin ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${selectedAdmin ? 'update' : 'create'} admin`);
      }

      addToast(
        data.message || `Admin ${selectedAdmin ? 'updated' : 'created'} successfully`, 
        'success'
      );
      setShowModal(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (err) {
      addToast(err.message || `Failed to ${selectedAdmin ? 'update' : 'create'} admin`, 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (adminId, adminName) => {
    const newPassword = prompt(`Enter new password for ${adminName} (min 8 characters):`);
    if (!newPassword) return;
    
    if (newPassword.length < 8) {
      addToast('Password must be at least 8 characters', 'error');
      return;
    }

    setResettingPasswordId(adminId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/admin-users/password-reset', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          userId: adminId, 
          newPassword 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      addToast('Password reset successfully', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to reset password', 'error');
    } finally {
      setResettingPasswordId(null);
    }
  };

  useEffect(() => { 
    fetchAdmins(); 
  }, []);

  // Separate admins by type
  const systemAdmins = admins.filter(admin => admin.role === 'admin');
  const universityAdmins = admins.filter(admin => admin.role === 'university_admin');

  // Fix the permission display - convert numbers to booleans
  const getBooleanPermission = (value) => {
    return Boolean(Number(value));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="ml-2 text-gray-600">Loading admins...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Users Management</h1>
          <p className="text-gray-600 mt-1">Manage system and university administrators</p>
        </div>
        <button 
          onClick={() => { 
            setSelectedAdmin(null); 
            setShowModal(true); 
          }} 
          className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-purple-700 transition-colors disabled:opacity-50"
          disabled={actionLoading}
        >
          <UserPlus className="w-4 h-4 mr-2" /> 
          {actionLoading ? 'Loading...' : 'Add Admin'}
        </button>
      </div>

      {/* System Admins Section */}
      {systemAdmins.length >= 0 && (
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-800">System Administrators</h2>
          <span className="bg-purple-100 text-purple-800 text-sm px-2 py-1 rounded-full">
            {systemAdmins.length}
          </span>
        </div>

        {systemAdmins.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No system administrators found</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {systemAdmins.map(admin => (
              <div key={admin.id} className="flex justify-between items-center px-6 py-4 border-b hover:bg-gray-50 last:border-b-0">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{admin.first_name} {admin.last_name}</p>
                    <p className="text-sm text-gray-500">{admin.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => { 
                      setSelectedAdmin(admin); 
                      setShowModal(true); 
                    }} 
                    className="flex items-center space-x-1 text-purple-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
                    disabled={actionLoading}
                  >
                    <Edit className="w-4 h-4 hover:text-blue-800" />
                    <span>Edit</span>
                  </button>
                  <button 
                    onClick={() => handleResetPassword(admin.id, `${admin.first_name} ${admin.last_name}`)} 
                    className="flex items-center space-x-1 text-yellow-600 hover:text-yellow-800 disabled:opacity-50 transition-colors"
                    disabled={resettingPasswordId === admin.id || actionLoading}
                  >
                    {resettingPasswordId === admin.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Key className="w-4 h-4" />
                    )}
                    <span>Reset Password</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      )}

      {/* University Admins Section */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <GraduationCap className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">University Administrators</h2>
          <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
            {universityAdmins.length}
          </span>
        </div>

        {universityAdmins.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No university administrators found</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Admin</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">University</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Permissions</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {universityAdmins.map(admin => (
                    <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{admin.first_name} {admin.last_name}</p>
                          <p className="text-sm text-gray-500">{admin.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{admin.university_name || 'No university'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-2">
                          {getBooleanPermission(admin.can_manage_students) && (
                            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              <UserCog className="w-3 h-3 mr-1" />
                              Students
                            </span>
                          )}
                          {getBooleanPermission(admin.can_manage_nonprofits) && (
                            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              <Building className="w-3 h-3 mr-1" />
                              Nonprofits
                            </span>
                          )}
                          {getBooleanPermission(admin.can_manage_admins) && (
                            <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              Admins
                            </span>
                          )}
                          {!getBooleanPermission(admin.can_manage_students) && 
                           !getBooleanPermission(admin.can_manage_nonprofits) && 
                           !getBooleanPermission(admin.can_manage_admins) && (
                            <span className="text-xs text-gray-500 italic">No permissions</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-center space-x-3">
                          <button 
                            onClick={() => { 
                              setSelectedAdmin(admin); 
                              setShowModal(true); 
                            }} 
                            className="flex items-center space-x-1 text-purple-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
                            disabled={actionLoading}
                            title="Edit Admin"
                          >
                            <Edit className="w-4 h-4" />
                            <span className="sr-only sm:not-sr-only sm:inline">Edit</span>
                          </button>
                          <button 
                            onClick={() => handleResetPassword(admin.id, `${admin.first_name} ${admin.last_name}`)} 
                            className="flex items-center space-x-1 text-yellow-600 hover:text-yellow-800 disabled:opacity-50 transition-colors"
                            disabled={resettingPasswordId === admin.id || actionLoading}
                            title="Reset Password"
                          >
                            {resettingPasswordId === admin.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Key className="w-4 h-4" />
                            )}
                            <span className="sr-only sm:not-sr-only sm:inline">Reset</span>
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
      </section>

      <UserFormModal
        show={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedAdmin(null);
        }}
        onSubmit={handleModalSubmit}
        initialData={selectedAdmin}
        universities={universities}
      />

      <ToastContainer />
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/app/hooks/useToast';
import { 
  Plus, 
  Users, 
  Trash2, 
  UserPlus, 
  Building, 
  Key, 
  Shield,
  ShieldCheck,
  UserCog 
} from 'lucide-react';

export default function AdminUsers() {
  const [admins, setAdmins] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { addToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'admin', // 'admin' or 'university_admin'
    universityId: '',
    permissions: {
      can_manage_nonprofits: true,
      can_manage_students: true,
      can_manage_admins: false
    }
  });

  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error('Failed to fetch admins');
      
      const data = await res.json();
      setAdmins(data.admins || []);
      setUniversities(data.universities || []);
    } catch (err) {
      addToast('Failed to load admin users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/admin-users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        addToast(data.message, 'success');
        setShowCreateForm(false);
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          role: 'admin',
          universityId: '',
          permissions: {
            can_manage_nonprofits: true,
            can_manage_students: true,
            can_manage_admins: false
          }
        });
        fetchAdmins();
      } else {
        addToast(data.error || 'Failed to create admin user', 'error');
      }
    } catch (err) {
      addToast('Network error. Please try again.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }

    if (resetPasswordData.newPassword.length < 8) {
      addToast('Password must be at least 8 characters long', 'error');
      return;
    }

    setResetting(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/users/reset-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: selectedAdmin.id,
          newPassword: resetPasswordData.newPassword
        }),
      });

      const data = await res.json();

      if (res.ok) {
        addToast('Password reset successfully', 'success');
        setShowResetPassword(false);
        setSelectedAdmin(null);
        setResetPasswordData({
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        addToast(data.error || 'Failed to reset password', 'error');
      }
    } catch (err) {
      addToast('Network error. Please try again.', 'error');
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">Loading admin users...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Users Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Admin
        </button>
      </div>

      {/* Create Admin Form */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create New Admin</h2>
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temporary Password *
              </label>
              <input
                type="password"
                required
                minLength="8"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Minimum 8 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Role *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={formData.role === 'admin'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value, universityId: '' })}
                    className="mr-3"
                  />
                  <Shield className="w-5 h-5 text-purple-600 mr-2" />
                  <div>
                    <p className="font-medium">System Administrator</p>
                    <p className="text-sm text-gray-500">Full system access</p>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="role"
                    value="university_admin"
                    checked={formData.role === 'university_admin'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="mr-3"
                  />
                  <Building className="w-5 h-5 text-blue-600 mr-2" />
                  <div>
                    <p className="font-medium">University Administrator</p>
                    <p className="text-sm text-gray-500">Limited to specific university</p>
                  </div>
                </label>
              </div>
            </div>

            {formData.role === 'university_admin' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign University *
                  </label>
                  <select
                    required
                    value={formData.universityId}
                    onChange={(e) => setFormData({ ...formData, universityId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a university</option>
                    {universities.map((university) => (
                      <option key={university.id} value={university.id}>
                        {university.name} ({university.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Permissions
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.permissions.can_manage_students}
                        onChange={(e) => setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            can_manage_students: e.target.checked
                          }
                        })}
                        className="mr-3"
                      />
                      <UserCog className="w-4 h-4 text-green-600 mr-2" />
                      Can manage students
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.permissions.can_manage_nonprofits}
                        onChange={(e) => setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            can_manage_nonprofits: e.target.checked
                          }
                        })}
                        className="mr-3"
                      />
                      <Building className="w-4 h-4 text-orange-600 mr-2" />
                      Can manage nonprofits
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.permissions.can_manage_admins}
                        onChange={(e) => setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            can_manage_admins: e.target.checked
                          }
                        })}
                        className="mr-3"
                      />
                      <ShieldCheck className="w-4 h-4 text-red-600 mr-2" />
                      Can manage other university admins
                    </label>
                  </div>
                </div>
              </>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={creating}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Admin'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPassword && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Key className="w-5 h-5 mr-2 text-yellow-600" />
              Reset Password for {selectedAdmin.first_name} {selectedAdmin.last_name}
            </h3>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  minLength="8"
                  value={resetPasswordData.newPassword}
                  onChange={(e) => setResetPasswordData({
                    ...resetPasswordData,
                    newPassword: e.target.value
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  value={resetPasswordData.confirmPassword}
                  onChange={(e) => setResetPasswordData({
                    ...resetPasswordData,
                    confirmPassword: e.target.value
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm the password"
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={resetting}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {resetting ? 'Resetting...' : 'Reset Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetPassword(false);
                    setSelectedAdmin(null);
                    setResetPasswordData({ newPassword: '', confirmPassword: '' });
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Users List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center">
            <Users className="w-5 h-5 mr-2" />
            System & University Administrators ({admins.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {admins.map((admin) => (
            <div key={admin.id} className="px-6 py-4 flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  {admin.role === 'admin' ? (
                    <Shield className="w-5 h-5 text-purple-600" />
                  ) : (
                    <Building className="w-5 h-5 text-blue-600" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {admin.first_name} {admin.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{admin.email}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        admin.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {admin.role === 'admin' ? 'System Admin' : 'University Admin'}
                      </span>
                      {admin.role === 'university_admin' && admin.university_name && (
                        <span className="text-sm text-gray-600">
                          {admin.university_name}
                        </span>
                      )}
                    </div>
                    {admin.role === 'university_admin' && (
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        {admin.can_manage_students && (
                          <span className="flex items-center">
                            <UserCog className="w-3 h-3 mr-1" />
                            Students
                          </span>
                        )}
                        {admin.can_manage_nonprofits && (
                          <span className="flex items-center">
                            <Building className="w-3 h-3 mr-1" />
                            Nonprofits
                          </span>
                        )}
                        {admin.can_manage_admins && (
                          <span className="flex items-center">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Admins
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedAdmin(admin);
                    setShowResetPassword(true);
                  }}
                  className="flex items-center text-yellow-600 hover:text-yellow-800 p-2 rounded-lg hover:bg-yellow-50 transition-colors"
                  title="Reset Password"
                >
                  <Key className="w-4 h-4" />
                </button>
                <button
                  className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                  title="Remove Admin"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
/* File: components/UserFormModal.jsx */

'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/app/hooks/useToast';

export default function UserFormModal({ show, onClose, onSubmit, initialData = null, universities = [] }) {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'admin',
    universityId: '',
    permissions: {
      can_manage_students: true,
      can_manage_nonprofits: true,
      can_manage_admins: false
    }
  });

  const [submitting, setSubmitting] = useState(false);

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (initialData && initialData.id) {
      // Editing existing admin
      setFormData({
        firstName: initialData.first_name || '',
        lastName: initialData.last_name || '',
        email: initialData.email || '',
        password: '', // Don't pre-fill password for security
        role: initialData.role || 'admin',
        universityId: initialData.university_id || '',
        permissions: {
          can_manage_students: Boolean(initialData.can_manage_students),
          can_manage_nonprofits: Boolean(initialData.can_manage_nonprofits),
          can_manage_admins: Boolean(initialData.can_manage_admins)
        }
      });
    } else {
      // Creating new admin - reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'admin',
        universityId: '',
        permissions: {
          can_manage_students: true,
          can_manage_nonprofits: true,
          can_manage_admins: false
        }
      });
    }
  }, [initialData, show]); // Added show to dependencies to reset when modal reopens

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
      addToast('Please fill all required fields', 'error');
      return;
    }

    if (!formData.email.includes('@')) {
      addToast('Invalid email', 'error');
      return;
    }

    if (formData.role === 'university_admin' && !formData.universityId) {
      addToast('Please select a university', 'error');
      return;
    }

    // Only require password for new admins, not when editing
    const isNewAdmin = !initialData || !initialData.id;
    if (isNewAdmin && formData.password.length < 8) {
      addToast('Password must be at least 8 characters', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      addToast(isNewAdmin ? 'Admin created successfully' : 'Admin updated successfully', 'success');
      onClose();
    } catch (err) {
      addToast(err.message || 'Failed to submit', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isNewAdmin = !initialData || !initialData.id;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h3 className="text-lg font-semibold mb-4">
          {isNewAdmin ? 'Create Admin' : 'Update Admin'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="First Name" 
              value={formData.firstName} 
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} 
              className="border rounded p-2 w-full" 
              required 
            />
            <input 
              type="text" 
              placeholder="Last Name" 
              value={formData.lastName} 
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} 
              className="border rounded p-2 w-full" 
              required 
            />
          </div>
          <input 
            type="email" 
            placeholder="Email" 
            value={formData.email} 
            onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
            className="border rounded p-2 w-full" 
            required 
          />

          {isNewAdmin && (
            <input 
              type="password" 
              placeholder="Temporary Password" 
              value={formData.password} 
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
              className="border rounded p-2 w-full" 
              required 
              minLength={8}
            />
          )}

          <select 
            value={formData.role} 
            onChange={(e) => setFormData({ ...formData, role: e.target.value, universityId: '' })} // Reset university when role changes
            className="border rounded p-2 w-full"
          >
            <option value="admin">System Admin</option>
            <option value="university_admin">University Admin</option>
          </select>

          {formData.role === 'university_admin' && (
            <select 
              value={formData.universityId} 
              onChange={(e) => setFormData({ ...formData, universityId: e.target.value })} 
              className="border rounded p-2 w-full"
              required
            >
              <option value="">Select University</option>
              {universities.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.code})
                </option>
              ))}
            </select>
          )}

          {formData.role === 'university_admin' && (
            <div className="space-y-2 p-3 bg-gray-50 rounded">
              <h4 className="font-medium text-sm text-gray-700">Permissions</h4>
              <label className="flex items-center space-x-2">
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
                /> 
                <span>Can manage students</span>
              </label>
              <label className="flex items-center space-x-2">
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
                /> 
                <span>Can manage nonprofits</span>
              </label>
              <label className="flex items-center space-x-2">
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
                /> 
                <span>Can manage admins</span>
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <button 
              type="button" 
              onClick={onClose} 
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting} 
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting...' : (isNewAdmin ? 'Create' : 'Update')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
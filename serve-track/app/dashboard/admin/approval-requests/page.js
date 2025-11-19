'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Search, Loader2, AlertTriangle, Bell, Users, Edit } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import AdminRejectVerificationModal from '../../../components/admin/AdminRejectVerificationModal';

export default function VerificationRequestsPage() {
  const [allOrganizations, setAllOrganizations] = useState([]);
  const [pendingNotifications, setPendingNotifications] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'all'
  const [rejectModal, setRejectModal] = useState({ open: false, org: null });
  const [editModal, setEditModal] = useState({ open: false, org: null, action: null });
  const { addToast, ToastContainer } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch all organizations and admin notifications
      const [orgsRes, notificationsRes] = await Promise.all([
        fetch('/api/admin/approval-requests', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/admin/notifications', {
          headers: { 'Authorization': `Bearer ${token}` },
        })
      ]);

      if (!orgsRes.ok || !notificationsRes.ok) {
        throw new Error('Failed to load data');
      }

      const orgsData = await orgsRes.json();
      const notificationsData = await notificationsRes.json();

      setAllOrganizations(orgsData.requests);
      setPendingNotifications(notificationsData.notifications || []);
      setFiltered(orgsData.requests.filter(org => org.verification_status === 'pending'));
    } catch (error) {
      console.error(error);
      addToast('Failed to load verification data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let dataToFilter = activeTab === 'pending' 
      ? allOrganizations.filter(org => org.verification_status === 'pending')
      : allOrganizations;

    const term = search.toLowerCase();
    setFiltered(
      dataToFilter.filter(
        (org) =>
          org.organization_name?.toLowerCase().includes(term) ||
          org.email?.toLowerCase().includes(term)
      )
    );
  }, [search, allOrganizations, activeTab]);

  const handleApprove = async (org) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/approval-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          user_id: org.user_id || null,
          profile_id: org.profile_id || null,
          action: 'approve' 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      // mark notification read if exists (best effort)
      const notification = pendingNotifications.find(n => n.entity_id === org.user_id || n.entity_id === org.profile_id);
      if (notification) {
        await fetch(`/api/admin/notifications/${notification.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: 'approve', profile_id: org.profile_id || null, entityId: notification.entity_id }),
        });
      }

      addToast('Verification approved', 'success');
      fetchData();
    } catch (error) {
      console.error(error);
      addToast('Failed to process request', 'error');
    }
  };

  const openRejectModal = (org) => {
    setRejectModal({ open: true, org });
  };

  const handleRejectConfirm = async ({ rejection_reason }) => {
    const org = rejectModal.org;
    if (!org) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/approval-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          user_id: org.user_id || null,
          profile_id: org.profile_id || null,
          action: 'reject',
          rejection_reason
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      // Also mark related notification read if exists
      const notification = pendingNotifications.find(n => n.entity_id === org.user_id || n.entity_id === org.profile_id);
      if (notification) {
        await fetch(`/api/admin/notifications/${notification.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: 'reject', profile_id: org.profile_id || null, entityId: notification.entity_id, rejection_reason }),
        });
      }

      addToast('Verification rejected', 'success');
      fetchData();
    } catch (error) {
      console.error(error);
      addToast('Failed to process request', 'error');
    } finally {
      setRejectModal({ open: false, org: null });
    }
  };

  // New function to handle status changes
  const handleStatusChange = async (org, newStatus, rejectionReason = null) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/approval-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          user_id: org.user_id || null,
          profile_id: org.profile_id || null,
          action: newStatus === 'verified' ? 'approve' : newStatus,
          rejection_reason: rejectionReason
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      addToast(`Status updated to ${newStatus}`, 'success');
      fetchData();
    } catch (error) {
      console.error(error);
      addToast('Failed to update status', 'error');
    } finally {
      setEditModal({ open: false, org: null, action: null });
    }
  };

  // Open edit modal with specific action
  const openEditModal = (org, action) => {
    setEditModal({ open: true, org, action });
  };

  // Handle edit modal actions
  const handleEditAction = () => {
    const { org, action } = editModal;
    
    if (action === 'pending') {
      handleStatusChange(org, 'pending');
    } else if (action === 'reject') {
      setRejectModal({ open: true, org });
      setEditModal({ open: false, org: null, action: null });
    } else if (action === 'verified') {
      handleStatusChange(org, 'verified');
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="ml-2 text-gray-600">Loading verification requests...</p>
      </div>
    );
  }

  const pendingCount = allOrganizations.filter(org => org.verification_status === 'pending').length;

  return (
    <div className="space-y-6 p-4">
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Organization Verification</h1>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizations..."
            className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Bell className="w-4 h-4 mr-2" />
            Pending Requests
            {pendingCount > 0 && (
              <span className="ml-2 bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            All Organizations
          </button>
        </nav>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center bg-gray-50 rounded-lg">
          <AlertTriangle className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-600">
            {activeTab === 'pending' 
              ? 'No pending verification requests'
              : 'No organizations found'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Scrollable table container */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700 whitespace-nowrap">Organization</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700 whitespace-nowrap">Email</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700 whitespace-nowrap">Location</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700 whitespace-nowrap">Website</th>
                  <th className="text-center p-3 text-sm font-semibold text-gray-700 whitespace-nowrap">Status</th>
                  <th className="text-center p-3 text-sm font-semibold text-gray-700 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((org) => (
                  <tr key={org.user_id || org.profile_id} className="border-t hover:bg-gray-50 transition">
                    <td className="p-3 font-medium text-gray-900 whitespace-nowrap">{org.organization_name}</td>
                    <td className="p-3 text-gray-600 whitespace-nowrap">{org.email}</td>
                    <td className="p-3 text-gray-600 whitespace-nowrap">{org.location}</td>
                    <td className="p-3 text-blue-600 hover:underline whitespace-nowrap">
                      {org.website ? (
                        <a href={org.website} target="_blank" rel="noopener noreferrer" className="truncate block max-w-[150px]">
                          {org.website}
                        </a>
                      ) : (
                        <span className="text-gray-400">Not provided</span>
                      )}
                    </td>
                    <td className="text-center p-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          org.verification_status === 'verified'
                            ? 'bg-green-100 text-green-700'
                            : org.verification_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {org.verification_status}
                      </span>
                    </td>
                    <td className="text-center p-3 whitespace-nowrap">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                        {org.verification_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(org)}
                              className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              <span className="hidden sm:inline">Approve</span>
                            </button>
                            <button
                              onClick={() => openRejectModal(org)}
                              className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              <span className="hidden sm:inline">Reject</span>
                            </button>
                          </>
                        )}
                        {/* Edit Action Dropdown */}
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              document.getElementById(`edit-menu-${org.user_id}`)?.classList.toggle('hidden');
                            }}
                            className="inline-flex items-center p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          {/* Edit Dropdown Menu */}
                          <div
                            id={`edit-menu-${org.user_id}`}
                            className="hidden absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                          >
                            <div className="py-1">
                              {/* Set to Pending */}
                              <button
                                onClick={() => openEditModal(org, 'pending')}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700"
                              >
                                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                                Set to Pending
                              </button>
                              
                              {/* Set to Verified */}
                              <button
                                onClick={() => openEditModal(org, 'verified')}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700"
                              >
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                                Set to Verified
                              </button>
                              
                              {/* Set to Rejected */}
                              <button
                                onClick={() => openEditModal(org, 'reject')}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700"
                              >
                                <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                                Set to Rejected
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Confirmation Modal */}
      {editModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Status Change
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to change <strong>{editModal.org?.organization_name}</strong>'s status to{' '}
              <strong>{editModal.action === 'verified' ? 'verified' : editModal.action === 'pending' ? 'pending' : 'rejected'}</strong>?
            </p>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setEditModal({ open: false, org: null, action: null })}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditAction}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  editModal.action === 'verified' 
                    ? 'bg-green-600 hover:bg-green-700'
                    : editModal.action === 'pending'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close dropdowns when clicking outside */}
      <div 
        className="fixed inset-0 z-0 hidden"
        onClick={() => {
          document.querySelectorAll('[id^="edit-menu-"]').forEach(menu => {
            menu.classList.add('hidden');
          });
        }}
      />

      <AdminRejectVerificationModal
        isOpen={rejectModal.open}
        defaultReason={rejectModal.org?.rejection_reason || ''}
        onClose={() => setRejectModal({ open: false, org: null })}
        onConfirm={handleRejectConfirm}
      />

      <ToastContainer />
    </div>
  );
}

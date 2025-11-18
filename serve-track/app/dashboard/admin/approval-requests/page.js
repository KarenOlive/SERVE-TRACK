'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Search, Loader2, AlertTriangle, Bell, Users } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import AdminRejectModal from '../../../components/admin/AdminRejectModal';

export default function VerificationRequestsPage() {
  const [allOrganizations, setAllOrganizations] = useState([]);
  const [pendingNotifications, setPendingNotifications] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'all'
  const [rejectModal, setRejectModal] = useState({ open: false, org: null });
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
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Organization Verification</h1>
        <div className="relative w-64">
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
          <table className="w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Organization</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Email</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Location</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Website</th>
                <th className="text-center p-3 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-center p-3 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((org) => (
                <tr key={org.user_id || org.profile_id} className="border-t hover:bg-gray-50 transition">
                  <td className="p-3 font-medium text-gray-900">{org.organization_name}</td>
                  <td className="p-3 text-gray-600">{org.email}</td>
                  <td className="p-3 text-gray-600">{org.location}</td>
                  <td className="p-3 text-blue-600 hover:underline">
                    {org.website ? (
                      <a href={org.website} target="_blank" rel="noopener noreferrer">
                        {org.website}
                      </a>
                    ) : (
                      <span className="text-gray-400">Not provided</span>
                    )}
                  </td>
                  <td className="text-center p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
                  <td className="text-center p-3 space-x-2">
                    {org.verification_status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(org)}
                          className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectModal(org)}
                          className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </button>
                      </>
                    )}
                    {org.verification_status !== 'pending' && (
                      <span className="text-gray-400 text-sm">No actions available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminRejectModal
        isOpen={rejectModal.open}
        defaultReason={rejectModal.org?.rejection_reason || ''}
        onClose={() => setRejectModal({ open: false, org: null })}
        onConfirm={handleRejectConfirm}
      />

      <ToastContainer />
    </div>
  );
}

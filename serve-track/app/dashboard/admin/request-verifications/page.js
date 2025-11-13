'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Search, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '../../../../hooks/useToast';

export default function VerificationRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToast, ToastContainer } = useToast();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/verification-requests', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to load verification requests');
      const data = await res.json();
      setRequests(data.requests);
      setFiltered(data.requests);
    } catch (error) {
      console.error(error);
      addToast('Failed to load verification requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    const term = search.toLowerCase();
    setFiltered(
      requests.filter(
        (r) =>
          r.organization_name?.toLowerCase().includes(term) ||
          r.email?.toLowerCase().includes(term)
      )
    );
  }, [search, requests]);

  const handleAction = async (user_id, action) => {
    try {
      const res = await fetch('/api/admin/verification-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ user_id, action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      addToast(
        `Verification ${action === 'approve' ? 'approved' : 'rejected'} successfully!`,
        'success'
      );
      fetchRequests();
    } catch (error) {
      console.error(error);
      addToast('Failed to process request', 'error');
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

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertTriangle className="w-8 h-8 text-gray-500 mb-2" />
        <p className="text-gray-600">No verification requests available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Verification Requests</h1>
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
              <tr key={org.user_id} className="border-t hover:bg-gray-50 transition">
                <td className="p-3 font-medium text-gray-900">{org.organization_name}</td>
                <td className="p-3 text-gray-600">{org.email}</td>
                <td className="p-3 text-gray-600">{org.location}</td>
                <td className="p-3 text-blue-600 hover:underline">
                  <a href={org.website} target="_blank" rel="noopener noreferrer">
                    {org.website}
                  </a>
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
                  <button
                    onClick={() => handleAction(org.user_id, 'approve')}
                    disabled={org.verification_status === 'verified'}
                    className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(org.user_id, 'reject')}
                    disabled={org.verification_status === 'rejected'}
                    className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ToastContainer />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useToast } from '../../../hooks/useToast';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const { addToast, ToastContainer } = useToast();
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [selectedStatus]);

  const fetchApplications = async (isRefresh = false) => {
    try {
      if (isRefresh) setReloading(true);
      else setLoading(true);
  
      const token = localStorage.getItem('token');
      const url = selectedStatus 
        ? `/api/site/applications?status=${selectedStatus}`
        : '/api/site/applications';
  
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
  
      const data = await response.json();
      setApplications(data.applications || []);
      setCounts(data.counts || {});
    } catch (error) {
      console.error('Error fetching applications:', error);
      addToast('Failed to load applications', 'error');
    } finally {
      if (isRefresh) setReloading(false);
      else setLoading(false);
    }
  };
  

  const handleApplicationAction = async (applicationId, action, rejectionReason = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/site/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: action,
          rejectionReason: action === 'rejected' ? rejectionReason : null
        })
      });
  
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} application`);
      }
  
      const updatedApp = data.application;
  
      // Instantly remove from current tab if moved to another status
      setApplications(prev =>
        updatedApp.status !== selectedStatus
          ? prev.filter(app => app.id !== updatedApp.id)
          : prev.map(app =>
              app.id === updatedApp.id
                ? { ...app, status: updatedApp.status, rejection_reason: updatedApp.rejection_reason }
                : app
            )
      );
  
      // Update counts
      setCounts(prev => {
        const updated = { ...prev };
        if (updated[selectedStatus] > 0) updated[selectedStatus] -= 1;
        updated[action] = (updated[action] || 0) + 1;
        return updated;
      });
  
      //Trigger re-fetch from backend to ensure UI stays in sync
      fetchApplications(true); // Smooth refresh after approve/reject
  
      addToast(`Application ${action} successfully!`, 'success');
    } catch (error) {
      console.error('Error updating application:', error);
      addToast(`Failed to ${action} application`, 'error');
    }
  };
  

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600 mt-1">
            Review and manage volunteer applications
          </p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex space-x-4">
          {['pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === status
                  ? 'bg-green-600 text-black'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} 
              <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
                {counts[status] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-4xl mb-4">
            {selectedStatus === 'pending' ? '📨' : 
             selectedStatus === 'approved' ? '✅' : '❌'}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {selectedStatus} applications
          </h3>
          <p className="text-gray-600">
            {selectedStatus === 'pending' 
              ? 'When students apply to your opportunities, they will appear here.' 
              : `You haven't ${selectedStatus} any applications yet.`}
          </p>
        </div>
      ) : (
        <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {reloading && (
              <div className="absolute inset-0 bg-white bg-opacity-60 flex flex-col items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <p className="text-sm text-gray-700 mt-2">Refreshing applications...</p>
              </div>
            )}

            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opportunity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    University
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {application.first_name} {application.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{application.email}</div>
                        {application.student_id && (
                          <div className="text-xs text-gray-400">ID: {application.student_id}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {application.opportunity_title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {application.university_name || 'Not specified'}
                      {application.major && (
                        <div className="text-xs text-gray-400">{application.major}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(application.applied_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(application.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {application.status === 'pending' && (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleApplicationAction(application.id, 'approved')}
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Please provide a reason for rejection:');
                              if (reason) {
                                handleApplicationAction(application.id, 'rejected', reason);
                              }
                            }}
                            className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {application.status !== 'pending' && (
                        <span className="text-gray-400 text-xs">No actions available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
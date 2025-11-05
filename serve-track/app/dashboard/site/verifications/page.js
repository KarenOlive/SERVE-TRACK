'use client';

import { useState, useEffect } from 'react';
import { useToast } from '../../../hooks/useToast';

export default function VerificationPage() {
  const [hourLogs, setHourLogs] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const { addToast, ToastContainer } = useToast();

  useEffect(() => {
    fetchHourLogs();
  }, [selectedStatus]);

  const fetchHourLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = `/api/site/verification?status=${selectedStatus}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch hour logs');
      }

      const data = await response.json();
      setHourLogs(data.hourLogs || []);
      setCounts(data.counts || {});
    } catch (error) {
      console.error('Error fetching hour logs:', error);
      addToast('Failed to load hour logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationAction = async (hourLogId, action, rejectionReason = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/site/verification/${hourLogId}`, {
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

      if (!response.ok) {
        throw new Error(`Failed to ${action} hours`);
      }

      setHourLogs(prev => prev.filter(log => log.id !== hourLogId));
      addToast(`Hours ${action} successfully!`, 'success');
      
      // Update counts
      setCounts(prev => ({
        ...prev,
        [selectedStatus]: (prev[selectedStatus] || 1) - 1,
        [action]: (prev[action] || 0) + 1
      }));
    } catch (error) {
      console.error('Error updating hour log:', error);
      addToast(`Failed to ${action} hours`, 'error');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
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
          <p className="mt-2 text-gray-600">Loading verification queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hour Verification</h1>
          <p className="text-gray-600 mt-1">
            Verify or reject hours submitted by volunteers
          </p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex space-x-4">
          {['pending', 'verified', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === status
                  ? 'bg-green-600 text-grey'
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

      {/* Hour Logs List */}
      {hourLogs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-4xl mb-4">
            {selectedStatus === 'pending' ? '⏱️' : 
             selectedStatus === 'verified' ? '✅' : '❌'}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {selectedStatus} hour submissions
          </h3>
          <p className="text-gray-600">
            {selectedStatus === 'pending' 
              ? 'When volunteers log hours for your opportunities, they will appear here for verification.' 
              : `You haven't ${selectedStatus} any hour submissions yet.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volunteer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opportunity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours & Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
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
                {hourLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {log.first_name} {log.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{log.email}</div>
                        {log.university_name && (
                          <div className="text-xs text-gray-400">{log.university_name}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.opportunity_title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="font-semibold text-green-600">{log.hours} hours</div>
                      <div className="text-xs text-gray-400">
                        {new Date(log.date_worked).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {log.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {log.status === 'pending' && (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleVerificationAction(log.id, 'verified')}
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Please provide a reason for rejection:');
                              if (reason) {
                                handleVerificationAction(log.id, 'rejected', reason);
                              }
                            }}
                            className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {log.status !== 'pending' && (
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
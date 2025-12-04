'use client';

import { useState, useEffect } from 'react';
import { useToast } from '../../../hooks/useToast';
import { 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Building,
  Clock,
  User,
  ArrowUpDown,
  X,
  Briefcase,
  Clipboard,
  Stamp, Hourglass
} from 'lucide-react';
export default function VerificationPage() {
  const [hourLogs, setHourLogs] = useState([]);
  const [counts, setCounts] = useState({});
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [filters, setFilters] = useState({
    university: '',
    timeRange: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  });
  const { addToast, ToastContainer } = useToast();

  useEffect(() => {
    fetchHourLogs();
  }, [selectedStatus, filters, pagination.currentPage]);

  const fetchHourLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        status: selectedStatus,
        university: filters.university,
        timeRange: filters.timeRange,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: pagination.currentPage,
        limit: 10
      }).toString();
      const url = `/api/site/verification?${queryParams}`;

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
      setUniversities(data.universities || []);
      setPagination(data.pagination || {});
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
      // Refresh data to update pagination
      fetchHourLogs();
    } 
    catch (error) {
      console.error('Error updating hour log:', error);
      addToast(`Failed to ${action} hours`, 'error');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
  };

  const handleSort = (field) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[status] || 'bg-gray-100'}`}>
      {status === 'pending' && <Hourglass className="w-3 h-3 mr-1" />}
      {status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
      {status === 'rejected' && <X className="w-3 h-3 mr-1" />}
      {status}
    </span>
    );
  };

  const getSortIcon = (field) => {
    if (filters.sortBy !== field) return <ArrowUpDown className="w-4 h-4" />;
    return filters.sortOrder === 'asc' ? '↑' : '↓';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
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
              onClick={() => {
                setSelectedStatus(status);
                setPagination(prev => ({ ...prev, currentPage: 1 }));
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === status
                  ? status === 'pending' 
                    ? 'bg-yellow-600 text-black' 
                    : status === 'verified'
                      ? 'bg-green-600 text-black'
                      : 'bg-red-600 text-black'
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
      
      {/* Advanced Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
            {/* University Filter */}
            <select
              value={filters.university}
              onChange={(e) => handleFilterChange('university', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Universities</option>
              {universities.map((uni) => (
                <option key={uni.id} value={uni.id}>{uni.name}</option>
              ))}
            </select>

            {/* Time Range Filter */}
            <select
              value={filters.timeRange}
              onChange={(e) => handleFilterChange('timeRange', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            {/* Sort Options */}
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                setFilters(prev => ({ ...prev, sortBy, sortOrder }));
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="date_worked-desc">Recent Dates</option>
              <option value="date_worked-asc">Old Dates</option>
              <option value="hours-desc">Most Hours</option>
              <option value="hours-asc">Fewest Hours</option>
              <option value="first_name-asc">A-Z Volunteers</option>
              <option value="first_name-desc">Z-A Volunteers</option>
            </select>
          </div>

          {/* Active Filters Display */}
          {(filters.university || filters.timeRange !== 'all') && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Active filters:</span>
              {filters.university && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  University: {universities.find(u => u.id === filters.university)?.name}
                </span>
              )}
              {filters.timeRange !== 'all' && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                  {filters.timeRange === 'week' ? 'This Week' : 'This Month'}
                </span>
              )}
              <button
                onClick={() => {
                  setFilters({
                    university: '',
                    timeRange: 'all',
                    sortBy: 'created_at',
                    sortOrder: 'desc'
                  });
                }}
                className="text-red-600 hover:text-red-800 text-xs"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-blue-800">
            Showing {hourLogs.length} of {pagination.totalCount} entries
            {filters.university && ` from ${universities.find(u => u.id === filters.university)?.name}`}
            {filters.timeRange !== 'all' && ` (${filters.timeRange === 'week' ? 'this week' : 'this month'})`}
          </div>
          <div className="text-sm text-blue-700 mt-2 sm:mt-0">
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>
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
          {(filters.university || filters.timeRange !== 'all') && (
            <button
              onClick={() => {
                setFilters({
                  university: '',
                  timeRange: 'all',
                  sortBy: 'created_at',
                  sortOrder: 'desc'
                });
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
              <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('first_name')}
                    >
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Volunteer
                        {getSortIcon('first_name')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        University
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        Opportunity
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('date_worked')}
                    >
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Date & Hours
                        {getSortIcon('date_worked')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                        <Clipboard className="w-4 h-4" />
                        Description
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                        <Stamp className="w-4 h-4" />
                        Status
                      </div>
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
                          {log.student_id && (
                            <div className="text-xs text-gray-400">ID: {log.student_id}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.university_name || 'Not specified'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.opportunity_title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-semibold text-green-600 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {log.hours} hours
                          </div>
                          <div className="text-gray-500">
                            {formatDate(log.date_worked)}
                          </div>
                          {log.time_in && log.time_out && (
                            <div className="text-xs text-gray-400">
                              {formatTime(log.time_in)} - {formatTime(log.time_out)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs">
                          {log.description || 'No description provided'}
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
                              className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
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
                              className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors"
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between bg-white px-6 py-3 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center space-x-2 flex-1">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>
              
              <div className="hidden md:flex space-x-2">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                        pagination.currentPage === pageNum
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <div className="text-sm text-gray-700 md:hidden">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </>
      )}

      <ToastContainer />
    </div>
  );
}
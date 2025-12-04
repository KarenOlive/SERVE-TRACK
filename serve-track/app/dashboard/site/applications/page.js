'use client';

import { useState, useEffect } from 'react';
import { useToast } from '../../../hooks/useToast';
import { 
  Filter, ChevronLeft, ChevronRight, Calendar,Building,Clock,User,ArrowUpDown,Download,Briefcase,Clipboard,Stamp,X, CheckCircle, Hourglass, Search, SlidersHorizontal
} from 'lucide-react';
export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [counts, setCounts] = useState({});
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const { addToast, ToastContainer } = useToast();
  const [reloading, setReloading] = useState(false);

  // Filters and pagination state
  const [filters, setFilters] = useState({
    university: 'all',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [sortConfig, setSortConfig] = useState({
    sortBy: 'applied_at',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [showFilters, setShowFilters] = useState(false);


  useEffect(() => {
    fetchApplications();
  }, [selectedStatus, filters, sortConfig, pagination.page]);

  const fetchApplications = async (isRefresh = false) => {
    try {
      if (isRefresh) setReloading(true);
      else setLoading(true);
  
      const token = localStorage.getItem('token');

      // Build query string
      const queryParams = new URLSearchParams({
        ...filters,
        ...sortConfig,
        page: pagination.page,
        limit: pagination.limit,
      }).toString();

      const url = selectedStatus 
        ? `/api/site/applications?status=${selectedStatus}`
        : `/api/site/applications?${queryParams}`;
  
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
      setUniversities(data.universities || []);
      setPagination(data.pagination || pagination);
      console.log(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      addToast('Failed to load applications', 'error');
    } finally {
      if (isRefresh) setReloading(false);
      else setLoading(false);
    }
  };


  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (field) => {
    setSortConfig(prev => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'pending',
      university: 'all',
      startDate: '',
      endDate: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
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
      //Update local state
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
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
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
    if (sortConfig.sortBy !== field) return <ArrowUpDown className="w-3 h-3" />;
    return sortConfig.sortOrder === 'asc' ? '↑' : '↓';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const hasActiveFilters = filters.university !== 'all' || filters.startDate || filters.endDate || filters.search;

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
          <h1 className="text-2xl font-bold text-gray-900">Student Applications</h1>
          <p className="text-gray-600 mt-1">
            Review and manage volunteer applications
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
          </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex space-x-4">
          {['pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === status
                ? status === 'pending' 
                ? 'bg-yellow-500 text-black' 
                : status === 'approved'
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
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, email, or opportunity..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* University Filter */}
            <select
              value={filters.university}
              onChange={(e) => handleFilterChange('university', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Universities</option>
              {universities.map((university, index) => (
                <option key={index} value={university}>{university}</option>
              ))}
            </select>

    </div>

          {/* Active Filters and Clear Button */}
          {hasActiveFilters && (
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-2 text-sm">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Active filters:</span>
                {filters.university !== 'all' && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    University: {filters.university}
                  </span>
                )}
                
                {filters.search && (
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                    Search: {filters.search}
                  </span>
                )}
              </div>
              <button
                onClick={clearFilters}
                className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sort Options */}
      <div className="flex flex-wrap gap-4 items-center text-sm">
        <span className="text-gray-600">Sort by:</span>
        <button
          onClick={() => handleSort('applied_at')}
          className={`flex items-center gap-1 px-3 py-1 rounded-full ${
            sortConfig.sortBy === 'applied_at' 
              ? 'bg-green-100 text-green-800' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Applied Date {getSortIcon('applied_at')}
        </button>
        <button
          onClick={() => handleSort('first_name')}
          className={`flex items-center gap-1 px-3 py-1 rounded-full ${
            sortConfig.sortBy === 'first_name' 
              ? 'bg-green-100 text-green-800' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <User className="w-4 h-4" />
          Student Name {getSortIcon('first_name')}
        </button>
        <button
          onClick={() => handleSort('opportunity_title')}
          className={`flex items-center gap-1 px-3 py-1 rounded-full ${
            sortConfig.sortBy === 'opportunity_title' 
              ? 'bg-green-100 text-green-800' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Opportunity {getSortIcon('opportunity_title')}
        </button>
        <button
          onClick={() => handleSort('university_name')}
          className={`flex items-center gap-1 px-3 py-1 rounded-full ${
            sortConfig.sortBy === 'university_name' 
              ? 'bg-green-100 text-green-800' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Building className="w-4 h-4" />
          University {getSortIcon('university_name')}
        </button>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-4xl mb-4 flex justify-center">
            {selectedStatus === 'pending' ? <Hourglass className="w-10 h-10 text-gray-500" /> : 
             selectedStatus === 'approved' ? <CheckCircle className="w-10 h-10 text-gray-500" /> : <X className="w-10 h-10 text-red-500" />}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {selectedStatus} applications
          </h3>
          <p className="text-gray-600">
            {selectedStatus === 'pending' 
              ? 'When students apply to your opportunities, they will appear here.' 
              : `You haven't ${selectedStatus} any applications yet.`}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <>
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
                      {application.university_code && (
                        <div className="text-xs text-gray-400">{application.university_code}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        {formatDate(application.applied_at)}
                      </div>                    </td>
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
        {/* Pagination */}
        {applications.length > 0 && pagination.totalPages > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {pagination.page} of {pagination.totalPages}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    setPagination(prev => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="flex items-center px-3 py-1 rounded-lg border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex space-x-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() =>
                          setPagination(prev => ({ ...prev, page: pageNum }))
                        }
                        className={`px-3 py-1 rounded-lg text-sm ${
                          pagination.page === pageNum
                            ? 'bg-green-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() =>
                    setPagination(prev => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="flex items-center px-3 py-1 rounded-lg border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}

        
      </>
      )}

      <ToastContainer />
    </div>
  );
}
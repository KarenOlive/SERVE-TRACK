'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/app/hooks/useToast';
import { Search, Filter, MapPin, Calendar, Users, Clock, ArrowUpDown, CheckCircle, Building } from 'lucide-react';

// Debounce hook for search
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function BrowseOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [locations, setLocations] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [filters, setFilters] = useState({
    location: '',
    status: '',
    organization: '',
    search: ''
  });
  const [sortConfig, setSortConfig] = useState({
    sortBy: 'start_date',
    sortOrder: 'asc'
  });
  const { addToast, ToastContainer } = useToast();

  // Debounce search input
  const debouncedSearch = useDebounce(filters.search, 500);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        ...filters,
        search: debouncedSearch, // Use debounced search value
        ...sortConfig
      }).toString();

      const response = await fetch(`/api/student/opportunities?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch opportunities');

      const data = await response.json();
      setOpportunities(data.opportunities || []);
      setLocations(data.locations || []);
      setOrganizations(data.organizations || []);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      addToast('Failed to load opportunities', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters.location, filters.status, filters.organization, debouncedSearch, sortConfig, addToast]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleApply = async (opportunityId) => {
    setApplying(opportunityId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/student/opportunities/${opportunityId}/apply`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to apply');
      }

      // Update the opportunity to show as applied
      setOpportunities(prev => prev.map(opp => 
        opp.id === opportunityId ? { ...opp, has_applied: true } : opp
      ));

      addToast('Application submitted successfully!', 'success');
    } catch (error) {
      console.error('Error applying to opportunity:', error);
      addToast(error.message || 'Failed to apply to opportunity', 'error');
    } finally {
      setApplying(null);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSort = (field) => {
    setSortConfig(prev => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      status: '',
      organization: '',
      search: ''
    });
    setSortConfig({
      sortBy: 'start_date',
      sortOrder: 'asc'
    });
  };

  const getSortIcon = (field) => {
    if (sortConfig.sortBy !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortConfig.sortOrder === 'asc' ? '↑' : '↓';
  };

  const hasActiveFilters = filters.location || filters.status || filters.organization || filters.search;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Browse Opportunities</h1>
          <p className="text-gray-600 mt-1">
            Find volunteer opportunities that match your interests
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {opportunities.length} opportunity{opportunities.length !== 1 ? '(s)' : ''} found
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by title, description, or organization..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Location Filter */}
          <select
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Locations</option>
            {locations.map((location, index) => (
              <option key={index} value={location}>{location}</option>
            ))}
          </select>

          {/* Organization Filter */}
          <select
            value={filters.organization}
            onChange={(e) => handleFilterChange('organization', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Organizations</option>
            {organizations.map((organization, index) => (
              <option key={index} value={organization}>{organization}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="past">Past</option>
          </select>
        </div>

        {/* Active Filters and Clear Button */}
        {hasActiveFilters && (
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-2 text-sm">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Active filters:</span>
              {filters.location && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  Location: {filters.location}
                </span>
              )}
              {filters.organization && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  Organization: {filters.organization}
                </span>
              )}
              {filters.status && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                  Status: {filters.status}
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

      {/* Sort Options */}
      <div className="flex flex-wrap gap-4 items-center text-sm">
        <span className="text-gray-600">Sort by:</span>
        <button
          onClick={() => handleSort('start_date')}
          className={`flex items-center gap-1 px-3 py-1 rounded-full ${
            sortConfig.sortBy === 'start_date' 
              ? 'bg-blue-100 text-blue-800' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Start Date {getSortIcon('start_date')}
        </button>
        <button
          onClick={() => handleSort('estimated_hours')}
          className={`flex items-center gap-1 px-3 py-1 rounded-full ${
            sortConfig.sortBy === 'estimated_hours' 
              ? 'bg-blue-100 text-blue-800' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Hours {getSortIcon('estimated_hours')}
        </button>
        <button
          onClick={() => handleSort('volunteers_needed')}
          className={`flex items-center gap-1 px-3 py-1 rounded-full ${
            sortConfig.sortBy === 'volunteers_needed' 
              ? 'bg-blue-100 text-blue-800' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Users className="w-4 h-4" />
          Volunteers Needed {getSortIcon('volunteers_needed')}
        </button>
      </div>

      {/* Opportunities Grid */}
      {opportunities.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
          <p className="text-gray-600 mb-4">
            {hasActiveFilters 
              ? 'Try adjusting your filters or search terms'
              : 'No opportunities are currently available. Check back later!'
            }
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              onApply={handleApply}
              applying={applying === opportunity.id}
            />
          ))}
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

// Opportunity Card Component
function OpportunityCard({ opportunity, onApply, applying }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (startDate, endDate) => {
    const today = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (start > today) {
      return { label: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
    } else if (end && end < today) {
      return { label: 'Past', color: 'bg-gray-100 text-gray-800' };
    } else {
      return { label: 'Ongoing', color: 'bg-green-100 text-green-800' };
    }
  };

  const status = getStatusBadge(opportunity.start_date, opportunity.end_date);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header with Status */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2">{opportunity.title}</h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Building className="w-4 h-4 mr-1" />
          <span className="line-clamp-1">{opportunity.organization_name}</span>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        {/* Location */}
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-2" />
          <span>{opportunity.location || 'Location not specified'}</span>
        </div>

        {/* Dates */}
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          <span>
            {formatDate(opportunity.start_date)}
            {opportunity.end_date && ` - ${formatDate(opportunity.end_date)}`}
          </span>
        </div>

        {/* Hours */}
        {opportunity.estimated_hours && (
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            <span>{opportunity.estimated_hours} hours</span>
          </div>
        )}

        {/* Volunteers Needed */}
        {opportunity.volunteers_needed && (
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-2" />
            <span>{opportunity.volunteers_needed} volunteers needed</span>
          </div>
        )}

        {/* Description */}
        {opportunity.description && (
          <p className="text-sm text-gray-700 line-clamp-3">
            {opportunity.description}
          </p>
        )}

        {/* Application Count */}
        <div className="text-xs text-gray-500">
          {opportunity.application_count || 0} application{opportunity.application_count !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        {opportunity.has_applied ? (
          <div className="flex items-center justify-center text-green-600 text-sm font-medium">
            <CheckCircle className="w-4 h-4 mr-1" />
            Applied
          </div>
        ) : (
          <button
            onClick={() => onApply(opportunity.id)}
            disabled={applying}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {applying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Applying...
              </>
            ) : (
              'Apply Now'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
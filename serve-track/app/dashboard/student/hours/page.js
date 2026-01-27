'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/app/hooks/useToast';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  Building,
  FileText,
  Filter,
  Download,
  TrendingUp
} from 'lucide-react';

export default function HourHistoryPage() {
  const [hourLogs, setHourLogs] = useState([]);
  const [totals, setTotals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'verified', 'rejected'
  const [timeRange, setTimeRange] = useState('all'); // 'all', 'month', 'week'
  const { addToast, ToastContainer } = useToast();

  const fetchHourHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/student/hours/history?filter=${filter}&range=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch hour history');

      const data = await response.json();
      setHourLogs(data.hourLogs || []);
      setTotals(data.totals || []);
    } catch (error) {
      console.error('Error fetching hour history:', error);
      addToast('Failed to load hour history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHourHistory();
  }, [filter, timeRange]);

  const getStatusConfig = (status) => {
    const config = {
      pending: {
        icon: Clock,
        color: 'text-yellow-600 bg-yellow-100 border-yellow-200',
        label: 'Pending Review',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      },
      verified: {
        icon: CheckCircle,
        color: 'text-green-600 bg-green-100 border-green-200',
        label: 'Verified',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      rejected: {
        icon: XCircle,
        color: 'text-red-600 bg-red-100 border-red-200',
        label: 'Rejected',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      }
    };
    return config[status] || config.pending;
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

  const getTotalHoursByStatus = (status) => {
    const total = totals.find(t => t.status === status);
    return total ? parseFloat(total.total_hours) : 0;
  };

  const getTotalHours = () => {
    return totals.reduce((sum, t) => sum + parseFloat(t.total_hours), 0);
  };

  const getVerifiedHours = () => {
    return getTotalHoursByStatus('verified');
  };

  // Group logs by month for timeline view
  const groupLogsByMonth = () => {
    const groups = {};
    
    hourLogs.forEach(log => {
      const date = new Date(log.date_worked);
      const monthYear = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      
      groups[monthYear].push(log);
    });
    
    return groups;
  };

  const monthlyGroups = groupLogsByMonth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading hour history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hour History</h1>
          <p className="text-gray-600 mt-1">
            Track your volunteer hours and verification status
          </p>
        </div>
        <button
          onClick={() => {
            // Create a simple CSV export
            const csvContent = "data:text/csv;charset=utf-8," 
              + "Date,Opportunity,Organization,Hours,Status,Time In,Time Out,Description\n"
              + hourLogs.map(log => 
                  `"${log.date_worked}","${log.opportunity_title}","${log.organization_name}",${log.hours},"${log.status}","${log.time_in}","${log.time_out}","${log.description || ''}"`
                ).join("\n");
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "volunteer_hours_history.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-blue-600">
                {getTotalHours().toFixed(1)}
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Verified Hours</p>
              <p className="text-2xl font-bold text-green-600">
                {getVerifiedHours().toFixed(1)}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Unverified Hours</p>
              <p className="text-2xl font-bold text-yellow-600">
                {getTotalHoursByStatus('pending').toFixed(1)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average hours per Entry</p>
              <p className="text-2xl font-bold text-purple-600">
                {hourLogs.length > 0 ? (getTotalHours() / hourLogs.length).toFixed(1) : '0.0'}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                filter === 'all'
                  ? 'bg-blue-100 border-blue-500 text-blue-700'
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Hours
            </button>
            <button
              onClick={() => setFilter('verified')}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                filter === 'verified'
                  ? 'bg-green-100 border-green-500 text-green-700'
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Verified
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-100 border-yellow-500 text-yellow-700'
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                filter === 'rejected'
                  ? 'bg-red-100 border-red-500 text-red-700'
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rejected
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm font-medium text-gray-700">Time Range:</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="week">This Week</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline View */}
      {hourLogs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'No hours logged yet' : `No ${filter} hours found`}
          </h3>
          <p className="text-gray-600 mb-4">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />

            {filter === 'all' 
              ? 'Start logging your volunteer hours to see them here.'
              : `No hours match the "${filter}" filter.`
            }
          </p>
          {filter === 'all' && (
            <a
              href="/dashboard/student/hours/log"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Log Your First Hours
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(monthlyGroups).map(([monthYear, logs]) => (
            <div key={monthYear} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Month Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">{monthYear}</h2>
                <p className="text-sm text-gray-600">
                  {logs.length} entr{logs.length === 1 ? 'y' : 'ies'} • {logs.reduce((sum, log) => sum + parseFloat(log.hours), 0).toFixed(1)} total hours
                </p>
              </div>

              {/* Timeline */}
              <div className="divide-y divide-gray-200">
                {logs.map((log, index) => {
                  const statusConfig = getStatusConfig(log.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex gap-4">
                        {/* Date Circle */}
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="text-xs text-gray-500 mt-1 text-center">
                            {formatDate(log.date_worked)}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2 mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg">
                                {log.opportunity_title}
                              </h3>
                              <div className="flex items-center text-sm text-gray-600 mt-1">
                                <Building className="w-4 h-4 mr-1" />
                                <span>{log.organization_name}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">
                                  {log.hours} hours
                                </div>
                                {log.time_in && log.time_out && (
                                  <div className="text-sm text-gray-500">
                                    {formatTime(log.time_in)} - {formatTime(log.time_out)}
                                  </div>
                                )}
                              </div>
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                                <StatusIcon className="w-4 h-4" />
                                {statusConfig.label}
                              </span>
                            </div>
                          </div>

                          {log.description && (
                            <p className="text-gray-700 mb-3">
                              {log.description}
                            </p>
                          )}

                          {log.rejection_reason && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                              <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                              <p className="text-sm text-red-700 mt-1">{log.rejection_reason}</p>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span>Submitted on {formatDate(log.created_at)}</span>
                            {log.verified_at && (
                              <span>• Verified on {formatDate(log.verified_at)}</span>
                            )}
                            {log.verified_by_first_name && (
                              <span>• By {log.verified_by_first_name} {log.verified_by_last_name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Card */}
      {hourLogs.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Hour Summary</h3>
              <p className="text-blue-100">
                You've logged {getTotalHours().toFixed(1)} total hours across {hourLogs.length} entries
              </p>
            </div>
            <div className="flex gap-6 mt-4 md:mt-0">
              <div className="text-center">
                <div className="text-2xl font-bold">{getVerifiedHours().toFixed(1)}</div>
                <div className="text-blue-200 text-sm">Verified Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{getTotalHoursByStatus('pending').toFixed(1)}</div>
                <div className="text-blue-200 text-sm">Pending Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Object.keys(monthlyGroups).length}</div>
                <div className="text-blue-200 text-sm">Active Months</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
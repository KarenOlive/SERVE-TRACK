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
  FilePlus,
  X,
  Calculator,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function LogHoursPage() {
  const [showForm, setShowForm] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [hourLogs, setHourLogs] = useState([]);
  const [totals, setTotals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inputMethod, setInputMethod] = useState('time'); // 'time' or 'manual'
  const [formData, setFormData] = useState({
    opportunity_id: '',
    date_worked: '',
    hours: '',
    time_in: '',
    time_out: '',
    description: ''
  });
  const { addToast, ToastContainer } = useToast();

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Set default time values when input method changes
  useEffect(() => {
    if (showForm && inputMethod === 'time') {
      // Only set defaults if the fields are empty
      setFormData(prev => ({
        ...prev,
        time_in: prev.time_in || '09:00',
        time_out: prev.time_out || '12:00',
        hours: prev.hours || '3.00'
      }));
    }
  }, [showForm, inputMethod]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch opportunities and hour logs in parallel
      const [oppsResponse, logsResponse] = await Promise.all([
        fetch('/api/student/hours/opportunities', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/student/hours/log', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!oppsResponse.ok) throw new Error('Failed to fetch opportunities');
      if (!logsResponse.ok) throw new Error('Failed to fetch hour logs');

      const oppsData = await oppsResponse.json();
      const logsData = await logsResponse.json();

      setOpportunities(oppsData.opportunities || []);
      setHourLogs(logsData.hourLogs || []);
      setTotals(logsData.totals || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      addToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateHoursFromTime = () => {
    if (!formData.time_in || !formData.time_out) return '';

    const [startHours, startMinutes] = formData.time_in.split(':').map(Number);
    const [endHours, endMinutes] = formData.time_out.split(':').map(Number);
    
    let startTotalMinutes = startHours * 60 + startMinutes;
    let endTotalMinutes = endHours * 60 + endMinutes;
    
    // Handle overnight shifts (time_out is next day)
    if (endTotalMinutes < startTotalMinutes) {
      endTotalMinutes += 24 * 60; // Add 24 hours
    }
    
    const totalMinutes = endTotalMinutes - startTotalMinutes;
    const calculatedHours = (totalMinutes / 60).toFixed(2);
    
    return calculatedHours > 0 ? calculatedHours : '';
  };

  const handleTimeChange = (field, value) => {
    const updatedFormData = { ...formData, [field]: value };
    
    // If both time fields are filled, calculate hours automatically
    if (inputMethod === 'time' && updatedFormData.time_in && updatedFormData.time_out) {
      const calculatedHours = calculateHoursFromTime();
      if (calculatedHours) {
        updatedFormData.hours = calculatedHours;
      }
    }
    
    setFormData(updatedFormData);
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setSubmitting(true);

  //   try {
  //     const token = localStorage.getItem('token');
  //     const response = await fetch('/api/student/hours/log', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${token}`
  //       },
  //       body: JSON.stringify(formData)
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.error || 'Failed to log hours');
  //     }

  //     const data = await response.json();
      
  //     // Reset form and close
  //     setFormData({
  //       opportunity_id: '',
  //       date_worked: '',
  //       hours: '',
  //       description: ''
  //     });
  //     setShowForm(false);
      
  //     // Refresh the data
  //     fetchData();
      
  //     addToast(data.message || 'Hours logged successfully!', 'success');
  //   } catch (error) {
  //     console.error('Error logging hours:', error);
  //     addToast(error.message || 'Failed to log hours', 'error');
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Validate form based on input method
    if (inputMethod === 'time') {
      if (!formData.time_in || !formData.time_out) {
        addToast('Please provide both time in and time out', 'error');
        setSubmitting(false);
        return;
      }
      
      const calculatedHours = calculateHoursFromTime();
      if (!calculatedHours || calculatedHours <= 0) {
        addToast('Time out must be after time in', 'error');
        setSubmitting(false);
        return;
      }
    } else {
      if (!formData.hours || formData.hours <= 0) {
        addToast('Please provide valid hours worked', 'error');
        setSubmitting(false);
        return;
      }
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/hours/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          input_method: inputMethod
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to log hours');
      }

      const data = await response.json();
      
      // Reset form and close
      setFormData({
        opportunity_id: '',
        date_worked: '',
        time_in: '',
        time_out: '',
        hours: '',
        description: ''
      });
      setShowForm(false);
      setInputMethod('time'); // Reset to default
      
      // Refresh the data
      fetchData();
      
      addToast(data.message || 'Hours logged successfully!', 'success');
    } catch (error) {
      console.error('Error logging hours:', error);
      addToast(error.message || 'Failed to log hours', 'error');
    } finally {
      setSubmitting(false);
    }
};

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getStatusConfig = (status) => {
    const config = {
      pending: {
        icon: Clock,
        color: 'text-yellow-600 bg-yellow-100 border-yellow-200',
        label: 'Pending Review'
      },
      verified: {
        icon: CheckCircle,
        color: 'text-green-600 bg-green-100 border-green-200',
        label: 'Verified'
      },
      rejected: {
        icon: XCircle,
        color: 'text-red-600 bg-red-100 border-red-200',
        label: 'Rejected'
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

    // Custom Date Picker Component
    const DatePicker = ({ value, onChange, max }) => {
      const [showPicker, setShowPicker] = useState(false);
      const [currentDate, setCurrentDate] = useState(new Date());
      
      // Helper function to get date in YYYY-MM-DD format without timezone issues
      const getLocalDateString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const today = new Date();
      const todayFormatted = getLocalDateString(today);
      const maxDate = max ? new Date(max) : today;
      
      const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      };
      
      const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
      };
      
      const isDateDisabled = (date) => {
        return date > maxDate;
      };
      
      const handleDateSelect = (day) => {
        // Fix: Create date in local timezone without timezone conversion issues
        const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        // Use toLocaleDateString to avoid timezone issues
        // const year = selectedDate.getFullYear();
        // const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        // const dayOfMonth = String(selectedDate.getDate()).padStart(2, '0');
        const formattedDate = getLocalDateString(selectedDate);
        onChange(formattedDate);
        setShowPicker(false);
      };
      
      const navigateMonth = (direction) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
      };

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      const daysInMonth = getDaysInMonth(currentDate);
      const firstDay = getFirstDayOfMonth(currentDate);


      return (
        <div className="relative">
          <div className="flex items-center">
            <input
              type="date"
              required
              max={max}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPicker(!showPicker)}
              className="ml-2 p-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Calendar className="w-5 h-5" />
            </button>
          </div>
          
          {showPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 w-64 p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => navigateMonth(-1)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </span>
                <button
                  type="button"
                  onClick={() => navigateMonth(1)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before the first day of month */}
                {Array.from({ length: firstDay }).map((_, index) => (
                  <div key={`empty-${index}`} className="h-8"></div>
                ))}
                
                {/* Days of the month */}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                  const dateFormatted = getLocalDateString(date);
                  const isDisabled = isDateDisabled(date);
                  const isSelected = value === dateFormatted;
                  const isToday = dateFormatted === todayFormatted;
                  
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => !isDisabled && handleDateSelect(day)}
                      className={`
                        h-8 rounded text-sm font-medium transition-colors
                        ${isSelected 
                          ? 'bg-blue-600 text-white' 
                          : isToday
                            ? 'bg-blue-100 text-blue-800'
                            : isDisabled
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              
              {/* Quick actions */}
              <div className="flex justify-between mt-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    onChange(todayFormatted);
                    setShowPicker(false);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setShowPicker(false)}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      );
    };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Log Volunteer Hours</h1>
          <p className="text-gray-600 mt-1">
            Track your volunteer hours and view submission history
          </p>
        </div>
        <button
          onClick={() => {
            // Reset form when opening
            setFormData({

              opportunity_id: '',
              date_worked: '',
              time_in: '09:00',
              time_out: '12:00',
              hours: '3.00',
              description: ''
            });
            setInputMethod('time');
            setShowForm(true);
            }
          }
          disabled={opportunities.length === 0}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FilePlus className="w-4 h-4" />
          Log Hours
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hours Pending Review</p>
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
              <p className="text-sm font-medium text-gray-600">Verified Hours</p>
              <p className="text-2xl font-bold text-green-600">
                {getTotalHoursByStatus('verified').toFixed(1)}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Logged</p>
              <p className="text-2xl font-bold text-blue-600">
                {totals.reduce((sum, t) => sum + parseFloat(t.total_hours), 0).toFixed(1)}
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* No Opportunities Message */}
      {opportunities.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            No Approved Opportunities
          </h3>
          <p className="text-yellow-700">
            You need to have approved application(s) to opportunities before you can log hours. 
            Browse opportunities and get approved to start tracking your volunteer work.
          </p>
        </div>
      )}

      {/* Log Hours Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Log Volunteer Hours</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Opportunity Selection */}
              <div>
                <label className="block text-md font-medium text-gray-700 mb-1">
                  Opportunity *
                </label>
                <select
                  required
                  value={formData.opportunity_id}
                  onChange={(e) => handleInputChange('opportunity_id', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select an opportunity</option>
                  {opportunities.map((opp) => (
                    <option key={opp.id} value={opp.id}>
                      {opp.title} - {opp.organization_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Worked */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Worked *
                </label>
                <DatePicker
                  value={formData.date_worked}
                  onChange={(value) => handleInputChange('date_worked', value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              
                 {/* Input Method Toggle */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setInputMethod('time')}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    inputMethod === 'time'
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}>
                   <Clock className="w-4 h-4 mx-auto mb-1" />
                  Time In/Out
                </button>  
                <button
                  type="button"
                  onClick={() => setInputMethod('manual')}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    inputMethod === 'manual'
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Calculator className="w-4 h-4 mx-auto mb-1" />
                  Manual Hours
                </button>
              </div>

              {/* Time In/Out Fields */}
              {inputMethod === 'time' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time In *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.time_in}
                      onChange={(e) => handleTimeChange('time_in', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time Out *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.time_out}
                      onChange={(e) => handleTimeChange('time_out', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Hours */}
              {inputMethod === 'manual' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hours Worked *
                </label>
                <input
                  type="number"
                  required
                  min="0.1"
                  max="24"
                  step="0.5"
                  value={formData.hours}
                  onChange={(e) => handleInputChange('hours', parseFloat(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Enter hours between 0.1 and 24</p>
              </div>
              )}

              {/* Calculated Hours Display */}
              {inputMethod === 'time' && formData.time_in && formData.time_out && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-800 font-medium">Calculated Hours:</span>
                    <span className="text-blue-900 font-bold">
                      {calculateHoursFromTime()} hours
                    </span>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the work you performed..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({
                      opportunity_id: '',
                      date_worked: '',
                      time_in: '',
                      time_out: '',
                      hours: '',
                      description: ''
                    });
                    setInputMethod('time');
                  }}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                    </>
                  ) : (
                     'Log Hours'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recent Submissions */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
          <p className="text-gray-600 text-sm mt-1">
            Your most recent hour log submissions
          </p>
        </div>

        {hourLogs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hour logs yet</p>
            <p className="text-gray-500 text-sm mt-1">
              Log your first hours to see them here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {hourLogs.map((log) => {
              const statusConfig = getStatusConfig(log.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">{log.opportunity_title}</h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Building className="w-4 h-4 mr-1" />
                          <span>{log.organization_name}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>{formatDate(log.date_worked)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>
                            {formatTime(log.time_in)} - {formatTime(log.time_out)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span className="font-medium">{log.hours} hours</span>
                        </div>
                      </div>

                      {log.description && (
                        <p className="text-sm text-gray-700">
                          {log.description}
                        </p>
                      )}

                      {log.rejection_reason && (
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                          <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                          <p className="text-sm text-red-700 mt-1">{log.rejection_reason}</p>
                        </div>
                      )}

                      <div className="text-xs text-gray-500">
                        Submitted on {formatDate(log.created_at)}
                        {log.verified_at && ` • Verified on ${formatDate(log.verified_at)}`}
                        {log.verified_by_first_name && ` • By ${log.verified_by_first_name} ${log.verified_by_last_name}`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ToastContainer />
    </div>
  );
}
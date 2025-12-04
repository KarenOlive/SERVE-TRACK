'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/app/hooks/useToast';
import { 
  Clock, CheckCircle, XCircle, AlertCircle, Eye,Calendar,MapPin,Building,ArrowRight, Clipboard
} from 'lucide-react';
import Link from 'next/link';

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(null);
  const { addToast, ToastContainer } = useToast();

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch applications');

      const data = await response.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      addToast('Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleWithdraw = async (applicationId) => {
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }

    setWithdrawing(applicationId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/student/applications/${applicationId}/withdraw`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to withdraw application');
      }

      // Update the application status locally
      setApplications(prev => prev.map(app => 
        app.id === applicationId ? { ...app, status: 'withdrawn', reviewed_at: new Date().toISOString() } : app
      ));

      addToast('Application withdrawn successfully', 'success');
    } catch (error) {
      console.error('Error withdrawing application:', error);
      addToast(error.message || 'Failed to withdraw application', 'error');
    } finally {
      setWithdrawing(null);
    }
  };

  const getStatusConfig = (status) => {
    const config = {
      pending: {
        icon: Clock,
        color: 'text-yellow-600 bg-yellow-100 border-yellow-200',
        label: 'Pending Review'
      },
      approved: {
        icon: CheckCircle,
        color: 'text-green-600 bg-green-100 border-green-200',
        label: 'Approved'
      },
      rejected: {
        icon: XCircle,
        color: 'text-red-600 bg-red-100 border-red-200',
        label: 'Rejected'
      },
      withdrawn: {
        icon: AlertCircle,
        color: 'text-gray-600 bg-gray-100 border-gray-200',
        label: 'Withdrawn'
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-600 mt-1">
            Track your volunteer opportunity applications
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {applications.length} application{applications.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-blue-200">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <Clipboard className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
          <p className="text-gray-600 mb-4">
            You haven't applied to any volunteer opportunities yet.
          </p>
          <Link
            href="/dashboard/student/opportunities"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Opportunities
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => {
            const statusConfig = getStatusConfig(application.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div key={application.id} className="bg-white rounded-lg border border-blue-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Application Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {application.opportunity_title}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <Building className="w-4 h-4 mr-1" />
                          <span>{application.organization_name}</span>
                        </div>
                      </div>
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-medium ${statusConfig.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {statusConfig.label}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{application.location || 'Location not specified'}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>
                          {formatDate(application.start_date)}
                          {application.end_date && ` - ${formatDate(application.end_date)}`}
                        </span>
                      </div>
                      {application.estimated_hours && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>{application.estimated_hours} hours</span>
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-gray-500">
                      Applied on {formatDate(application.applied_at)}
                      {application.reviewed_at && ` • Reviewed on ${formatDate(application.reviewed_at)}`}
                      {application.reviewer_first_name && ` • By ${application.reviewer_first_name} ${application.reviewer_last_name}`}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                    <Link
                      href={`/dashboard/student/applications/${application.id}`}
                      className="flex items-center justify-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>
                    
                    {application.status === 'pending' && (
                      <button
                        onClick={() => handleWithdraw(application.id)}
                        disabled={withdrawing === application.id}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {withdrawing === application.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            Withdrawing...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            Withdraw
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
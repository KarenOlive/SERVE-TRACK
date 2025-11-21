'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/app/hooks/useToast';
import Link from 'next/link';
import { 
  ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, Calendar, MapPin, Building, Users, Clock as HoursIcon, Phone, Globe, Hourglass
} from 'lucide-react';

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = useState(null);
  const [communicationLog, setCommunicationLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const { addToast, ToastContainer } = useToast();

  const applicationId = params.id;

  const fetchApplicationDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/student/applications/${applicationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 404) {
          router.push('/dashboard/student/applications');
          addToast('Application not found', 'error');
          return;
        }
        throw new Error('Failed to fetch application details');
      }

      const data = await response.json();
      setApplication(data.application);
      setCommunicationLog(data.communicationLog || []);
    } catch (error) {
      console.error('Error fetching application details:', error);
      addToast('Failed to load application details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (applicationId) {
      fetchApplicationDetails();
    }
  }, [applicationId]);

  const handleWithdraw = async () => {
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }

    setWithdrawing(true);
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

      addToast('Application withdrawn successfully', 'success');
      fetchApplicationDetails(); // Refresh the data
    } catch (error) {
      console.error('Error withdrawing application:', error);
      addToast(error.message || 'Failed to withdraw application', 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  const getStatusConfig = (status) => {
    const config = {
      pending: {
        icon: Hourglass,
        color: 'text-yellow-500 bg-indigo-100 border-indigo-200',
        label: 'Pending Review',
        description: 'Your application is under review by the organization.'
      },
      approved: {
        icon: CheckCircle,
        color: 'text-green-600 bg-green-100 border-green-200',
        label: 'Approved',
        description: 'Your application has been approved!'
      },
      rejected: {
        icon: XCircle,
        color: 'text-red-600 bg-red-100 border-red-200',
        label: 'Rejected',
        description: 'Your application was not approved.'
      },
      withdrawn: {
        icon: AlertCircle,
        color: 'text-gray-600 bg-gray-100 border-gray-200',
        label: 'Withdrawn',
        description: 'You have withdrawn this application.'
      }
    };
    return config[status] || config.pending;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString) => {
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
          <p className="mt-2 text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Application not found</p>
          <Link
            href="/dashboard/student/applications"
            className="inline-flex items-center gap-2 mt-4 text-blue-500 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4 text-blue-500" />
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(application.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/student/applications"
            className="flex items-center gap-2 text-blue-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 text-blue-600" />
            Back to Applications
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Application Details</h1>
            <p className="text-gray-600">Track your application status and history</p>
          </div>
        </div>
        
        {application.status === 'pending' && (
          <button
            onClick={handleWithdraw}
            disabled={withdrawing}
            className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {withdrawing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                Withdrawing...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Withdraw Application
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-full ${statusConfig.color.replace('text-', 'bg-').split(' ')[0]}`}>
                <StatusIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Application Status</h2>
                <p className="text-gray-600">{statusConfig.description}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Applied:</span>
                <p className="text-gray-900">{formatDate(application.applied_at)}</p>
              </div>
              {application.reviewed_at && (
                <div>
                  <span className="font-medium text-gray-600">Reviewed:</span>
                  <p className="text-gray-900">{formatDate(application.reviewed_at)}</p>
                </div>
              )}
              {application.reviewer_first_name && (
                <div>
                  <span className="font-medium text-gray-600">Reviewed by:</span>
                  <p className="text-gray-900">{application.reviewer_first_name} {application.reviewer_last_name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Opportunity Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Opportunity Details</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 text-lg">{application.opportunity_title}</h3>
                <p className="text-gray-600 mt-1">{application.opportunity_description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <Building className="w-4 h-4 mr-2" />
                  <span>{application.organization_name}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{application.location || 'Location not specified'}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>
                    {formatDateShort(application.start_date)}
                    {application.end_date && ` - ${formatDateShort(application.end_date)}`}
                  </span>
                </div>
                {application.estimated_hours && (
                  <div className="flex items-center text-gray-600">
                    <HoursIcon className="w-4 h-4 mr-2" />
                    <span>{application.estimated_hours} hours</span>
                  </div>
                )}
                {application.volunteers_needed && (
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{application.volunteers_needed} volunteers needed</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Communication Log - Placeholder for future implementation */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Communication Log</h2>
            
            {communicationLog.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No communication history yet.</p>
                <p className="text-sm mt-1">Any messages from the organization will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {communicationLog.map((message, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-gray-900">{message.subject}</p>
                      <span className="text-sm text-gray-500">{formatDate(message.sent_at)}</span>
                    </div>
                    <p className="text-gray-600 mt-1">{message.content}</p>
                    <div className="text-sm text-gray-500 mt-1">From: {message.sender_name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Organization Contact */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900 mb-4">Organization Contact</h3>
            
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Building className="w-4 h-4 mr-2" />
                <span>{application.organization_name}</span>
              </div>
              
              {application.contact_phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  <a href={`tel:${application.contact_phone}`} className="hover:text-blue-600">
                    {application.contact_phone}
                  </a>
                </div>
              )}
              
              {application.website && (
                <div className="flex items-center text-sm text-gray-600">
                  <Globe className="w-4 h-4 mr-2" />
                  <a 
                    href={application.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 break-all"
                  >
                    {application.website}
                  </a>
                </div>
              )}
              
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{application.location || 'Location not specified'}</span>
              </div>
            </div>
          </div>

          {/* Application Timeline */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900 mb-4">Application Timeline</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Application Submitted</p>
                  <p className="text-sm text-gray-500">{formatDate(application.applied_at)}</p>
                </div>
              </div>

              {application.reviewed_at && (
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    application.status === 'approved' ? 'bg-green-500' : 
                    application.status === 'rejected' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{application.status}</p>
                    <p className="text-sm text-gray-500">{formatDate(application.reviewed_at)}</p>
                    {application.reviewer_first_name && (
                      <p className="text-sm text-gray-500">
                        By {application.reviewer_first_name} {application.reviewer_last_name}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Download, CheckCircle, XCircle, Clock, Calendar,Building,BookOpen,GraduationCap,AlertCircle,ExternalLink, RefreshCcw
} from 'lucide-react';
import { useToast } from '../../../hooks/useToast';

export default function ProgressReportPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const { addToast, ToastContainer } = useToast();
  const router = useRouter();

  
  const fetchApplications = async (isRefresh = false) => {
    try {
        if (isRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
        }
        const token = localStorage.getItem('token');
      
        const response = await fetch('/api/student/progressreport', {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            cache: 'no-store' // Prevent caching for fresh data
        });
    
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data.applications || []);
      
      if (isRefresh) {
        addToast('Progress report refreshed successfully!', 'success');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      addToast('Failed to load progress report', 'error');
    } finally {
        if (isRefresh) {
            setRefreshing(false);
          } else {
            setLoading(false);
        }
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleDownloadCertificate = async (applicationId) => {
    try {
      setDownloading(prev => ({ ...prev, [applicationId]: true }));
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/student/certificate/${applicationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to download certificate');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `volunteer_certificate_${applicationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      addToast('Certificate downloaded successfully!', 'success');

      // Refresh the data after downloading a certificate
      setTimeout(() => {
        fetchApplications(true);
      }, 1000);
    } catch (error) {
      console.error('Download error:', error);
      addToast(error.message || 'Failed to download certificate', 'error');
    } finally {
      setDownloading(prev => ({ ...prev, [applicationId]: false }));
    }
  };

  const isCertificateAvailable = (application) => {
    const hoursCompleted = Number(application.hours_completed) || 0;
    const universityRequiredHours = Number(application.university_required_hours) || 0;
    
    return (
      application.site_manager_verified &&
      application.university_admin_verified &&
      hoursCompleted >= universityRequiredHours
    );
  };


  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (application) => {
    if (isCertificateAvailable(application)) return 'text-green-600 bg-green-50 border-green-200';
    if (application.status === 'approved') return 'text-blue-600 bg-blue-50 border-blue-200';
    if (application.status === 'rejected') return 'text-red-600 bg-red-50 border-red-200';
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  };

  const getHoursDisplay = (application) => {
    const hoursCompleted = Number(application.hours_completed) || 0;
    const universityRequiredHours = Number(application.university_required_hours) || 0;
    const totalVerifiedHours = Number(application.total_verified_hours) || 0;
    
    // Use whichever is greater: hours_completed from DB or calculated verified hours
    const displayHours = hoursCompleted > 0 ? hoursCompleted : totalVerifiedHours;
    
    return {
      displayHours: displayHours.toFixed(1),
      requiredHours: universityRequiredHours.toFixed(1),
      percentage: Math.min(100, (displayHours / universityRequiredHours) * 100),
      remainingHours: Math.max(0, universityRequiredHours - displayHours).toFixed(1)
    };
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    const stats = {
      totalOpportunities: applications.length,
      completedHours: applications.reduce((sum, app) => sum + (Number(app.hours_completed) || 0), 0).toFixed(1),
      availableCertificates: applications.filter(app => isCertificateAvailable(app)).length,
      pendingVerifications: applications.filter(app => !app.site_manager_verified || !app.university_admin_verified).length
    };
    
    return stats;
  };

  const stats = getSummaryStats();

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Progress Report</h1>
          <p className="text-gray-600 mt-1">
            Track your progress towards completion and download certificates
          </p>
        </div>
        <div>
        <button
          onClick={() => fetchApplications(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
         {refreshing ? (
            <>
              <RefreshCcw className="w-4 h-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>    
          <RefreshCcw className="w-5 h-5 text-blue-600" />
  
          Refresh
          </>
          )}
        </button>
        </div>
        
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Opportunities</p>
              <p className="text-xl font-semibold text-gray-900">
              {stats.totalOpportunities}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Completed Hours</p>
              <p className="text-xl font-semibold text-gray-900">
              {stats.completedHours}
             </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Available Certificates</p>
              <p className="text-xl font-semibold text-gray-900">
              {stats.availableCertificates}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pending Verification</p>
              <p className="text-xl font-semibold text-gray-900">
              {stats.pendingVerifications}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
            <div>
          <h2 className="text-xl font-bold text-gray-900">Volunteer Opportunities</h2>
          <p className="text-gray-600 mt-1">
            View your progress and download certificates for completed opportunities
          </p>
        </div>
        {refreshing && (
              <div className="flex items-center text-sm text-gray-500">
                <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                Updating data...
              </div>
            )}
          </div>
        </div>  
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No volunteer opportunities yet
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              Start by applying to volunteer opportunities. Your progress will appear here once you're approved.
            </p>
            <button
              onClick={() => router.push('/dashboard/student/opportunities')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Opportunities
              <ExternalLink className="w-4 h-4 ml-2" />
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opportunity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verification Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certificate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((application) => {
                  const canDownload = isCertificateAvailable(application);
                  const hoursInfo = getHoursDisplay(application);
                  
                  return (
                    <tr key={application.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {application.opportunity_title}
                          </div>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(application.start_date)} - {formatDate(application.end_date)}
                          </div>
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(application)}`}>
                              {application.status}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <Building className="w-4 h-4 mr-2 text-gray-400" />
                          {application.organization_name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {hoursInfo.displayHours}/{hoursInfo.requiredHours} hrs                            </span>
                            <span className="font-medium">{Math.round(hoursInfo.percentage)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                hoursInfo.percentage >= 100 ? 'bg-green-600' : 
                                hoursInfo.percentage >= 70 ? 'bg-blue-600' :
                                hoursInfo.percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${hoursInfo.percentage}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {hoursInfo.percentage >= 100 ? 'Requirements met!' : `${(application.university_required_hours - application.hours_completed).toFixed(1)} hours remaining`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            {application.site_manager_verified ? (
                              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            ) : (
                              <Clock className="w-4 h-4 text-yellow-500 mr-2" />
                            )}
                            <div>
                              <span className={`text-sm ${application.site_manager_verified ? 'text-green-700' : 'text-yellow-700'}`}>
                                Site {application.site_manager_verified ? 'Verified' : 'Pending'}
                              </span>
                              <div className="text-xs text-gray-500">
                                by {application.organization_name}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            {application.university_admin_verified ? (
                              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            ) : (
                              <Clock className="w-4 h-4 text-yellow-500 mr-2" />
                            )}
                            <div>
                              <span className={`text-sm ${application.university_admin_verified ? 'text-green-700' : 'text-yellow-700'}`}>
                                University {application.university_admin_verified ? 'Verified' : 'Pending'}
                              </span>
                              <div className="text-xs text-gray-500">
                                by {application.university_name}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {canDownload ? (
                          <button
                            onClick={() => handleDownloadCertificate(application.id)}
                            disabled={downloading[application.id]}
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {downloading[application.id] ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-2" />
                                Download Certificate
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="text-sm text-gray-500">
                            <div className="flex items-center mb-2">
                              <AlertCircle className="w-4 h-4 mr-1 text-yellow-500" />
                              <span>Requirements not met</span>
                            </div>
                            <div className="text-xs space-y-1">
                              {application.hours_completed < application.university_required_hours && (
                                <div className="text-red-600">
                                  • Need {(application.university_required_hours - application.hours_completed).toFixed(1)} more hours
                                </div>
                              )}
                              {!application.site_manager_verified && (
                                <div className="text-yellow-600">
                                  • Site manager verification pending
                                </div>
                              )}
                              {!application.university_admin_verified && (
                                <div className="text-yellow-600">
                                  • University verification pending
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Requirements Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Certificate Requirements</h3>
        <p className="text-blue-800 mb-4">
          To download a certificate for a volunteer opportunity, you must meet all the following requirements:
        </p>
        <ul className="space-y-2 text-blue-700">
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span><strong>Complete required hours:</strong> Meet or exceed your university's required volunteer hours</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span><strong>Site manager verification:</strong> Your volunteer hours must be verified by the organization's site manager</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span><strong>University verification:</strong> Your university admin must verify that you've met the requirements</span>
          </li>
        </ul>
      </div>

      <ToastContainer />
    </div>
  );
}
'use client';
import {Activity, ActivityIcon, X} from 'lucide-react';
export default function ActivityFeed({ activities = [] }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'verified':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      case 'new':
        return 'New';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  // Generate a unique key for each activity
  const generateActivityKey = (activity, index) => {
    // Use a combination of properties to create a unique key
    if (activity.id) {
      return `activity-${activity.id}`;
    }
    if (activity.timestamp && activity.type) {
      return `activity-${activity.timestamp}-${activity.type}-${index}`;
    }
    // Fallback to index with a prefix
    return `activity-${index}-${Date.now()}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Activity
      </h3>
      
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3"><X className='w-12 h-12 text-blue-500 mx-auto mb-4'/></div>
          <p className="text-gray-500">No recent activity</p>
          <p className="text-sm text-gray-400 mt-1">
            Your activity will appear here as you use the platform
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div
              key={generateActivityKey(activity, index)}
              className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                {activity.icon || '📝'}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.message}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500">{activity.time}</span>
                  {activity.status && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(activity.status)}`}>
                      {getStatusText(activity.status)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {activities.length > 0 && (
        <button className="w-full mt-4 text-center text-sm text-blue-600 hover:text-blue-900 font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors">
          View All Activity →
        </button>
      )}
    </div>
  );
}
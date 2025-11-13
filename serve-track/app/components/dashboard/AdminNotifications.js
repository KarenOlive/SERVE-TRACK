'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/app/hooks/useToast';
import { CheckCircle, XCircle, Clock, Building } from 'lucide-react';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast, ToastContainer } = useToast();

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error('Failed to fetch notifications');
      
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      addToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (notificationId, entityId, action) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, entityId }),
      });

      if (!res.ok) throw new Error('Failed to process verification');

      addToast(
        action === 'approve' 
          ? 'Organization verified successfully' 
          : 'Verification rejected',
        'success'
      );
      
      // Remove from local state
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">Loading verification requests...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Verification Requests</h1>
      
      {notifications.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">No pending verification requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div key={notification.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {notification.organization_name}
                    </h3>
                    <p className="text-gray-600 mt-1">{notification.message}</p>
                    <div className="mt-3 space-y-1 text-sm text-gray-500">
                      <p><strong>Email:</strong> {notification.contact_email}</p>
                      <p><strong>Website:</strong> {notification.website || 'Not provided'}</p>
                      <p><strong>Address:</strong> {notification.address || 'Not provided'}</p>
                      {notification.description && (
                        <p><strong>Description:</strong> {notification.description}</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Requested: {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleVerification(notification.id, notification.entity_id, 'approve')}
                    className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleVerification(notification.id, notification.entity_id, 'reject')}
                    className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <ToastContainer />
    </div>
  );
}
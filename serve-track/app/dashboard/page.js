'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StudentDashboard from '../components/dashboard/StudentDashboard';
import SiteDashboard from '../components/dashboard/SiteDashboard';
import AdminDashboard from '../components/dashboard/AdminDashboard';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-royal-blue"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderDashboard = () => {
    switch (user.userType) {
      case 'student':
        return <StudentDashboard user={user} />;
      case 'nonprofit':
        return <SiteDashboard user={user} />;
      case 'admin':
        return <AdminDashboard user={user} />;
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900">
              Unknown user type: {user.userType}
            </h2>
            <p className="text-gray-600 mt-2">
              Please contact support if this seems wrong.
            </p>
          </div>
        );
    }
  };

  return renderDashboard();
}
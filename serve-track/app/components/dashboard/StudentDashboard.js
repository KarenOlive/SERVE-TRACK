export default function StudentDashboard({ user }) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Student Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900">Verified Hours</h3>
              <p className="text-2xl font-bold text-blue-600">
                {user.profile?.total_verified_hours || 0}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-900">University</h3>
              <p className="text-lg font-medium text-green-600">
                {user.profile?.university_name || 'Not set'}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900">Major</h3>
              <p className="text-lg font-medium text-purple-600">
                {user.profile?.major || 'Not set'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
export default function SiteDashboard({ user }) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Organization Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-900">Organization</h3>
              <p className="text-xl font-bold text-green-600">
                {user.profile?.organization_name || 'Not set'}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900">Status</h3>
              <p className="text-lg font-medium text-blue-600">
                {user.profile?.verified ? 'Verified' : 'Pending Verification'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
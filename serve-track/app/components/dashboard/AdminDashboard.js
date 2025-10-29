export default function AdminDashboard({ user }) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900">Administrator Panel</h3>
            <p className="text-gray-600 mt-2">
              Welcome to the administrator dashboard. Manage universities, users, and system settings from here.
            </p>
          </div>
        </div>
      </div>
    );
  }
'use client';
import Link from "next/link";
export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Join ServeTrack
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choose how you'd like to join our platform
          </p>
        </div>

        <div className="space-y-4">
          {/* Student Registration Card */}
          <div className="bg-white p-6 rounded-lg shadow border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-600 mb-2">Student Registration</h3>
            <p className="text-gray-600 mb-4">
              Join as a university student to find volunteer opportunities and track your service hours.
            </p>
            <Link
                      href={`/register/student`}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white border border-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >Register as a Student
            </Link>
          </div>

          {/* Nonprofit Registration Card */}
          <div className="bg-white p-6 rounded-lg shadow border border-green-200">
            <h3 className="text-lg font-semibold text-green-600 mb-2">Organization Registration</h3>
            <p className="text-gray-600 mb-4">
              Register your nonprofit organization to post opportunities and manage volunteers.
            </p>
            <Link
                      href={`/register/sites`}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white border border-green-600 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Register Organization
            </Link>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href={`/login`} className="flex items-center justify-center gap-2 px-4 py-2 font-medium text-blue-600 border border-blue-700 rounded-lg hover:text-blue-800 transition-colors" >
            Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
"use client";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    // Check for registration success message
    const message = searchParams.get('message');
    const type = searchParams.get('type');
    
    if (message === 'registration_success') {
      if (type === 'student') {
        setSuccessMessage('Student account created successfully! Please log in to continue.');
      } else if (type === 'nonprofit') {
        setSuccessMessage('Organization account created successfully! Please log in to continue.');
      } else {
        setSuccessMessage('Registration successful! Please log in to continue.');
      }
    }
  }, [searchParams]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        // Store token and user data in localStorage
        localStorage.setItem('token', result.token);
        console.log('User role:', result.user.userType); // Should log 'student' or 'nonprofit'
        localStorage.setItem('user', JSON.stringify(result.user));
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white shadow-lg rounded-2xl p-10 w-full max-w-md">
        <h1 className="text-2xl font-bold text-[#264E86] mb-6 text-center">Login</h1>
        
        {/* Success Message */}
        {successMessage && (
          <div className="rounded-md bg-green-50 p-4 border border-green-200 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">{successMessage}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block mb-2 font-medium text-gray-700">Email</label>
            <input
              type="email"
              {...register("email", { 
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address"
                }
              })}
              className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#264E86] focus:border-transparent outline-none transition-colors"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>
          
          <div>
            <label className="block mb-2 font-medium text-gray-700">Password</label>
            <input
              type="password"
              {...register("password", { 
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters"
                }
              })}
              className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#264E86] focus:border-transparent outline-none transition-colors"
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#264E86] text-white py-3 rounded-lg hover:bg-blue-900 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </div>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-gray-200">
          <p className="text-gray-600 mb-4">Don't have an account?</p>
          <div className="space-y-3">
            <Link 
              href="/register/student" 
              className="block w-full bg-blue-700 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition text-center font-medium"
            >
              Register as Student
            </Link>
            <Link 
              href="/register/sites" 
              className="block w-full bg-green-700 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition text-center font-medium"
            >
              Register as Organization
            </Link>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link href="/forgot-password" className="text-sm text-[#264E86] hover:underline transition-colors">
            Forgot password?
          </Link>
        </div>
      </div>
    </main>
  );
}
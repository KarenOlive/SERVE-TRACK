'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentRegister() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic info
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    
    // Step 2: Academic info
    studentId: '',
    universityId: '',
    major: ''
  });
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);

  const router = useRouter();

  // Fetch universities
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const response = await fetch('/api/universities');
        if (response.ok) {
          const data = await response.json();
          setUniversities(data);
        }
      } catch (error) {
        console.error('Error fetching universities:', error);
      }
    };
    fetchUniversities();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Step 1: Create basic account
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: 'student'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setStep(2); // Move to academic info step
      } else {
        const error = await response.json();
        alert(error.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Complete academic profile
  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/complete-profile/student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: formData.studentId,
          universityId: formData.universityId,
          major: formData.major
        }),
      });

      if (response.ok) {
        // Redirect to login with success message instead of dashboard
        router.push('/login?message=registration_success&type=student');
      } else {
        const error = await response.json();
        alert(error.error || 'Profile completion failed');
      }
    } catch (error) {
      console.error('Profile completion error:', error);
      alert('Profile completion failed');
    } finally {
      setLoading(false);
    }
  };

  const skipProfileCompletion = () => {
    // Redirect to login with success message instead of dashboard
    router.push('/login?message=registration_success&type=student');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          <div className={`flex flex-col items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="text-xs mt-1">Account</span>
          </div>
          <div className={`flex flex-col items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="text-xs mt-1">Academic Info</span>
          </div>
        </div>

        {/* Step 1 form remains the same */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-6">
            <div>
              <h2 className="text-center text-2xl font-bold text-gray-900">
                Create Student Account
              </h2>
              <p className="text-center text-sm text-gray-600 mt-2">
                Step 1: Basic Information
              </p>
            </div>

            <div className="space-y-4">
              <input
                name="firstName"
                type="text"
                required
                placeholder="First Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                value={formData.firstName}
                onChange={handleChange}
              />
              <input
                name="lastName"
                type="text"
                required
                placeholder="Last Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                value={formData.lastName}
                onChange={handleChange}
              />
              <input
                name="email"
                type="email"
                required
                placeholder="Email Address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.email}
                onChange={handleChange}
              />
              <input
                name="password"
                type="password"
                required
                placeholder="Password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Continue to Academic Info'}
            </button>
          </form>
        )}

        {/* Step 2 form remains the same */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-6">
            <div>
              <h2 className="text-center text-2xl font-bold text-gray-900">
                Academic Information
              </h2>
              <p className="text-center text-sm text-gray-600 mt-2">
                Step 2: Tell us about your studies
              </p>
            </div>

            <div className="space-y-4">
              <input
                name="studentId"
                type="text"
                required
                placeholder="Student ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                value={formData.studentId}
                onChange={handleChange}
              />
              
              <select
                name="universityId"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                value={formData.universityId}
                onChange={handleChange}
              >
                <option value="">Select University</option>
                {universities.map((uni) => (
                  <option key={uni.id} value={uni.id}>
                    {uni.name}
                  </option>
                ))}
              </select>

              <input
                name="major"
                type="text"
                placeholder="Major (Optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                value={formData.major}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Completing Profile...' : 'Complete Registration'}
              </button>
              
              <button
                type="button"
                onClick={skipProfileCompletion}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
              >
                Complete Later
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
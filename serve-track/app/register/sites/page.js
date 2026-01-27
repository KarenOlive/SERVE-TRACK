'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SiteRegister() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic info
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    
    // Step 2: Organization basics
    organization_name: '',
    location: '',
    contact_phone: '',
    
    // Step 3: Additional details
    organization_description: '',
    website: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);

  const router = useRouter();

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
          role: 'nonprofit'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setStep(2); // Move to organization basics
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

  // Step 2: Complete organization basics
  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/complete-profile/site/basic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          organization_name: formData.organization_name,
          location: formData.location,
          contact_phone: formData.contact_phone 

        }),
      });

      if (response.ok) {
        setStep(3); // Move to additional details
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

  // Step 3: Complete additional details (optional)
  const handleStep3Submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/complete-profile/site/full', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          organization_description: formData.organization_description,
          website: formData.website,
          address: formData.address
        }),
      });

      if (response.ok) {
        // Redirect to login with success message instead of dashboard
        router.push('/login?message=registration_success&type=nonprofit');
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

  const skipStep3 = () => {
    // Redirect to login with success message instead of dashboard
    router.push('/login?message=registration_success&type=nonprofit');
  };

  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          <div className={`flex flex-col items-center ${step >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="text-xs mt-1">Account</span>
          </div>
          <div className={`flex flex-col items-center ${step >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="text-xs mt-1">Organization</span>
          </div>
          <div className={`flex flex-col items-center ${step >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
              3
            </div>
            <span className="text-xs mt-1">Details</span>
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-6">
            <div>
              <h2 className="text-center text-2xl font-bold text-gray-900">
                Create Organization Account
              </h2>
              <p className="text-center text-sm text-gray-600 mt-2">
                Step 1: Contact Person Information
              </p>
            </div>

            <div className="space-y-4">
              <input
                name="firstName"
                type="text"
                required
                placeholder="First Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={formData.firstName}
                onChange={handleChange}
              />
              <input
                name="lastName"
                type="text"
                required
                placeholder="Last Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={formData.lastName}
                onChange={handleChange}
              />
              <input
                name="email"
                type="email"
                required
                placeholder="Email Address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={formData.email}
                onChange={handleChange}
              />
              <input
                name="password"
                type="password"
                required
                placeholder="Password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {loading ? 'Creating Account...' : 'Continue to Organization Info'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-6">
            <div>
              <h2 className="text-center text-2xl font-bold text-gray-900">
                Organization Information
              </h2>
              <p className="text-center text-sm text-gray-600 mt-2">
                Step 2: Tell us about your organization
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name *
                </label>
                <input
                  name="organization_name"
                  type="text"
                  required
                  placeholder="e.g., Green Earth Initiative"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.organization_name}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  name="location"
                  type="text"
                  required
                  placeholder="e.g., Nairobi, Kenya"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone *
                </label>
                <input
                  name="contact_phone"
                  type="tel"
                  required
                  placeholder="+254 700 000000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.contact_phone}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This phone number will be visible to students for coordination
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {loading ? 'Saving...' : 'Continue to Additional Details'}
              </button>
              
              <button
                type="button"
                onClick={skipStep3}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Skip Additional Details
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleStep3Submit} className="space-y-6">
            <div>
              <h2 className="text-center text-2xl font-bold text-gray-900">
                Additional Details
              </h2>
              <p className="text-center text-sm text-gray-600 mt-2">
                Step 3: Help students learn more about your organization (Optional)
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Description
                </label>
                <textarea
                  name="organization_description"
                  rows="3"
                  placeholder="Describe your mission, activities, and impact..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.organization_description}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  name="website"
                  type="url"
                  placeholder="https://example.org"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.website}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  rows="2"
                  placeholder="Full physical address..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {loading ? 'Completing Registration...' : 'Complete Registration'}
              </button>
              
              <button
                type="button"
                onClick={skipStep3}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Skip These Details
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

}
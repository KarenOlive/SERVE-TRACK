'use client';

import { useState } from 'react';
import OpportunityForm from './OpportunityForm';

export default function OpportunityModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  opportunity = null // new
}) {
  const isEditMode = !!opportunity;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const url = isEditMode 
        ? `/api/site/opportunities/${opportunity.id}`
        : '/api/site/opportunities';
      const method = isEditMode ? 'PUT' : 'POST';

      console.log('Submitting opportunity:', { method, url, formData });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save opportunity');

       // Always use backend response
      onSuccess(data.opportunity);
      onClose();
    
    } catch (error) {
      console.error('Save opportunity error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Opportunity' : 'Create New Opportunity'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <OpportunityForm 
            onSubmit={handleSubmit}
            onCancel={onClose}
            loading={loading}
            initialData={opportunity || {}} //  prefill when editing
          />
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

export default function AdminRejectVerificationModal({ isOpen, onClose, onConfirm, defaultReason = '' }) {
  const [reason, setReason] = useState(defaultReason);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm({ rejection_reason: reason });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30">
      <div className="bg-white rounded-lg w-full max-w-lg shadow-xl">
        <div className="p-5">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold">Reject Verification</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
          </div>

          <p className="mt-3 text-sm text-gray-600">
            Provide a clear reason the verification was rejected so the organization can fix it and re-request verification.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Reason</label>
              <textarea
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                placeholder="e.g. Missing registration certificate, incomplete address, etc."
                className="w-full mt-1 p-2 border rounded-md border-gray-300 focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

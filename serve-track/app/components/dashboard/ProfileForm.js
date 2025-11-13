'use client';

import { X } from 'lucide-react';

export default function ProfileForm({ profile, onSave, saving, onCancel }) {
  return (
    <div className="relative">
      {/* ❌ Close Icon */}
      <button
        type="button"
        onClick={onCancel}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
      >
        <X size={20} />
      </button>

      <form onSubmit={onSave} className="space-y-5 pt-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
          <input
            type="text"
            name="organization_name"
            defaultValue={profile?.organization_name || ''}
            className="w-full border border-gray-300 rounded-lg p-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="organization_description"
            defaultValue={profile?.organization_description || ''}
            className="w-full border border-gray-300 rounded-lg p-2"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
          <input
            type="text"
            name="contact_phone"
            defaultValue={profile?.contact_phone || ''}
            className="w-full border border-gray-300 rounded-lg p-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea
            name="address"
            defaultValue={profile?.address || ''}
            className="w-full border border-gray-300 rounded-lg p-2"
            rows={2}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            name="location"
            defaultValue={profile?.location || ''}
            className="w-full border border-gray-300 rounded-lg p-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <input
            type="url"
            name="website"
            defaultValue={profile?.website || ''}
            className="w-full border border-gray-300 rounded-lg p-2"
          />
        </div>

        {/* ✅ Buttons */}
        <div className="flex justify-between pt-3">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

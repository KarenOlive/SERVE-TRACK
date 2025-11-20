'use client';

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

export default function ProfileFormDynamic({ schema, profile = {}, universities = [], onSave, saving = false, onCancel }) {
  const [form, setForm] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setForm(profile || {});
  }, [profile]);

  const updateField = (name, value) => {
    setForm(prev => ({ 
      ...prev, 
      [name]: value 
    }));
    setHasChanges(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const handleCancelClick = () => {
    setForm(profile || {});
    setHasChanges(false);
    onCancel();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative">
      {/* Close button */}
      <button 
        type="button" 
        onClick={handleCancelClick}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={20} />
      </button>

      <form onSubmit={handleSubmit} className="space-y-6">
        {schema.fields.map(field => (
          <div key={field.name} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.type === 'textarea' && (
              <textarea 
                value={form[field.name] || ''} 
                onChange={(e) => updateField(field.name, e.target.value)}
                rows={field.rows || 3} 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={field.placeholder}
              />
            )}

            {field.type === 'select' && (
              <select 
                value={form[field.name] || ''} 
                onChange={(e) => updateField(field.name, e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select {field.label.toLowerCase()}...</option>
                {universities.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.code ? `(${u.code})` : ''}
                  </option>
                ))}
              </select>
            )}

            {field.type === 'checkbox' && (
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={!!form[field.name]} 
                  onChange={(e) => updateField(field.name, e.target.checked ? 1 : 0)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  {field.label}
                </label>
              </div>
            )}

            {['text','email','url','number'].includes(field.type) && (
              <input 
                type={field.type} 
                value={form[field.name] || ''} 
                onChange={(e) => updateField(field.name, e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={field.placeholder}
              />
            )}
          </div>
        ))}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button 
            type="button" 
            onClick={handleCancelClick}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-purple-100 transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={saving || !hasChanges}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
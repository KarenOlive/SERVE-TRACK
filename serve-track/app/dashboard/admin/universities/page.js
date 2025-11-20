'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/app/hooks/useToast';
import { Building, School, MapPin, Phone, Mail, Globe, Edit, Trash2, Plus, Search, Users, BookOpen, Loader2, GraduationCap, Shield} from 'lucide-react';

export default function UniversitiesManagementPage() {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast, ToastContainer } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    required_hours: '',
    contact_email: ''
  });

  const fetchUniversities = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/universities', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch universities');

      const data = await response.json();
      setUniversities(data.universities || []);
    } catch (error) {
      console.error('Error fetching universities:', error);
      addToast('Failed to load universities', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUniversities();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!selectedUniversity;

    try {
      const token = localStorage.getItem('token');
      const url = isEdit 
        ? `/api/admin/universities/${selectedUniversity.id}`
        : '/api/admin/universities';
      
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save university');
      }

      addToast(`University ${isEdit ? 'updated' : 'created'} successfully`, 'success');
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedUniversity(null);
      setFormData({
        name: '',
        code: '',
        required_hours: '',
        contact_email: ''
      });
      fetchUniversities();
    } catch (error) {
      addToast(error.message, 'error');
    }
  };

  const handleDelete = async (universityId) => {
    if (!confirm('Are you sure you want to delete this university? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/universities/${universityId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete university');

      addToast('University deleted successfully', 'success');
      fetchUniversities();
    } catch (error) {
      addToast('Failed to delete university', 'error');
    }
  };

  const handleEdit = (university) => {
    setSelectedUniversity(university);
    setFormData({
      name: university.name || '',
      code: university.code || '',
      required_hours: university.required_hours || '',
      contact_email: university.contact_email || ''

    });
    setShowEditModal(true);
  };

  const filteredUniversities = universities.filter(university =>
    university.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    university.code.toLowerCase().includes(searchTerm.toLowerCase())  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="ml-2 text-gray-600">Loading universities...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">University Management</h1>
          <p className="text-gray-600 mt-1">Manage universities and their information</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add University
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search universities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Universities Grid */}
      {filteredUniversities.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No universities found' : 'No universities yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Get started by adding your first university'
            }
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Add University
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUniversities.map((university) => (
            <div key={university.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <School className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{university.name}</h3>
                      <p className="text-sm text-gray-500 uppercase font-mono">{university.code}</p>
                    </div>
                  </div>
                  
                  {university.contact_email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{university.contact_email}</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(university)}
                      className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                      title="Edit University"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(university.id)}
                      className="p-2 text-red-600 hover:text-red-800 transition-colors"
                      title="Delete University"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
        

                <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between text-sm text-gray-600 mx-2 mb-2">
                    <div className="flex items-center space-x-2">
                        <BookOpen className="w-5 h-5" />
                        <span>{university.student_count || 0} students</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5" />
                        <span>{university.admin_count || 0} admins</span>
                    </div>
                </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {showEditModal ? 'Edit University' : 'Add New University'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    University Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    University Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                    placeholder="e.g., UOA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Required Hours *
                  </label>
                  <input
                    type="number"
                    value={formData.required_hours}
                    onChange={(e) => setFormData({ ...formData, required_hours: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedUniversity(null);
                    setFormData({
                      name: '', code: '', required_hours: '', contact_email: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {showEditModal ? 'Update University' : 'Add University'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
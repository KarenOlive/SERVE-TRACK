'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import OpportunityModal from '../../../components/opportunities/OpportunityModal';
import { useToast } from '@/app/hooks/useToast';

export default function ManageOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToast, ToastContainer } = useToast();

  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/site/opportunities', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch opportunities');
      }

      const data = await response.json();
      setOpportunities(data.opportunities || []);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      setError('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleOpportunitySaved = (updatedOpportunity) => {
    setOpportunities((prev) => {
      const exists = prev.find((opp) => opp.id === updatedOpportunity.id);
      if (exists) {
        //  Replace entire record
        return prev.map((opp) =>
        opp.id === updatedOpportunity.id ? updatedOpportunity : opp
       );
      } else {
        // Add new
        return [updatedOpportunity, ...prev];
      }
    });
    addToast(
      updatedOpportunity.id ? 'Opportunity updated successfully!' : 'Opportunity created successfully!',
      'success'
    );
  };

  const handleEditOpportunity = async (opportunityId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/site/opportunities/${opportunityId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch opportunity details');

      const data = await response.json();
      setSelectedOpportunity(data.opportunity);
      setShowModal(true);
    } catch (error) {
      console.error('Error loading opportunity for edit:', error);
      addToast('Failed to load opportunity details', 'error');
    }
  };
  
  

  const handleDeleteOpportunity = async (opportunityId) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/site/opportunities/${opportunityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete opportunity');
      }

      setOpportunities(prev => prev.filter(opp => opp.id !== opportunityId));
      addToast('Opportunity deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      addToast('Failed to delete opportunity', 'error');
    }
  };

  const handleUpdateOpportunityStatus = async (opportunityId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/site/opportunities/${opportunityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update opportunity');
      }

      setOpportunities(prev => 
        prev.map(opp => 
          opp.id === opportunityId ? { ...opp, status: newStatus } : opp
        )
      );
      addToast(`Opportunity ${newStatus === 'active' ? 'activated' : 'deactivated'}!`, 'success');
    } catch (error) {
      console.error('Error updating opportunity:', error);
      addToast('Failed to update opportunity', 'error');
    }
  };


  const getStatusBadge = (status) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      draft: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  //  Handle Create Button
  const handleCreateOpportunity = () => {
    setSelectedOpportunity(null);
    setShowModal(true);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-600">Loading opportunities...</p>
        </div>
      </div>
    );
  }

 
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Opportunities</h1>
          <p className="text-gray-600 mt-1">
            Create and manage your volunteer opportunities
          </p>
        </div>
        <button
          onClick={handleCreateOpportunity}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          + Create Opportunity
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchOpportunities}
            className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Opportunities List */}
      {opportunities.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities yet</h3>
          <p className="text-gray-600 mb-4">Create your first volunteer opportunity to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Create Your First Opportunity
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opportunity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applications
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {opportunities.map((opportunity) => (
                  <tr key={opportunity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {opportunity.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {opportunity.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {opportunity.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-600 font-medium">
                          {opportunity.application_count || 0}
                        </span>
                        <span className="text-gray-400">applications</span>
                        {opportunity.pending_applications > 0 && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                            {opportunity.pending_applications} pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(opportunity.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {opportunity.created_at ? new Date(opportunity.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleUpdateOpportunityStatus(
                            opportunity.id, 
                            opportunity.status === 'active' ? 'inactive' : 'active'
                          )}
                          className={`px-3 py-1 rounded text-xs ${
                            opportunity.status === 'active' 
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {opportunity.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button type="button"
                          onClick={() => handleEditOpportunity(opportunity.id)}
                          className="text-blue-600 hover:text-blue-900">
                          Edit
                        </button>
                        <button  onClick={() => handleDeleteOpportunity(opportunity.id)}
                          className="text-red-600 hover:text-red-900 text-xs px-2">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shared Modal for Create + Edit */}
      {showModal && (
        <OpportunityModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={handleOpportunitySaved}
          opportunity={selectedOpportunity} // null = create, object = edit
        />
      )}

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useLeadStore } from '../../store/useLeadStore';
import { useAdminStore } from '../../store/useAdminStore';
import { AddPatientForm } from './AddPatientForm';
import { Search, Download, Plus, ChevronDown, ChevronUp, LayoutGrid, LayoutList, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useNotificationStore } from '../../store/useNotificationStore';

export function LeadManagement() {
  const { leads, fetchLeads, isLoading, error } = useLeadStore();
  const { partners } = useAdminStore();
  const { sendNotification } = useNotificationStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'createdAt', direction: 'desc' });

  useEffect(() => {
    fetchLeads('admin');
  }, []);

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSendMessage = async (partnerId: string) => {
    try {
      await sendNotification(
        partnerId,
        'Message from Admin',
        'Please review your assigned leads and update their status accordingly.',
        'admin'
      );
      setSuccess('Message sent successfully');
    } catch (error) {
      setError('Failed to send message');
    }
  };

  const filteredLeads = leads.filter(lead => {
    const searchMatch = 
      `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return searchMatch;
  }).sort((a, b) => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1;
    switch (sortConfig.key) {
      case 'name':
        return direction * (`${a.firstName} ${a.lastName}`).localeCompare(`${b.firstName} ${b.lastName}`);
      case 'createdAt':
        return direction * (a.createdAt.getTime() - b.createdAt.getTime());
      case 'status':
        return direction * a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Lead Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Lead
        </button>
      </div>

      <div className="flex space-x-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <span>Patient</span>
                  {sortConfig.key === 'name' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact Info
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Site
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <span>Status</span>
                  {sortConfig.key === 'status' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <span>Created</span>
                  {sortConfig.key === 'createdAt' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {lead.firstName} {lead.lastName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    <div>{lead.phone}</div>
                    <div>{lead.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {partners.find(p => p.id === lead.partnerId)?.name || 'Unassigned'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                    lead.status === 'not_contacted' ? 'bg-yellow-100 text-yellow-800' :
                    lead.status === 'contacted' ? 'bg-green-100 text-green-800' :
                    lead.status === 'qualified' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {lead.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(lead.createdAt, 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleSendMessage(lead.partnerId)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Send message"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="max-w-4xl w-full mx-4">
            <AddPatientForm onClose={() => setShowAddModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
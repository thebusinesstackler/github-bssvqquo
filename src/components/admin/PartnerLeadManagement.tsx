import React, { useState, useEffect } from 'react';
import { useLeadStore } from '../../store/useLeadStore';
import { useAdminStore } from '../../store/useAdminStore';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  UserPlus, 
  Flame, 
  Thermometer, 
  Snowflake,
  Clock,
  BarChart4,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Trash2,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { Lead, LeadQuality, Partner, LeadStatus } from '../../types';
import { LeadAssignmentModal } from './LeadAssignmentModal';
import { LeadHistoryModal } from './LeadHistoryModal';
import { LeadQualityRating } from './LeadQualityRating';

export function PartnerLeadManagement() {
  const { leads, updateLeadQuality, reassignLead, fetchLeads } = useLeadStore();
  const { partners, fetchPartners } = useAdminStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<string>('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [qualityFilter, setQualityFilter] = useState<LeadQuality | 'all'>('all');
  
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPartners(), fetchLeads('admin')])
      .catch(err => {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [fetchPartners, fetchLeads]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleQualityChange = async (leadId: string, quality: LeadQuality) => {
    try {
      await updateLeadQuality(leadId, quality);
      setSuccess(`Lead quality updated to ${quality}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update lead quality');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleLeadReassign = async (leadId: string, newPartnerId: string, reason?: string) => {
    try {
      await reassignLead(leadId, newPartnerId, reason);
      setSuccess('Lead reassigned successfully');
      setTimeout(() => setSuccess(null), 3000);
      setShowAssignModal(false);
    } catch (err) {
      setError('Failed to reassign lead');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await fetchLeads('admin');
      setSuccess('Data refreshed successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to refresh data');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort leads
  const filteredLeads = leads.filter(lead => {
    const matchesPartner = selectedPartner === 'all' || lead.partnerId === selectedPartner;
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesQuality = qualityFilter === 'all' || lead.quality === qualityFilter;
    const matchesSearch = 
      searchTerm === '' || 
      `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm);
    return matchesPartner && matchesStatus && matchesQuality && matchesSearch;
  }).sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'name':
        return direction * `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      case 'createdAt':
        return direction * (a.createdAt.getTime() - b.createdAt.getTime());
      case 'status':
        return direction * a.status.localeCompare(b.status);
      case 'quality':
        const qualityOrder = { hot: 0, warm: 1, cold: 2 };
        return direction * (
          (qualityOrder[a.quality as LeadQuality] ?? 999) - 
          (qualityOrder[b.quality as LeadQuality] ?? 999)
        );
      case 'partner':
        const partnerA = partners.find(p => p.id === a.partnerId)?.name || '';
        const partnerB = partners.find(p => p.id === b.partnerId)?.name || '';
        return direction * partnerA.localeCompare(partnerB);
      default:
        return 0;
    }
  });

  // Calculate partner quota status
  const getPartnerQuotaStatus = (partner: Partner) => {
    const percentage = (partner.currentLeads / partner.maxLeads) * 100;
    if (percentage >= 90) return 'danger';
    if (percentage >= 75) return 'warning';
    return 'good';
  };

  // Get partner by ID
  const getPartnerById = (id: string) => {
    return partners.find(p => p.id === id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Lead Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track leads assigned to partners
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => {
              setSelectedLead(null);
              setShowAssignModal(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Assign Lead
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="w-full md:w-auto flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="w-full md:w-auto">
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              className="w-full md:w-48 rounded-lg border border-gray-300 px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Partners</option>
              {partners.map(partner => (
                <option key={partner.id} value={partner.id}>
                  {partner.name} ({partner.currentLeads}/{partner.maxLeads})
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
              className="w-full md:w-40 rounded-lg border border-gray-300 px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="not_contacted">Not Contacted</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <div className="w-full md:w-auto">
            <select
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value as LeadQuality | 'all')}
              className="w-full md:w-40 rounded-lg border border-gray-300 px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Quality</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
            </select>
          </div>
        </div>

        {/* Partner quota summary (only shown if a specific partner is selected) */}
        {selectedPartner !== 'all' && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            {(() => {
              const partner = partners.find(p => p.id === selectedPartner);
              if (!partner) return null;

              const quotaPercentage = (partner.currentLeads / partner.maxLeads) * 100;
              const quotaStatus = getPartnerQuotaStatus(partner);
              
              return (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div>
                    <h3 className="font-medium text-gray-900">{partner.name}</h3>
                    <p className="text-sm text-gray-500">
                      Lead quota: {partner.currentLeads} / {partner.maxLeads} ({Math.round(quotaPercentage)}%)
                    </p>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <div className="w-full md:w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          quotaStatus === 'danger' ? 'bg-red-500' : 
                          quotaStatus === 'warning' ? 'bg-yellow-500' : 
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, quotaPercentage)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>{partner.maxLeads}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    className="flex items-center space-x-1"
                    onClick={() => handleSort('name')}
                  >
                    <span>Lead</span>
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    className="flex items-center space-x-1"
                    onClick={() => handleSort('partner')}
                  >
                    <span>Assigned To</span>
                    {sortField === 'partner' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    className="flex items-center space-x-1"
                    onClick={() => handleSort('status')}
                  >
                    <span>Status</span>
                    {sortField === 'status' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    className="flex items-center space-x-1"
                    onClick={() => handleSort('quality')}
                  >
                    <span>Quality</span>
                    {sortField === 'quality' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    className="flex items-center space-x-1"
                    onClick={() => handleSort('createdAt')}
                  >
                    <span>Assigned</span>
                    {sortField === 'createdAt' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.length > 0 ? (
                filteredLeads.map(lead => {
                  const partner = getPartnerById(lead.partnerId);
                  const partnerQuotaStatus = partner ? getPartnerQuotaStatus(partner) : 'good';
                  
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {lead.firstName} {lead.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {lead.indication || 'No indication'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lead.phone}</div>
                        <div className="text-sm text-gray-500">{lead.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {partner?.name || 'Unknown'}
                          </div>
                          <div className={`ml-2 w-2 h-2 rounded-full ${
                            partnerQuotaStatus === 'danger' ? 'bg-red-500' : 
                            partnerQuotaStatus === 'warning' ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`}></div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Quota: {partner?.currentLeads || 0}/{partner?.maxLeads || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                          lead.status === 'not_contacted' ? 'bg-yellow-100 text-yellow-800' :
                          lead.status === 'contacted' ? 'bg-green-100 text-green-800' :
                          lead.status === 'qualified' ? 'bg-purple-100 text-purple-800' :
                          lead.status === 'converted' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {lead.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <LeadQualityRating
                          quality={lead.quality || 'warm'}
                          onQualityChange={(newQuality) => handleQualityChange(lead.id, newQuality)}
                          disabled={loading}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-400 mr-1" />
                          <span>{format(lead.createdAt, 'MMM d, yyyy')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setShowHistoryModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="View History"
                          >
                            <BarChart4 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setShowAssignModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Reassign Lead"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    {loading ? 'Loading leads...' : 'No leads found matching the criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Lead Modal */}
      {showAssignModal && (
        <LeadAssignmentModal 
          lead={selectedLead}
          partners={partners}
          onClose={() => setShowAssignModal(false)}
          onAssign={handleLeadReassign}
        />
      )}

      {/* Lead History Modal */}
      {showHistoryModal && selectedLead && (
        <LeadHistoryModal
          leadId={selectedLead.id}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  );
}
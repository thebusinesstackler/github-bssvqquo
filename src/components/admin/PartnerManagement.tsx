import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminStore } from '../../store/useAdminStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  Users,
  Clock,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Download,
  Bell,
  Filter,
  Search,
  RefreshCw,
  LogIn,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { PartnerAddModal } from './PartnerAddModal';

export function PartnerManagement() {
  const navigate = useNavigate();
  const { 
    partners, 
    adminMetrics, 
    fetchPartners, 
    updatePartnerSubscription,
    updatePartnerLeadQuota,
    deletePartner 
  } = useAdminStore();
  const { startImpersonation } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterSubscription, setFilterSubscription] = useState<'all' | 'none' | 'basic' | 'professional' | 'enterprise'>('all');
  const [sortField, setSortField] = useState<'name' | 'leads' | 'responseRate'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // New state for quota editing
  const [editingQuota, setEditingQuota] = useState<{[partnerId: string]: number}>({});
  const [showQuotaModal, setShowQuotaModal] = useState<string | null>(null);
  const [newQuota, setNewQuota] = useState<number>(0);
  
  // New state for plan changing
  const [showPlanModal, setShowPlanModal] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'none' | 'basic' | 'professional' | 'enterprise'>('none');
  
  // State for add partner modal
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);

  useEffect(() => {
    fetchPartners();
    
    // Set up auto-refresh interval
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchPartners();
      }, 60000); // refresh every minute
      
      return () => clearInterval(interval);
    }
  }, [fetchPartners, autoRefresh]);

  const handleImpersonation = (partner: any) => {
    startImpersonation({
      id: partner.id,
      name: partner.name,
      email: partner.email,
      role: 'partner',
      createdAt: partner.createdAt,
      active: partner.active,
      subscription: partner.subscription
    });
    navigate('/dashboard');
  };
  
  const handleDeletePartner = async (partnerId: string) => {
    setIsDeleting(partnerId);
    try {
      await deletePartner(partnerId);
      setSuccess("Partner deleted successfully");
      setShowDeleteConfirm(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete partner");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsDeleting(null);
    }
  };
  
  const handleChangeQuota = async (partnerId: string) => {
    try {
      await updatePartnerLeadQuota(partnerId, newQuota);
      setSuccess("Lead quota updated successfully");
      setShowQuotaModal(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to update lead quota");
      setTimeout(() => setError(null), 3000);
    }
  };
  
  const handleChangePlan = async (partnerId: string) => {
    try {
      await updatePartnerSubscription(partnerId, selectedPlan);
      setSuccess(`Subscription plan updated to ${selectedPlan}`);
      setShowPlanModal(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to update subscription plan");
      setTimeout(() => setError(null), 3000);
    }
  };
  
  const handleViewPartnerLeads = (partnerId: string) => {
    navigate(`/admin/partner-leads/${partnerId}`);
  };

  const handleSort = (field: 'name' | 'leads' | 'responseRate') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const getSubscriptionBadgeClass = (tier: string) => {
    switch(tier) {
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'professional': return 'bg-blue-100 text-blue-800';
      case 'basic': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusBadgeClass = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'past_due': return 'bg-yellow-100 text-yellow-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPartners = partners.filter(partner => {
    const searchMatch = (partner.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                       (partner.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const statusMatch = filterStatus === 'all' || 
                       (filterStatus === 'active' && partner.active) || 
                       (filterStatus === 'inactive' && !partner.active);
    
    const subscriptionMatch = filterSubscription === 'all' || 
                             partner.subscription === filterSubscription ||
                             (filterSubscription === 'none' && !partner.subscription);
    
    return searchMatch && statusMatch && subscriptionMatch;
  }).sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    
    switch (sortField) {
      case 'name':
        return direction * ((a.name || '').localeCompare(b.name || ''));
      case 'leads':
        return direction * ((a.currentLeads || 0) - (b.currentLeads || 0));
      case 'responseRate':
        // Sort by response metrics if available
        const aRate = a.responseMetrics?.responseRate || 0;
        const bRate = b.responseMetrics?.responseRate || 0;
        return direction * (aRate - bRate);
      default:
        return 0;
    }
  });
  
  // Stats Cards Data
  const statsCards = [
    {
      title: 'Total Partners',
      value: partners.length,
      change: '+12%',
      trend: 'up',
      icon: Activity
    },
    {
      title: 'Active Partners',
      value: partners.filter(p => p.active).length,
      change: '+2',
      trend: 'up',
      icon: Users
    },
    {
      title: 'Avg Response Time',
      value: `${adminMetrics.averageResponseTime}h`,
      change: '-5h',
      trend: 'up',
      icon: Clock
    },
    {
      title: 'Monthly Revenue',
      value: `$${adminMetrics.totalRevenue.toLocaleString()}`,
      change: '+8%',
      trend: 'up',
      icon: DollarSign
    }
  ];
  
  // Add Partner Success Handler
  const handleAddPartnerSuccess = () => {
    setSuccess("Partner added successfully");
    fetchPartners();
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <div className="space-y-6 container mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage research site partners and their subscriptions
          </p>
        </div>
        <button
          onClick={() => setShowAddPartnerModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Add Partner
        </button>
      </div>
  
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <div key={stat.title} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="bg-blue-100 p-3 rounded-full">
                <stat.icon className="w-6 h-6 text-blue-600" />
              </div>
              <span className={`flex items-center text-sm ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 mr-1" />
                )}
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
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
      <div className="flex space-x-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search partners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={filterSubscription}
          onChange={(e) => setFilterSubscription(e.target.value as typeof filterSubscription)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="all">All Plans</option>
          <option value="none">No Plan</option>
          <option value="basic">Basic</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`flex items-center px-3 py-2 rounded-lg border ${
            autoRefresh ? 'border-blue-500 text-blue-600' : 'border-gray-300 text-gray-600'
          }`}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
          Auto Refresh
        </button>
      </div>

      {/* Partners Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Partner
                  {sortField === 'name' && (
                    sortDirection === 'asc' ? 
                      <ChevronUp className="w-4 h-4 ml-1" /> : 
                      <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subscription
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('leads')}
              >
                <div className="flex items-center">
                  Leads
                  {sortField === 'leads' && (
                    sortDirection === 'asc' ? 
                      <ChevronUp className="w-4 h-4 ml-1" /> : 
                      <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('responseRate')}
              >
                <div className="flex items-center">
                  Response Rate
                  {sortField === 'responseRate' && (
                    sortDirection === 'asc' ? 
                      <ChevronUp className="w-4 h-4 ml-1" /> : 
                      <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPartners.map((partner) => (
              <tr key={partner.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{partner.name || 'Unnamed Partner'}</div>
                      <div className="text-sm text-gray-500">{partner.email || 'No Email'}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {partner.siteDetails?.city && partner.siteDetails?.state && (
                          <>
                            {partner.siteDetails.city}, {partner.siteDetails.state}
                            <span> • </span>
                          </>
                        )}
                        {partner.siteDetails?.zipCode && `ZIP: ${partner.siteDetails.zipCode}`}
                        {partner.siteDetails?.serviceRadius && ` (${partner.siteDetails.serviceRadius} mi radius)`}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button 
                    onClick={() => {
                      setShowPlanModal(partner.id);
                      setSelectedPlan(partner.subscription || 'none');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {partner.subscription === 'none' || !partner.subscription ? 'No Plan' : partner.subscription}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    partner.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {partner.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => {
                      setShowQuotaModal(partner.id);
                      setNewQuota(partner.maxLeads || 0);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {partner.currentLeads || 0} / {partner.maxLeads || 0}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${partner.responseMetrics?.responseRate || 0}%` }}
                      />
                    </div>
                    <span className="ml-2 text-sm text-gray-500">
                      {partner.responseMetrics?.responseRate || 0}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleViewPartnerLeads(partner.id)}
                      className="text-green-600 hover:text-green-900"
                      title="View Partner Leads"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleImpersonation(partner)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Login As Partner"
                    >
                      <LogIn className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPartner(partner.id);
                        setShowDetails(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(partner.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Partner"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this partner? This action cannot be undone and will remove all associated data.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePartner(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={isDeleting === showDeleteConfirm}
              >
                {isDeleting === showDeleteConfirm ? 'Deleting...' : 'Delete Partner'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Lead Quota Modal */}
      {showQuotaModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Update Lead Quota</h3>
            <p className="text-gray-600 mb-4">
              Set the maximum number of leads this partner can have.
            </p>
            <div className="mb-6">
              <label htmlFor="leadQuota" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Leads
              </label>
              <input
                type="number"
                id="leadQuota"
                min="1"
                value={newQuota}
                onChange={(e) => setNewQuota(parseInt(e.target.value) || 0)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowQuotaModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleChangeQuota(showQuotaModal)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update Quota
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Subscription Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Update Subscription Plan</h3>
            <p className="text-gray-600 mb-4">
              Select a subscription plan for this partner.
            </p>
            <div className="mb-6 space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="none"
                  name="plan"
                  value="none"
                  checked={selectedPlan === 'none'}
                  onChange={() => setSelectedPlan('none')}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="none" className="text-sm font-medium text-gray-700">
                  No Plan ($0/month)
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="basic"
                  name="plan"
                  value="basic"
                  checked={selectedPlan === 'basic'}
                  onChange={() => setSelectedPlan('basic')}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="basic" className="text-sm font-medium text-gray-700">
                  Basic ($180/month)
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="professional"
                  name="plan"
                  value="professional"
                  checked={selectedPlan === 'professional'}
                  onChange={() => setSelectedPlan('professional')}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="professional" className="text-sm font-medium text-gray-700">
                  Professional ($299/month)
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="enterprise"
                  name="plan"
                  value="enterprise"
                  checked={selectedPlan === 'enterprise'}
                  onChange={() => setSelectedPlan('enterprise')}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="enterprise" className="text-sm font-medium text-gray-700">
                  Enterprise ($499/month)
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPlanModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleChangePlan(showPlanModal)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update Plan
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Partner Modal */}
      {showAddPartnerModal && (
        <PartnerAddModal 
          onClose={() => setShowAddPartnerModal(false)}
          onSuccess={handleAddPartnerSuccess}
        />
      )}
    </div>
  );
}
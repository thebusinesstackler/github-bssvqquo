import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import {
  CreditCard,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  Users,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Edit,
  Save,
  X,
  Search,
  Filter
} from 'lucide-react';
import { format, addMonths } from 'date-fns';

export function SubscriptionManager() {
  const { partners, fetchPartners, updatePartnerSubscription } = useAdminStore();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubscription, setFilterSubscription] = useState('all');
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);
  const [changingSubscription, setChangingSubscription] = useState<string | null>(null);
  const [newSubscriptionTier, setNewSubscriptionTier] = useState<'none' | 'basic' | 'professional' | 'enterprise'>('basic');
  const [confirmationText, setConfirmationText] = useState('');
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [partnerToUpdate, setPartnerToUpdate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Subscription price definitions
  const subscriptionPrices = {
    'none': 0,
    'basic': 180,
    'professional': 299,
    'enterprise': 499
  };

  useEffect(() => {
    loadPartners();
  }, []);
  
  const loadPartners = async () => {
    setLoading(true);
    try {
      await fetchPartners();
    } finally {
      setLoading(false);
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

  const handleToggleExpand = (partnerId: string) => {
    if (expandedPartner === partnerId) {
      setExpandedPartner(null);
    } else {
      setExpandedPartner(partnerId);
    }
  };
  
  const handleStartChangeSubscription = (partner: any) => {
    setChangingSubscription(partner.id);
    setNewSubscriptionTier(partner.subscription || 'none');
  };
  
  const handleCancelChange = () => {
    setChangingSubscription(null);
    setNewSubscriptionTier('basic');
  };
  
  const handleChangeSubscription = async () => {
    if (!changingSubscription) return;
    
    // Find the partner
    const partner = partners.find(p => p.id === changingSubscription);
    if (!partner) {
      setError('Partner not found');
      return;
    }
    
    // Set up confirmation modal for downgrades or cancellations
    if (
      (partner.subscription === 'enterprise' && ['professional', 'basic', 'none'].includes(newSubscriptionTier)) ||
      (partner.subscription === 'professional' && ['basic', 'none'].includes(newSubscriptionTier)) ||
      (partner.subscription === 'basic' && newSubscriptionTier === 'none')
    ) {
      setPartnerToUpdate(partner.id);
      setConfirmationOpen(true);
      setConfirmationText(`Are you sure you want to change ${partner.name}'s subscription from ${partner.subscription} to ${newSubscriptionTier}? This may affect their available features and lead limits.`);
      return;
    }
    
    // For upgrades, proceed without confirmation
    await updateSubscription(partner.id, newSubscriptionTier);
  };
  
  const confirmSubscriptionChange = async () => {
    if (!partnerToUpdate) return;
    
    await updateSubscription(partnerToUpdate, newSubscriptionTier);
    setConfirmationOpen(false);
    setPartnerToUpdate(null);
  };
  
  const updateSubscription = async (partnerId: string, tier: 'none' | 'basic' | 'professional' | 'enterprise') => {
    setLoading(true);
    setError(null);
    
    try {
      await updatePartnerSubscription(partnerId, tier);
      setSuccess(`Subscription updated successfully to ${tier}`);
      setChangingSubscription(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating subscription:', err);
      setError('Failed to update subscription');
    } finally {
      setLoading(false);
    }
  };
  
  const filteredPartners = partners.filter(partner => {
    // Filter by search term (name or email)
    const searchMatch = 
      !searchTerm || 
      partner.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      partner.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by subscription tier
    const subscriptionMatch = 
      filterSubscription === 'all' || 
      partner.subscription === filterSubscription ||
      (filterSubscription === 'none' && !partner.subscription);
    
    return searchMatch && subscriptionMatch;
  });
  
  const getNextBillingDate = (partner: any) => {
    if (!partner.billing?.nextBillingDate) {
      // Generate a fake date 1 month from now for demo
      return addMonths(new Date(), 1);
    }
    return partner.billing.nextBillingDate;
  };
  
  const getSubscriptionPrice = (tier: string) => {
    return subscriptionPrices[tier as keyof typeof subscriptionPrices] || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Subscription Management</h2>
          <p className="mt-1 text-sm text-gray-600">Manage partner subscription plans and billing</p>
        </div>
        <button
          onClick={loadPartners}
          className={`flex items-center px-4 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200`}
          disabled={loading}
        >
          <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search partners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div className="w-full md:w-auto">
            <select
              value={filterSubscription}
              onChange={(e) => setFilterSubscription(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Subscriptions</option>
              <option value="none">No Subscription</option>
              <option value="basic">Basic</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          
          <div className="w-full md:w-auto flex items-center">
            <Filter className="w-5 h-5 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">
              {filteredPartners.length} partners
            </span>
          </div>
        </div>
      </div>
      
      {/* Status messages */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      
      {/* Partner list */}
      <div className="space-y-4">
        {loading && filteredPartners.length === 0 ? (
          <div className="bg-white rounded-lg p-6 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="bg-white rounded-lg p-6 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No partners found</h3>
            <p className="text-gray-500 mt-1">Try changing your search criteria</p>
          </div>
        ) : (
          filteredPartners.map(partner => (
            <div key={partner.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 cursor-pointer" onClick={() => handleToggleExpand(partner.id)}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{partner.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {partner.siteDetails?.city && partner.siteDetails?.state && (
                          <>
                            {partner.siteDetails.city}, {partner.siteDetails.state}
                            {partner.siteDetails.zipCode && ` ${partner.siteDetails.zipCode}`}
                            <span className="mx-2">•</span>
                          </>
                        )}
                        {partner.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="hidden md:block">
                      <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getSubscriptionBadgeClass(partner.subscription || 'none')}`}>
                        {partner.subscription ? partner.subscription.charAt(0).toUpperCase() + partner.subscription.slice(1) : 'No Plan'}
                      </span>
                    </div>
                    <div className="hidden md:block">
                      <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadgeClass(partner.billing?.status)}`}>
                        {partner.billing?.status ? partner.billing.status.charAt(0).toUpperCase() + partner.billing.status.slice(1) : 'Inactive'}
                      </span>
                    </div>
                    {expandedPartner === partner.id ? 
                      <ChevronUp className="w-6 h-6 text-gray-400" /> : 
                      <ChevronDown className="w-6 h-6 text-gray-400" />
                    }
                  </div>
                </div>
              </div>
              
              {expandedPartner === partner.id && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Current Subscription */}
                    <div className="bg-white p-6 rounded-md shadow-sm border border-gray-100">
                      <h4 className="text-base font-medium text-gray-900 mb-4 flex items-center">
                        <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
                        Current Subscription
                      </h4>
                      
                      <div className="flex items-center mb-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          partner.subscription === 'enterprise' ? 'bg-purple-100' : 
                          partner.subscription === 'professional' ? 'bg-blue-100' : 
                          partner.subscription === 'basic' ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <span className={`text-lg font-bold ${
                            partner.subscription === 'enterprise' ? 'text-purple-700' : 
                            partner.subscription === 'professional' ? 'text-blue-700' : 
                            partner.subscription === 'basic' ? 'text-green-700' : 'text-gray-700'
                          }`}>
                            {partner.subscription ? partner.subscription.charAt(0).toUpperCase() : 'N'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <h5 className="font-semibold text-lg text-gray-900 capitalize">
                            {partner.subscription || 'No Subscription'}
                          </h5>
                          <p className="text-sm text-gray-600">
                            {partner.billing?.status ? 
                              partner.billing.status.charAt(0).toUpperCase() + partner.billing.status.slice(1) : 
                              'Inactive'
                            }
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Monthly Price</span>
                          <span className="font-medium text-gray-900">
                            ${partner.billing?.amount || getSubscriptionPrice(partner.subscription || 'none')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Next Billing</span>
                          <span className="font-medium text-gray-900">
                            {format(getNextBillingDate(partner), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Max Leads</span>
                          <span className="font-medium text-gray-900">
                            {partner.maxLeads || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Current Leads</span>
                          <span className="font-medium text-gray-900">
                            {partner.currentLeads || 0}
                          </span>
                        </div>
                      </div>
                      
                      {changingSubscription !== partner.id && (
                        <button
                          onClick={() => handleStartChangeSubscription(partner)}
                          className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Change Subscription
                        </button>
                      )}
                      
                      {changingSubscription === partner.id && (
                        <div className="mt-4 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              New Subscription
                            </label>
                            <select
                              value={newSubscriptionTier}
                              onChange={(e) => setNewSubscriptionTier(e.target.value as any)}
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            >
                              <option value="none">No Subscription</option>
                              <option value="basic">Basic ($180/month)</option>
                              <option value="professional">Professional ($299/month)</option>
                              <option value="enterprise">Enterprise ($499/month)</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center justify-between space-x-2">
                            <button
                              type="button"
                              onClick={handleCancelChange}
                              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleChangeSubscription}
                              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Subscription Details */}
                    <div className="bg-white p-6 rounded-md shadow-sm border border-gray-100">
                      <h4 className="text-base font-medium text-gray-900 mb-4 flex items-center">
                        <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
                        Billing Details
                      </h4>
                      
                      {partner.billing?.paymentMethod ? (
                        <div className="space-y-4">
                          <div className="bg-gray-50 p-4 rounded-md">
                            <div className="text-sm font-medium text-gray-700 mb-2">
                              Payment Method
                            </div>
                            <div className="flex items-center">
                              <CreditCard className="w-5 h-5 text-gray-500 mr-2" />
                              <span className="text-gray-600 capitalize">
                                {partner.billing.paymentMethod.brand || ''} ending in {partner.billing.paymentMethod.last4 || '****'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-4 rounded-md">
                            <div className="text-sm font-medium text-gray-700 mb-2">
                              Billing History
                            </div>
                            <div className="text-center text-sm text-gray-500 py-2">
                              {/* Placeholder for billing history */}
                              No recent transactions
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-32 bg-gray-50 rounded-md">
                          <CreditCard className="h-12 w-12 text-gray-300 mb-2" />
                          <p className="text-gray-500 text-sm">No payment method on file</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Usage and Limits */}
                    <div className="bg-white p-6 rounded-md shadow-sm border border-gray-100">
                      <h4 className="text-base font-medium text-gray-900 mb-4 flex items-center">
                        <Users className="w-5 h-5 text-blue-600 mr-2" />
                        Usage &amp; Limits
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Lead Usage</span>
                            <span className="font-medium text-gray-900">
                              {partner.currentLeads || 0} / {partner.maxLeads || 0}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ 
                                width: `${Math.min(
                                  100, 
                                  partner.maxLeads ? (partner.currentLeads / partner.maxLeads) * 100 : 0
                                )}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-md">
                          <div className="text-sm font-medium text-gray-700 mb-3">
                            Plan Features
                          </div>
                          <ul className="space-y-2 text-sm">
                            {partner.subscription === 'basic' && (
                              <>
                                <li className="flex items-center">
                                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                  <span>Up to 50 leads</span>
                                </li>
                                <li className="flex items-center">
                                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                  <span>Basic lead management</span>
                                </li>
                                <li className="flex items-center">
                                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                  <span>Email support</span>
                                </li>
                              </>
                            )}
                            {partner.subscription === 'professional' && (
                              <>
                                <li className="flex items-center">
                                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                  <span>Up to 100 leads</span>
                                </li>
                                <li className="flex items-center">
                                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                  <span>Advanced lead management</span>
                                </li>
                                <li className="flex items-center">
                                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                  <span>Priority support</span>
                                </li>
                                <li className="flex items-center">
                                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                  <span>Custom integrations</span>
                                </li>
                              </>
                            )}
                            {partner.subscription === 'enterprise' && (
                              <>
                                <li className="flex items-center">
                                  <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                                  <span>Unlimited leads</span>
                                </li>
                                <li className="flex items-center">
                                  <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                                  <span>24/7 premium support</span>
                                </li>
                                <li className="flex items-center">
                                  <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                                  <span>White-label options</span>
                                </li>
                                <li className="flex items-center">
                                  <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                                  <span>API access</span>
                                </li>
                              </>
                            )}
                            {!partner.subscription && (
                              <li className="text-gray-500">No active subscription features</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Confirmation Modal */}
      {confirmationOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Subscription Change</h3>
            <p className="text-sm text-gray-600 mb-6">{confirmationText}</p>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmationOpen(false);
                  setPartnerToUpdate(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSubscriptionChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../store/useAdminStore';
import { format } from 'date-fns';
import { 
  CreditCard, 
  Users, 
  CalendarClock, 
  CreditCardIcon, 
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  Edit,
  Save,
  X,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { SubscriptionHistoryView } from './SubscriptionHistoryView';

export function PartnerSubscriptionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { partners, fetchPartners, updatePartnerSubscription } = useAdminStore();
  
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newSubscription, setNewSubscription] = useState<'none' | 'basic' | 'professional' | 'enterprise'>('basic');
  const [confirmDowngrade, setConfirmDowngrade] = useState(false);
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchPartners();
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [fetchPartners]);
  
  useEffect(() => {
    if (partners.length > 0 && id) {
      const partnerData = partners.find(p => p.id === id);
      if (partnerData) {
        setPartner(partnerData);
        setNewSubscription(partnerData.subscription || 'basic');
      }
    }
  }, [partners, id]);
  
  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return format(date, 'MMM d, yyyy');
  };
  
  const handleBack = () => {
    navigate(-1);
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setNewSubscription(partner.subscription || 'basic');
    setConfirmDowngrade(false);
  };
  
  const handleSave = async () => {
    if (!partner) return;
    
    // Check if it's a downgrade and requires confirmation
    const tiers = ['none', 'basic', 'professional', 'enterprise'];
    const currentIndex = tiers.indexOf(partner.subscription || 'none');
    const newIndex = tiers.indexOf(newSubscription);
    
    if (newIndex < currentIndex && !confirmDowngrade) {
      setConfirmDowngrade(true);
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      await updatePartnerSubscription(partner.id, newSubscription);
      setSuccess(`Subscription updated to ${newSubscription}`);
      setIsEditing(false);
      setConfirmDowngrade(false);
      
      // Update the partner state
      setPartner({
        ...partner,
        subscription: newSubscription
      });
    } catch (err) {
      console.error('Error updating subscription:', err);
      setError('Failed to update subscription');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }
  
  if (!partner) {
    return (
      <div className="text-center py-10">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Partner Not Found</h2>
        <p className="mt-2 text-gray-600">The partner you're looking for does not exist.</p>
        <button
          onClick={handleBack}
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          Go Back
        </button>
      </div>
    );
  }
  
  // Define content based on subscription tier
  const subscriptionFeatures = {
    none: [],
    basic: [
      'Up to 50 leads per month',
      'Basic lead management',
      'Email support',
      'Standard analytics'
    ],
    professional: [
      'Up to 100 leads per month',
      'Advanced lead management',
      'Priority support',
      'Advanced analytics',
      'Custom integrations'
    ],
    enterprise: [
      'Unlimited leads',
      '24/7 premium support',
      'White-label options',
      'Custom development',
      'API access'
    ]
  };
  
  const subscriptionPrices = {
    none: 0,
    basic: 180,
    professional: 299,
    enterprise: 499
  };
  
  const tierColors = {
    none: 'bg-gray-100 text-gray-800',
    basic: 'bg-green-100 text-green-800',
    professional: 'bg-blue-100 text-blue-800',
    enterprise: 'bg-purple-100 text-purple-800'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="mr-4 p-2 rounded-md hover:bg-gray-100"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Partner Subscription
            </h1>
            <p className="text-sm text-gray-500">
              {partner.name} ({partner.email})
            </p>
          </div>
        </div>
        
        <div>
          {isEditing ? (
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={handleEdit}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Subscription
            </button>
          )}
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
      
      {/* Confirmation Dialog for Downgrades */}
      {confirmDowngrade && (
        <div className="bg-yellow-50 text-yellow-700 p-5 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium mb-1">Confirm Subscription Downgrade</h3>
              <p className="mb-3">
                Downgrading from {partner.subscription} to {newSubscription} may impact 
                this partner's access to features and lead limits. Are you sure you want to proceed?
              </p>
              <div className="flex justify-end space-x-3 mt-3">
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  Confirm Downgrade
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Subscription */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
              Subscription Details
            </h2>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                tierColors[partner.subscription as keyof typeof tierColors] || tierColors.none
              }`}>
                {partner.subscription
                  ? partner.subscription.charAt(0).toUpperCase() + partner.subscription.slice(1) + " Plan"
                  : "No Subscription"
                }
              </span>
            </div>
            
            {isEditing ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Change Subscription
                </label>
                <select
                  value={newSubscription}
                  onChange={(e) => setNewSubscription(e.target.value as any)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="none">No Subscription</option>
                  <option value="basic">Basic ($180/month)</option>
                  <option value="professional">Professional ($299/month)</option>
                  <option value="enterprise">Enterprise ($499/month)</option>
                </select>
              </div>
            ) : (
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {partner.billing?.status
                      ? partner.billing.status.charAt(0).toUpperCase() + partner.billing.status.slice(1)
                      : 'Inactive'
                    }
                  </dd>
                </div>
                
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Price</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    ${partner.billing?.amount || subscriptionPrices[partner.subscription as keyof typeof subscriptionPrices] || 0}/month
                  </dd>
                </div>
                
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Next Billing Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {partner.billing?.nextBillingDate 
                      ? formatDate(partner.billing.nextBillingDate)
                      : 'N/A'
                    }
                  </dd>
                </div>
                
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Features</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <ul className="space-y-2">
                      {subscriptionFeatures[partner.subscription as keyof typeof subscriptionFeatures]?.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          {feature}
                        </li>
                      )) || (
                        <li>No subscription features</li>
                      )}
                    </ul>
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </div>
        
        {/* Billing Information */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <CreditCardIcon className="w-5 h-5 text-blue-600 mr-2" />
              Billing Information
            </h2>
          </div>
          
          <div className="p-6">
            {partner.billing?.paymentMethod ? (
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <CreditCard className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="capitalize">
                      {partner.billing.paymentMethod.brand || 'Card'} ending in {partner.billing.paymentMethod.last4 || '****'}
                    </span>
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Expiration</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {partner.billing.paymentMethod.expMonth && partner.billing.paymentMethod.expYear
                      ? `${partner.billing.paymentMethod.expMonth}/${partner.billing.paymentMethod.expYear}`
                      : 'Unknown'
                    }
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Billing Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {partner.billing?.billingAddress || 'No billing address on file'}
                  </dd>
                </div>
              </dl>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No payment method</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This partner does not have a payment method on file.
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Usage and Limits */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <Users className="w-5 h-5 text-blue-600 mr-2" />
              Usage and Limits
            </h2>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Lead Usage</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">
                  {partner.currentLeads || 0} / {partner.maxLeads || 0} leads
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {partner.maxLeads ? Math.round((partner.currentLeads / partner.maxLeads) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
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
            
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Partner Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    partner.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {partner.active ? 'Active' : 'Inactive'}
                  </span>
                </dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(partner.createdAt)}
                </dd>
              </div>
              
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Response Rate</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {partner.responseMetrics?.responseRate 
                    ? `${partner.responseMetrics.responseRate}%`
                    : 'No data'
                  }
                </dd>
              </div>
              
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Average Response Time</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {partner.responseMetrics?.averageResponseTime 
                    ? `${partner.responseMetrics.averageResponseTime} hours`
                    : 'No data'
                  }
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      
      {/* Subscription History */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Subscription History</h2>
        <SubscriptionHistoryView partnerId={partner.id} />
      </div>
    </div>
  );
}
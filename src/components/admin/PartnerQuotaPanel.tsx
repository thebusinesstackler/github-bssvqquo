import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, ArrowRight, User, Users } from 'lucide-react';
import { Partner } from '../../types';
import { useAdminStore } from '../../store/useAdminStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface PartnerQuotaPanelProps {
  partnerId: string;
  onClose?: () => void;
}

export function PartnerQuotaPanel({ partnerId, onClose }: PartnerQuotaPanelProps) {
  const { partners, fetchPartners } = useAdminStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newQuota, setNewQuota] = useState<number>(0);
  const [reason, setReason] = useState<string>('');

  const partner = partners.find(p => p.id === partnerId);
  
  useEffect(() => {
    if (partner) {
      setNewQuota(partner.maxLeads);
    }
  }, [partner]);

  if (!partner) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center text-red-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          Partner not found
        </div>
      </div>
    );
  }

  const utilization = Math.round((partner.currentLeads / partner.maxLeads) * 100);
  
  const getUtilizationClass = () => {
    if (utilization >= 90) return 'bg-red-500';
    if (utilization >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const getUtilizationStatus = () => {
    if (utilization >= 90) return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', text: 'Critical' };
    if (utilization >= 75) return { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Warning' };
    return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', text: 'Good' };
  };
  
  const status = getUtilizationStatus();
  const Icon = status.icon;

  const handleQuotaChange = async () => {
    if (newQuota === partner.maxLeads) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (!reason && newQuota > partner.maxLeads) {
        throw new Error('Please provide a reason for increasing the quota');
      }
      
      // Update the partner's quota
      await updateDoc(doc(db, 'partners', partnerId), {
        maxLeads: newQuota,
        quotaUtilization: Math.round((partner.currentLeads / newQuota) * 100)
      });
      
      // Refresh partners list
      await fetchPartners();
      
      setSuccess(`Quota updated from ${partner.maxLeads} to ${newQuota}`);
      setReason('');
    } catch (err) {
      console.error('Error updating quota:', err);
      setError(err instanceof Error ? err.message : 'Failed to update quota');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-medium text-gray-900">Partner Quota Details</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {partner.role === 'partner' ? (
              <User className="h-10 w-10 rounded-full bg-blue-100 p-2 text-blue-600" />
            ) : (
              <Users className="h-10 w-10 rounded-full bg-purple-100 p-2 text-purple-600" />
            )}
          </div>
          <div className="ml-4">
            <h4 className="text-lg font-medium text-gray-900">{partner.name}</h4>
            <p className="text-sm text-gray-500">{partner.email}</p>
            <p className="text-sm text-gray-500">
              Subscription: {partner.subscription.charAt(0).toUpperCase() + partner.subscription.slice(1)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Current Quota Utilization</h4>
            <div className="flex items-center mt-1">
              <Icon className={`w-5 h-5 ${status.color}`} />
              <span className={`ml-2 text-sm font-medium ${status.color}`}>{status.text}</span>
              <span className="ml-2 text-sm text-gray-600">
                {partner.currentLeads} / {partner.maxLeads} leads ({utilization}%)
              </span>
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="w-full sm:w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={getUtilizationClass()}
                style={{ width: `${Math.min(100, utilization)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Adjust Lead Quota</h4>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <label htmlFor="newQuota" className="sr-only">New Lead Quota</label>
              <input
                id="newQuota"
                type="number"
                min="1"
                value={newQuota}
                onChange={(e) => setNewQuota(parseInt(e.target.value, 10) || 0)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">Current: {partner.maxLeads}</span>
                {newQuota !== partner.maxLeads && (
                  <span className={`text-xs ${
                    newQuota > partner.maxLeads ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {newQuota > partner.maxLeads ? '+' : ''}
                    {newQuota - partner.maxLeads} leads
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleQuotaChange}
              disabled={loading || newQuota === partner.maxLeads}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              Update Quota
            </button>
          </div>
          {newQuota > partner.maxLeads && (
            <div className="mt-2">
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Increase
              </label>
              <textarea
                id="reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter reason for quota increase..."
              />
            </div>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
}
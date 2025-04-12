import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { 
  AlertCircle, 
  CheckCircle, 
  Edit, 
  Save, 
  X, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  BarChart3 
} from 'lucide-react';
import { Partner, LeadQuota } from '../../types';
import { db } from '../../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export function LeadQuotaManager() {
  const { partners, fetchPartners } = useAdminStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingQuota, setEditingQuota] = useState<{[key: string]: number}>({});
  const [quotaHistory, setQuotaHistory] = useState<{[key: string]: {date: Date, value: number}[]}>({});

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    setLoading(true);
    try {
      await fetchPartners();
      setLoading(false);
    } catch (err) {
      console.error('Error fetching partners:', err);
      setError('Failed to load partners');
      setLoading(false);
    }
  };

  const handleEditQuota = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId);
    if (partner) {
      setEditingQuota({
        ...editingQuota,
        [partnerId]: partner.maxLeads
      });
    }
  };

  const handleCancelEdit = (partnerId: string) => {
    const newEditingQuota = { ...editingQuota };
    delete newEditingQuota[partnerId];
    setEditingQuota(newEditingQuota);
  };

  const handleQuotaChange = (partnerId: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setEditingQuota({
        ...editingQuota,
        [partnerId]: numValue
      });
    }
  };

  const handleSaveQuota = async (partnerId: string) => {
    if (!editingQuota[partnerId]) return;
    
    setLoading(true);
    setError(null);
    try {
      const partner = partners.find(p => p.id === partnerId);
      if (!partner) throw new Error('Partner not found');
      
      // Update the partner's quota in Firestore
      await updateDoc(doc(db, 'partners', partnerId), {
        maxLeads: editingQuota[partnerId],
        quotaUtilization: Math.round((partner.currentLeads / editingQuota[partnerId]) * 100),
        updatedAt: serverTimestamp()
      });

      // Store previous quota in history
      if (!quotaHistory[partnerId]) {
        setQuotaHistory({
          ...quotaHistory,
          [partnerId]: []
        });
      }
      
      setQuotaHistory({
        ...quotaHistory,
        [partnerId]: [
          ...(quotaHistory[partnerId] || []),
          { date: new Date(), value: partner.maxLeads }
        ]
      });

      // Remove from editing state
      const newEditingQuota = { ...editingQuota };
      delete newEditingQuota[partnerId];
      setEditingQuota(newEditingQuota);
      
      // Refresh partners list to get updated data
      await fetchPartners();
      
      setSuccess(`Quota updated successfully for ${partner.name}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating quota:', err);
      setError('Failed to update quota');
    } finally {
      setLoading(false);
    }
  };

  const getQuotaUtilization = (partner: Partner): number => {
    return Math.round((partner.currentLeads / partner.maxLeads) * 100);
  };

  const getQuotaStatusClass = (utilization: number): string => {
    if (utilization >= 90) return 'bg-red-100 text-red-800';
    if (utilization >= 75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Partner Lead Quotas</h2>
        <button
          onClick={loadPartners}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mx-6 my-4 bg-red-50 text-red-700 p-3 rounded-md flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="mx-6 my-4 bg-green-50 text-green-700 p-3 rounded-md flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Partner
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Leads
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Maximum Leads
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilization
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {partners
              .filter(p => p.role === 'partner')
              .sort((a, b) => {
                // Sort by utilization (descending)
                const aUtil = getQuotaUtilization(a);
                const bUtil = getQuotaUtilization(b);
                return bUtil - aUtil;
              })
              .map(partner => {
                const utilization = getQuotaUtilization(partner);
                const isEditing = editingQuota[partner.id] !== undefined;
                
                return (
                  <tr key={partner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{partner.name}</div>
                      <div className="text-xs text-gray-500">{partner.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{partner.currentLeads}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          min="1"
                          value={editingQuota[partner.id]}
                          onChange={(e) => handleQuotaChange(partner.id, e.target.value)}
                          className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{partner.maxLeads}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="mr-2 w-16 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              utilization >= 90 ? 'bg-red-500' : 
                              utilization >= 75 ? 'bg-yellow-500' : 
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(100, utilization)}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getQuotaStatusClass(utilization)}`}>
                          {utilization}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isEditing ? (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleSaveQuota(partner.id)}
                            className="text-green-600 hover:text-green-900"
                            disabled={loading}
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleCancelEdit(partner.id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={loading}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditQuota(partner.id)}
                          className="text-blue-600 hover:text-blue-900"
                          disabled={loading}
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700">Utilization Legend:</h3>
        <div className="mt-2 flex items-center space-x-6">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-xs text-gray-600">Under 75% - Good</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <span className="text-xs text-gray-600">75-90% - Approaching Limit</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-xs text-gray-600">Over 90% - Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
}
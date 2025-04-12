import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { useLeadStore } from '../../store/useLeadStore';
import { PartnerLeadManagement } from './PartnerLeadManagement';
import { LeadQuotaManager } from './LeadQuotaManager';
import { LeadPerformanceMetrics } from './LeadPerformanceMetrics';
import { LeadHeatMap } from './LeadHeatMap';
import { PartnerQuotaPanel } from './PartnerQuotaPanel';
import { AlertCircle, CheckCircle, RefreshCw, LayoutGrid, LayoutList, BarChart as ChartBar } from 'lucide-react';

export function PartnerLeadDashboard() {
  const { partners, fetchPartners } = useAdminStore();
  const { leads, fetchLeads } = useLeadStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'metrics' | 'quotas'>('list');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPartners(),
        fetchLeads('admin')
      ]);
      setSuccess('Data loaded successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Lead Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage, monitor, and assign leads across all partners
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 rounded-md flex items-center text-sm ${
              view === 'list' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <LayoutList className="w-4 h-4 mr-2" />
            Leads
          </button>
          <button
            onClick={() => setView('metrics')}
            className={`px-3 py-1.5 rounded-md flex items-center text-sm ${
              view === 'metrics' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ChartBar className="w-4 h-4 mr-2" />
            Analytics
          </button>
          <button
            onClick={() => setView('quotas')}
            className={`px-3 py-1.5 rounded-md flex items-center text-sm ${
              view === 'quotas' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Quotas
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

      {/* Main Content Based on View */}
      {view === 'list' && <PartnerLeadManagement />}
      
      {view === 'metrics' && (
        <div className="space-y-6">
          <LeadPerformanceMetrics />
          <LeadHeatMap leads={leads} partners={partners} />
        </div>
      )}
      
      {view === 'quotas' && (
        <div className="space-y-6">
          <LeadQuotaManager />
          {selectedPartnerId && (
            <PartnerQuotaPanel 
              partnerId={selectedPartnerId} 
              onClose={() => setSelectedPartnerId(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}
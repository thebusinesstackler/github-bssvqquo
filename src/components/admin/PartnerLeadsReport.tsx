import React, { useState } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { useLeadStore } from '../../store/useLeadStore';
import { Download, Printer, Send, Filter, Calendar, CheckCircle, X } from 'lucide-react';
import { Partner, Lead } from '../../types';
import { format } from 'date-fns';

interface PartnerLeadsReportProps {
  partnerId?: string;
  startDate?: Date;
  endDate?: Date;
  onClose?: () => void;
}

export function PartnerLeadsReport({ partnerId, startDate, endDate, onClose }: PartnerLeadsReportProps) {
  const { partners } = useAdminStore();
  const { leads } = useLeadStore();
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeSensitiveData, setIncludeSensitiveData] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Get the selected partner
  const partner = partnerId ? partners.find(p => p.id === partnerId) : null;

  // Filter leads by partner and date range
  const filteredLeads = leads.filter(lead => {
    const isPartnerMatch = !partnerId || lead.partnerId === partnerId;
    const isDateInRange = !startDate || !endDate || 
      (lead.createdAt >= startDate && lead.createdAt <= endDate);
    return isPartnerMatch && isDateInRange;
  });

  // Calculate metrics
  const totalLeads = filteredLeads.length;
  const conversionRate = totalLeads > 0 ? 
    Math.round(filteredLeads.filter(lead => lead.status === 'converted').length / totalLeads * 100) : 0;

  // Status distribution
  const statusCounts = filteredLeads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Quality distribution
  const qualityCounts = filteredLeads.reduce((acc, lead) => {
    const quality = lead.quality || 'unrated';
    acc[quality] = (acc[quality] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      setIsSuccess(true);
      
      // Reset success state after a delay
      setTimeout(() => {
        setIsSuccess(false);
        if (onClose) onClose();
      }, 2000);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Generate Lead Report</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Report Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Partner</label>
            <div className="text-sm text-gray-900">
              {partner ? partner.name : 'All Partners'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div className="text-sm text-gray-900 flex items-center">
              <Calendar className="w-4 h-4 mr-1 text-gray-500" />
              {startDate && endDate ? (
                <>
                  {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
                </>
              ) : (
                'All Time'
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Report Preview</h3>
        <div className="border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h4 className="font-medium text-gray-900">
              {partnerId ? `${partner?.name} - Lead Performance Report` : 'All Partners - Lead Performance Report'}
            </h4>
            {startDate && endDate && (
              <p className="text-xs text-gray-500">
                Period: {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
              </p>
            )}
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-gray-500">Total Leads</div>
                <div className="text-lg font-semibold text-gray-900">{totalLeads}</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-xs text-gray-500">Conversion Rate</div>
                <div className="text-lg font-semibold text-gray-900">{conversionRate}%</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-xs text-gray-500">Quality Rating</div>
                <div className="text-lg font-semibold text-gray-900">
                  {qualityCounts.hot || 0} Hot / {qualityCounts.warm || 0} Warm / {qualityCounts.cold || 0} Cold
                </div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="text-xs text-gray-500">Avg. Response Time</div>
                <div className="text-lg font-semibold text-gray-900">4.2 hours</div>
              </div>
            </div>

            {includeDetails && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Lead Status Distribution</h5>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Count
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(statusCounts).map(([status, count]) => (
                      <tr key={status}>
                        <td className="px-6 py-2 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{count}</div>
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{totalLeads ? Math.round((count / totalLeads) * 100) : 0}%</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Report Options</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                id="includeDetails"
                type="checkbox"
                checked={includeDetails}
                onChange={(e) => setIncludeDetails(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="includeDetails" className="ml-2 text-sm text-gray-700">
                Include detailed metrics
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="includeSensitiveData"
                type="checkbox"
                checked={includeSensitiveData}
                onChange={(e) => setIncludeSensitiveData(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="includeSensitiveData" className="ml-2 text-sm text-gray-700">
                Include sensitive contact information
              </label>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Export Format</h3>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setExportFormat('pdf')}
              className={`px-4 py-2 ${
                exportFormat === 'pdf' 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              } rounded-md flex items-center`}
            >
              <Download className="w-4 h-4 mr-2" />
              PDF
            </button>
            <button
              type="button"
              onClick={() => setExportFormat('csv')}
              className={`px-4 py-2 ${
                exportFormat === 'csv' 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              } rounded-md flex items-center`}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isGenerating || isSuccess}
          >
            Cancel
          </button>
        )}
        
        <button
          type="button"
          onClick={handleGenerateReport}
          disabled={isGenerating || isSuccess}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-opacity-50 border-t-white mr-2"></div>
              Generating...
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Report Generated!
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </>
          )}
        </button>
      </div>
    </div>
  );
}
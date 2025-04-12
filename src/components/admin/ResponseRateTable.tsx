import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { 
  ChevronUp, 
  ChevronDown, 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  Clock, 
  Search,
  RefreshCw, 
  Loader2 
} from 'lucide-react';
import { format } from 'date-fns';

export function ResponseRateTable() {
  const { partners, fetchPartners } = useAdminStore();
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<'name' | 'responseRate' | 'responseTime'>('responseRate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Load partners on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchPartners();
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [fetchPartners]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPartners();
    } finally {
      setRefreshing(false);
    }
  };

  // Handle sorting
  const handleSort = (field: typeof sortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to descending for new sort fields
    }
  };

  // Filter and sort partners
  const filteredPartners = partners
    .filter(partner => 
      partner.role === 'partner' && 
      partner.active && 
      (searchTerm === '' || 
        partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'name':
          return direction * a.name.localeCompare(b.name);
        case 'responseRate':
          const aRate = a.responseMetrics?.responseRate || 0;
          const bRate = b.responseMetrics?.responseRate || 0;
          return direction * (aRate - bRate);
        case 'responseTime':
          const aTime = a.responseMetrics?.averageResponseTime || 0;
          const bTime = b.responseMetrics?.averageResponseTime || 0;
          return direction * (aTime - bTime);
        default:
          return 0;
      }
    });

  // Get the trend icon component
  const getTrendIcon = (trend?: string) => {
    if (!trend || trend === 'stable') return <Minus className="h-4 w-4 text-gray-400" />;
    if (trend === 'improving') return <ArrowUp className="h-4 w-4 text-green-500" />;
    return <ArrowDown className="h-4 w-4 text-red-500" />;
  };

  // Get response rate color
  const getResponseRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get response time color
  const getResponseTimeColor = (time: number) => {
    if (time <= 2) return 'text-green-600';
    if (time <= 8) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Partner Response Rates</h3>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search partners..." 
              className="pl-9 pr-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-gray-400 hover:text-gray-600"
            title="Refresh data"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? "No partners match your search." : "No active partners found."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Partner
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('responseRate')}
                >
                  <div className="flex items-center">
                    Response Rate
                    {sortField === 'responseRate' && (
                      sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('responseTime')}
                >
                  <div className="flex items-center">
                    Average Time
                    {sortField === 'responseTime' && (
                      sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Response
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead Stats
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPartners.map((partner) => (
                <tr key={partner.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{partner.name}</div>
                    <div className="text-xs text-gray-500">{partner.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-semibold ${getResponseRateColor(partner.responseMetrics?.responseRate || 0)}`}>
                      {partner.responseMetrics?.responseRate || 0}%
                    </div>
                    <div className="w-full h-1 bg-gray-200 rounded-full mt-1">
                      <div 
                        className={`h-1 rounded-full ${
                          (partner.responseMetrics?.responseRate || 0) >= 90 ? 'bg-green-500' :
                          (partner.responseMetrics?.responseRate || 0) >= 70 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, partner.responseMetrics?.responseRate || 0)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-gray-400" />
                      <span className={`text-sm font-medium ${getResponseTimeColor(partner.responseMetrics?.averageResponseTime || 0)}`}>
                        {(partner.responseMetrics?.averageResponseTime || 0).toFixed(1)} hours
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTrendIcon(partner.responseMetrics?.lastWeekPerformance?.trend)}
                      <span className="ml-1 text-sm text-gray-500">
                        {partner.responseMetrics?.lastWeekPerformance?.trend === 'improving' ? 'Improving' :
                         partner.responseMetrics?.lastWeekPerformance?.trend === 'declining' ? 'Declining' : 
                         'Stable'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {partner.responseMetrics?.lastResponseDate ? 
                        format(partner.responseMetrics?.lastResponseDate, 'MMM d, yyyy h:mm a') : 
                        'Never'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {partner.responseMetrics?.totalLeadsContacted || 0} / {partner.responseMetrics?.totalLeadsReceived || 0} leads
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
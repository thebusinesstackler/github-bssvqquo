import React, { useMemo } from 'react';
import { MapPin, Calendar, Users } from 'lucide-react';

interface Lead {
  id: string;
  partnerId: string;
  status: string;
  createdAt: string;
  region?: string;
}

interface Partner {
  id: string;
  name: string;
  region?: string;
}

interface LeadHeatMapProps {
  leads: Lead[];
  partners: Partner[];
}

export function LeadHeatMap({ leads, partners }: LeadHeatMapProps) {
  const leadsByPartner = useMemo(() => {
    const map = new Map<string, Lead[]>();
    
    partners.forEach(partner => {
      map.set(partner.id, []);
    });
    
    leads.forEach(lead => {
      if (lead.partnerId && map.has(lead.partnerId)) {
        const partnerLeads = map.get(lead.partnerId) || [];
        map.set(lead.partnerId, [...partnerLeads, lead]);
      }
    });
    
    return map;
  }, [leads, partners]);

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-gray-100';
    if (count < 5) return 'bg-blue-100';
    if (count < 10) return 'bg-blue-200';
    if (count < 20) return 'bg-blue-300';
    if (count < 30) return 'bg-blue-400';
    return 'bg-blue-500';
  };

  const getRegions = () => {
    const regions = new Set<string>();
    partners.forEach(partner => {
      if (partner.region) regions.add(partner.region);
    });
    return Array.from(regions);
  };

  const regions = useMemo(() => getRegions(), [partners]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Lead Distribution Heat Map</h2>
        <div className="flex space-x-4">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">By Partner</span>
          </div>
          {regions.length > 0 && (
            <div className="flex items-center">
              <Calendar className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">{regions.length} Regions</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Legend */}
        <div className="flex items-center justify-end mb-2 space-x-2">
          <span className="text-xs text-gray-500">Lead volume:</span>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-gray-100 rounded"></div>
            <span className="text-xs">0</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-blue-100 rounded"></div>
            <span className="text-xs">1-4</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-blue-200 rounded"></div>
            <span className="text-xs">5-9</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-blue-300 rounded"></div>
            <span className="text-xs">10-19</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-blue-400 rounded"></div>
            <span className="text-xs">20-29</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-xs">30+</span>
          </div>
        </div>

        {/* Heat Map */}
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Partner
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Region
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead Count
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visualization
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {partners.map((partner) => {
                const partnerLeads = leadsByPartner.get(partner.id) || [];
                const count = partnerLeads.length;

                return (
                  <tr key={partner.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {partner.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {partner.region || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2 text-gray-400" />
                        {count}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`h-8 ${getIntensityClass(count)} rounded w-full`}>
                        <div className="h-full flex items-center justify-center">
                          <span className={`text-xs font-medium ${count > 19 ? 'text-white' : 'text-gray-700'}`}>
                            {count > 0 && count}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
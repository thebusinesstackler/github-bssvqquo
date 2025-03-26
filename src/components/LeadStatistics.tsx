import React from 'react';
import { Lead } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface LeadStatisticsProps {
  leads: Lead[];
}

export function LeadStatistics({ leads }: LeadStatisticsProps) {
  // Calculate statistics
  const statusCounts = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = [
    { name: 'New', value: statusCounts.new || 0, color: '#3B82F6' },
    { name: 'Not Contacted', value: statusCounts.not_contacted || 0, color: '#F59E0B' },
    { name: 'Contacted', value: statusCounts.contacted || 0, color: '#10B981' },
    { name: 'Qualified', value: statusCounts.qualified || 0, color: '#6366F1' },
    { name: 'Converted', value: statusCounts.converted || 0, color: '#8B5CF6' }
  ];

  // Calculate contact rate
  const totalLeads = leads.length;
  const contactedLeads = (statusCounts.contacted || 0) + (statusCounts.qualified || 0) + (statusCounts.converted || 0);
  const contactRate = totalLeads ? Math.round((contactedLeads / totalLeads) * 100) : 0;

  // Calculate conversion rate
  const conversionRate = totalLeads ? Math.round((statusCounts.converted || 0) / totalLeads * 100) : 0;

  // Group leads by indication for bar chart
  const leadsByIndication = leads.reduce((acc, lead) => {
    if (lead.indication) {
      acc[lead.indication] = acc[lead.indication] || { total: 0, contacted: 0 };
      acc[lead.indication].total++;
      if (['contacted', 'qualified', 'converted'].includes(lead.status)) {
        acc[lead.indication].contacted++;
      }
    }
    return acc;
  }, {} as Record<string, { total: number; contacted: number }>);

  const barData = Object.entries(leadsByIndication).map(([indication, data]) => ({
    name: indication,
    'Total Leads': data.total,
    'Contacted Leads': data.contacted
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Summary Cards */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900">Total Leads</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{totalLeads}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-green-900">Contact Rate</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{contactRate}%</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-purple-900">Conversion Rate</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">{conversionRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lead Status Distribution */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Status Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Contact Rate by Indication */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Rate by Indication</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Total Leads" fill="#3B82F6" />
                <Bar dataKey="Contacted Leads" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
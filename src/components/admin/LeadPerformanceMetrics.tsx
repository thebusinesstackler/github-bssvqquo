import React, { useState, useEffect } from 'react';
import { useLeadStore } from '../../store/useLeadStore';
import { useAdminStore } from '../../store/useAdminStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Flame,
  Thermometer,
  Snowflake
} from 'lucide-react';
import { Partner, Lead, LeadStatus, LeadQuality } from '../../types';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
}

function MetricCard({ title, value, trend, trendValue, icon: Icon, iconColor, bgColor }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-start">
        <div className={`${bgColor} p-3 rounded-full`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {trend && trendValue && (
          <div className={`flex items-center text-sm ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 
            'text-gray-500'
          }`}>
            {trend === 'up' && <TrendingUp className="w-4 h-4 mr-1" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4 mr-1" />}
            {trend === 'neutral' && <Activity className="w-4 h-4 mr-1" />}
            {trendValue}
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export function LeadPerformanceMetrics() {
  const { leads } = useLeadStore();
  const { partners } = useAdminStore();
  const [selectedPartner, setSelectedPartner] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Calculate date range based on selection
  const getDateRange = (): Date => {
    const today = new Date();
    switch(timeRange) {
      case '7d':
        return new Date(today.setDate(today.getDate() - 7));
      case '30d':
        return new Date(today.setDate(today.getDate() - 30));
      case '90d':
        return new Date(today.setDate(today.getDate() - 90));
      case 'all':
      default:
        return new Date(0); // Beginning of time
    }
  };

  // Filter leads by date range and partner
  const filteredLeads = leads.filter(lead => {
    const isInDateRange = lead.createdAt >= getDateRange();
    const isPartnerMatch = selectedPartner === 'all' || lead.partnerId === selectedPartner;
    return isInDateRange && isPartnerMatch;
  });

  // Calculate metrics
  const totalLeads = filteredLeads.length;
  const convertedLeads = filteredLeads.filter(lead => lead.status === 'converted').length;
  const conversionRate = totalLeads ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const qualityCounts = {
    hot: filteredLeads.filter(lead => lead.quality === 'hot').length,
    warm: filteredLeads.filter(lead => lead.quality === 'warm').length,
    cold: filteredLeads.filter(lead => lead.quality === 'cold').length,
  };

  // Status distribution for pie chart
  const statusDistribution = [
    { name: 'New', value: filteredLeads.filter(lead => lead.status === 'new').length, color: '#3B82F6' },
    { name: 'Not Contacted', value: filteredLeads.filter(lead => lead.status === 'not_contacted').length, color: '#F59E0B' },
    { name: 'Contacted', value: filteredLeads.filter(lead => lead.status === 'contacted').length, color: '#10B981' },
    { name: 'Qualified', value: filteredLeads.filter(lead => lead.status === 'qualified').length, color: '#8B5CF6' },
    { name: 'Converted', value: filteredLeads.filter(lead => lead.status === 'converted').length, color: '#6366F1' },
    { name: 'Lost', value: filteredLeads.filter(lead => lead.status === 'lost').length, color: '#EF4444' }
  ].filter(item => item.value > 0);

  // Quality distribution for pie chart
  const qualityDistribution = [
    { name: 'Hot', value: qualityCounts.hot, color: '#EF4444' },
    { name: 'Warm', value: qualityCounts.warm, color: '#F59E0B' },
    { name: 'Cold', value: qualityCounts.cold, color: '#3B82F6' }
  ].filter(item => item.value > 0);

  // Partner performance for bar chart (only if viewing all partners)
  const partnerPerformance = selectedPartner === 'all' ? partners
    .filter(partner => partner.role === 'partner')
    .map(partner => {
      const partnerLeads = leads.filter(lead => 
        lead.partnerId === partner.id && 
        lead.createdAt >= getDateRange()
      );
      const totalPartnerLeads = partnerLeads.length;
      const convertedPartnerLeads = partnerLeads.filter(lead => lead.status === 'converted').length;
      const conversionRate = totalPartnerLeads ? Math.round((convertedPartnerLeads / totalPartnerLeads) * 100) : 0;
      
      return {
        name: partner.name,
        leads: totalPartnerLeads,
        converted: convertedPartnerLeads,
        conversionRate
      };
    })
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 5) : [];

  // Calculate conversion over time (by week)
  const getWeeklyData = () => {
    const data = [];
    const startDate = getDateRange();
    const endDate = new Date();
    
    // Create weekly buckets
    const weekMilliseconds = 7 * 24 * 60 * 60 * 1000;
    for (let time = startDate.getTime(); time <= endDate.getTime(); time += weekMilliseconds) {
      const weekStart = new Date(time);
      const weekEnd = new Date(time + weekMilliseconds);
      
      const weekLeads = filteredLeads.filter(lead => 
        lead.createdAt >= weekStart && lead.createdAt < weekEnd
      );
      
      const totalWeekLeads = weekLeads.length;
      const convertedWeekLeads = weekLeads.filter(lead => lead.status === 'converted').length;
      
      data.push({
        name: `Week ${data.length + 1}`,
        totalLeads: totalWeekLeads,
        convertedLeads: convertedWeekLeads,
        conversionRate: totalWeekLeads ? Math.round((convertedWeekLeads / totalWeekLeads) * 100) : 0
      });
    }
    
    return data;
  };

  const weeklyData = getWeeklyData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Lead Performance Metrics</h2>
          <p className="mt-1 text-sm text-gray-500">
            Key performance indicators and conversion analysis
          </p>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <select
            value={selectedPartner}
            onChange={(e) => setSelectedPartner(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Partners</option>
            {partners
              .filter(p => p.role === 'partner')
              .map(partner => (
                <option key={partner.id} value={partner.id}>
                  {partner.name}
                </option>
              ))}
          </select>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Leads"
          value={totalLeads}
          icon={Activity}
          iconColor="text-blue-600"
          bgColor="bg-blue-100"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          trend={conversionRate > 20 ? 'up' : conversionRate < 10 ? 'down' : 'neutral'}
          trendValue={`${conversionRate > 20 ? '+' : ''}${conversionRate - 15}%`}
          icon={TrendingUp}
          iconColor="text-green-600"
          bgColor="bg-green-100"
        />
        <MetricCard
          title="Hot Leads"
          value={qualityCounts.hot}
          trend={qualityCounts.hot > 10 ? 'up' : 'neutral'}
          trendValue={qualityCounts.hot > 10 ? '+25%' : 'Stable'}
          icon={Flame}
          iconColor="text-red-600"
          bgColor="bg-red-100"
        />
        <MetricCard
          title="Avg. Response Time"
          value="4.5h"
          trend="down"
          trendValue="-15%"
          icon={Clock}
          iconColor="text-purple-600"
          bgColor="bg-purple-100"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Lead Status Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quality Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Lead Quality Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={qualityDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {qualityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Partner Performance Comparison */}
        {selectedPartner === 'all' && partnerPerformance.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm col-span-1 lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Top Partner Performance</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={partnerPerformance}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="leads" name="Total Leads" fill="#3B82F6" />
                  <Bar yAxisId="left" dataKey="converted" name="Converted Leads" fill="#10B981" />
                  <Bar yAxisId="right" dataKey="conversionRate" name="Conversion Rate (%)" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Conversion Trend Over Time */}
        <div className="bg-white p-6 rounded-lg shadow-sm col-span-1 lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Conversion Trend Over Time</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={weeklyData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="totalLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="convertedLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="totalLeads" 
                  name="Total Leads" 
                  stroke="#3B82F6" 
                  fillOpacity={1} 
                  fill="url(#totalLeads)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="convertedLeads" 
                  name="Converted Leads" 
                  stroke="#10B981" 
                  fillOpacity={1} 
                  fill="url(#convertedLeads)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
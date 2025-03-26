import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { useLeadStore } from '../../store/useLeadStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Users,
  Clock,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Download,
  Bell,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export function AdminDashboard() {
  const { partners, adminMetrics, fetchPartners } = useAdminStore();
  const { leads, fetchLeads } = useLeadStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartner, setSelectedPartner] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('7d');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchPartners();
    fetchLeads('admin');
  }, []);

  // Calculate average response time
  const calculateAverageResponseTime = () => {
    const responseTimes = leads.filter(lead => lead.lastViewed).map(lead => {
      const createdTime = lead.createdAt.getTime();
      const viewedTime = lead.lastViewed!.getTime();
      return (viewedTime - createdTime) / (1000 * 60 * 60); // Convert to hours
    });

    if (responseTimes.length === 0) return 0;
    return Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
  };

  const statsCards = [
    {
      title: 'Total Leads',
      value: leads.length,
      change: '+12%',
      trend: 'up',
      icon: Activity
    },
    {
      title: 'Active Partners',
      value: partners.filter(p => p.active).length,
      change: '+2',
      trend: 'up',
      icon: Users
    },
    {
      title: 'Avg Response Time',
      value: `${calculateAverageResponseTime()}h`,
      change: '-5h',
      trend: 'up',
      icon: Clock
    },
    {
      title: 'Monthly Revenue',
      value: `$${adminMetrics.totalRevenue.toLocaleString()}`,
      change: '+8%',
      trend: 'up',
      icon: DollarSign
    }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Calculate lead status distribution
  const leadStatusData = [
    { name: 'New', value: leads.filter(l => l.status === 'new').length },
    { name: 'Contacted', value: leads.filter(l => l.status === 'contacted').length },
    { name: 'Qualified', value: leads.filter(l => l.status === 'qualified').length },
    { name: 'Converted', value: leads.filter(l => l.status === 'converted').length }
  ];

  // Calculate partner performance data
  const partnerPerformance = partners.map(partner => {
    const partnerLeads = leads.filter(lead => lead.partnerId === partner.id);
    const respondedLeads = partnerLeads.filter(lead => lead.lastViewed);
    const responseRate = partnerLeads.length > 0 
      ? Math.round((respondedLeads.length / partnerLeads.length) * 100)
      : 0;

    return {
      name: partner.name,
      leads: partnerLeads.length,
      responseRate
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time overview of partner and lead performance
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center px-3 py-2 rounded-lg border ${
              autoRefresh ? 'border-blue-500 text-blue-600' : 'border-gray-300 text-gray-600'
            }`}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="w-5 h-5 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <div key={stat.title} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="bg-blue-100 p-3 rounded-full">
                <stat.icon className="w-6 h-6 text-blue-600" />
              </div>
              <span className={`flex items-center text-sm ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 mr-1" />
                )}
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Lead Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={partnerPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="leads" fill="#3B82F6" name="Leads" />
              <Bar dataKey="responseRate" fill="#34D399" name="Response Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Lead Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Lead Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={leadStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {leadStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="col-span-2 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {leads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {lead.firstName} {lead.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Assigned to: {partners.find(p => p.id === lead.partnerId)?.name}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(lead.createdAt, { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../store/useAdminStore';
import { useAuthStore } from '../../store/useAuthStore';
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
  RefreshCw,
  LogIn,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  UserPlus
} from 'lucide-react';
import { format } from 'date-fns';

export function PartnerManagement() {
  const navigate = useNavigate();
  const { partners, adminMetrics, fetchPartners } = useAdminStore();
  const { startImpersonation } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterSubscription, setFilterSubscription] = useState<'all' | 'basic' | 'professional' | 'enterprise'>('all');
  const [sortField, setSortField] = useState<'name' | 'leads' | 'responseRate'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleImpersonation = (partner: any) => {
    startImpersonation({
      id: partner.id,
      name: partner.name,
      email: partner.email,
      role: 'partner',
      createdAt: partner.createdAt,
      active: partner.active,
      subscription: partner.subscription
    });
    navigate('/dashboard');
  };

  // Calculate average response time safely
  const calculateAverageResponseTime = () => {
    const validPartners = partners.filter(p => p.responseMetrics?.averageResponseTime);
    if (validPartners.length === 0) return 0;
    
    const totalTime = validPartners.reduce((acc, partner) => 
      acc + (partner.responseMetrics?.averageResponseTime || 0), 0
    );
    return Math.round(totalTime / validPartners.length);
  };

  // Calculate total revenue safely
  const calculateTotalRevenue = () => {
    return partners.reduce((acc, partner) => 
      acc + (partner.billing?.amount || 0), 0
    );
  };

  const statsCards = [
    {
      title: 'Total Partners',
      value: partners.length,
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
      value: `$${calculateTotalRevenue().toLocaleString()}`,
      change: '+8%',
      trend: 'up',
      icon: DollarSign
    }
  ];

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' ? partner.active : !partner.active);
    const matchesSubscription = filterSubscription === 'all' || 
      partner.subscription.toLowerCase() === filterSubscription.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesSubscription;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'name':
        comparison = (a.name || '').localeCompare(b.name || '');
        break;
      case 'leads':
        comparison = (a.currentLeads || 0) - (b.currentLeads || 0);
        break;
      case 'responseRate':
        comparison = (a.responseMetrics?.responseRate || 0) - (b.responseMetrics?.responseRate || 0);
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: typeof sortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage research site partners and their subscriptions
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Add Partner
        </button>
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

      {/* Filters and Search */}
      <div className="flex space-x-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search partners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={filterSubscription}
          onChange={(e) => setFilterSubscription(e.target.value as typeof filterSubscription)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="all">All Plans</option>
          <option value="basic">Basic</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`flex items-center px-3 py-2 rounded-lg border ${
            autoRefresh ? 'border-blue-500 text-blue-600' : 'border-gray-300 text-gray-600'
          }`}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
          Auto Refresh
        </button>
      </div>

      {/* Partners Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Partner
                  {sortField === 'name' && (
                    sortDirection === 'asc' ? 
                      <ChevronUp className="w-4 h-4 ml-1" /> : 
                      <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subscription
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('leads')}
              >
                <div className="flex items-center">
                  Leads
                  {sortField === 'leads' && (
                    sortDirection === 'asc' ? 
                      <ChevronUp className="w-4 h-4 ml-1" /> : 
                      <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('responseRate')}
              >
                <div className="flex items-center">
                  Response Rate
                  {sortField === 'responseRate' && (
                    sortDirection === 'asc' ? 
                      <ChevronUp className="w-4 h-4 ml-1" /> : 
                      <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPartners.map((partner) => (
              <tr key={partner.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{partner.name}</div>
                      <div className="text-sm text-gray-500">{partner.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900 capitalize">{partner.subscription || 'basic'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    partner.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {partner.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {partner.currentLeads || 0} / {partner.maxLeads || 50}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${partner.responseMetrics?.responseRate || 0}%` }}
                      />
                    </div>
                    <span className="ml-2 text-sm text-gray-500">
                      {partner.responseMetrics?.responseRate || 0}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleImpersonation(partner)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Login as Partner"
                    >
                      <LogIn className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPartner(partner);
                        setShowDetails(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
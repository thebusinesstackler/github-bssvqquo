import React, { useEffect } from 'react';
import { useLeadStore } from '../store/useLeadStore';
import { useAuthStore } from '../store/useAuthStore';
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
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';
import { Clock, Users, PhoneCall, CheckCircle2 } from 'lucide-react';

export function LeadDashboard() {
  const user = useAuthStore((state) => state.user);
  const { leads, fetchLeads, isLoading, error } = useLeadStore();

  useEffect(() => {
    if (user?.id) {
      fetchLeads(user.id);
    }
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4">
        Error: {error}
      </div>
    );
  }

  // Calculate statistics
  const totalLeads = leads.length;
  const newLeads = leads.filter(lead => lead.status === 'new').length;
  const contactedLeads = leads.filter(lead => lead.status === 'contacted').length;
  const randomizedLeads = leads.filter(lead => lead.status === 'randomized').length;

  // Status distribution data for pie chart
  const statusData = [
    { name: 'New', value: newLeads, color: '#3B82F6' },
    { name: 'Contacted', value: contactedLeads, color: '#34D399' },
    { name: 'Randomized', value: randomizedLeads, color: '#A78BFA' }
  ];

  // Daily activity data for line chart
  const activityData = [
    { day: 'Mon', leads: 4, responses: 3 },
    { day: 'Tue', leads: 6, responses: 5 },
    { day: 'Wed', leads: 8, responses: 7 },
    { day: 'Thu', leads: 5, responses: 4 },
    { day: 'Fri', leads: 7, responses: 6 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {user?.name}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-2xl font-semibold text-gray-900">{totalLeads}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New Leads</p>
              <p className="text-2xl font-semibold text-gray-900">{newLeads}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <PhoneCall className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Contacted</p>
              <p className="text-2xl font-semibold text-gray-900">{contactedLeads}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Randomized</p>
              <p className="text-2xl font-semibold text-gray-900">{randomizedLeads}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Leads</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Indication
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.slice(0, 5).map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {lead.firstName} {lead.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{lead.phone}</div>
                    <div className="text-sm text-gray-500">{lead.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lead.indication}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                      lead.status === 'contacted' ? 'bg-green-100 text-green-800' :
                      lead.status === 'randomized' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Lead Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Activity */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Daily Activity</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="leads" stroke="#3B82F6" name="Leads" />
              <Line type="monotone" dataKey="responses" stroke="#34D399" name="Responses" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
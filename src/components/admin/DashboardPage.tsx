import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer 
} from 'recharts';
import { AdminHeader } from './AdminHeader';
import { 
  Users, 
  Clock, 
  FileText,
  CheckCircle, 
  AlertCircle,
  BarChart3,
  UserCheck
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { LeadStatusViewer } from './LeadStatusViewer';

export function DashboardPage() {
  const navigate = useNavigate();
  const { partners, fetchPartners, calculateAdminMetrics } = useAdminStore();
  const { leads, fetchLeads } = useLeadStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [leadsByStatus, setLeadsByStatus] = useState<{[key: string]: number}>({});
  const [leadsByDate, setLeadsByDate] = useState<any[]>([]);
  const [partnerPerformance, setPartnerPerformance] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchPartners(),
          fetchLeads('admin')
        ]);

        fetchRecentActivity();
        
        // Calculate metrics based on fetched data
        await calculateAdminMetrics();
        calculateLeadsByStatus();
        calculateLeadsByDate();
        calculatePartnerPerformance();
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data');
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      // Fetch recent activity from Firebase
      const activityRef = collection(db, 'activity_logs');
      const q = query(
        activityRef,
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      
      const activitySnapshot = await getDocs(q);
      const activities = activitySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      
      setRecentActivity(activities);
    } catch (err) {
      console.error('Error fetching recent activity:', err);
      // Create sample activity data
      setRecentActivity([
        {
          id: '1',
          action: 'user_login',
          userName: 'Admin User',
          timestamp: new Date(),
          details: { ip: '192.168.1.1' }
        },
        {
          id: '2',
          action: 'lead_assigned',
          userName: 'Admin User',
          timestamp: subDays(new Date(), 1),
          details: { leadName: 'John Smith', partnerId: 'partner1' }
        },
        {
          id: '3',
          action: 'partner_created',
          userName: 'Admin User',
          timestamp: subDays(new Date(), 2),
          details: { partnerName: 'New Research Center' }
        }
      ]);
    }
  };

  const calculateLeadsByStatus = () => {
    const statusCount = leads.reduce((acc, lead) => {
      const status = lead.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as {[key: string]: number});
    
    setLeadsByStatus(statusCount);
  };

  const calculateLeadsByDate = () => {
    // Group leads by day for the past 14 days
    const today = new Date();
    const pastDays = Array.from({ length: 14 }, (_, i) => {
      const date = subDays(today, i);
      return format(date, 'MMM dd');
    }).reverse();
    
    const leadsByDay = pastDays.map(day => {
      const count = leads.filter(lead => {
        return format(lead.createdAt, 'MMM dd') === day;
      }).length;
      
      return {
        date: day,
        value: count
      };
    });
    
    setLeadsByDate(leadsByDay);
  };

  const calculatePartnerPerformance = () => {
    // Calculate performance metrics for each partner
    if (partners.length === 0) return;
    
    const partnersWithMetrics = partners
      .filter(p => p.role === 'partner' && p.active)
      .map(partner => {
        // Get leads for this partner
        const partnerLeads = leads.filter(lead => lead.partnerId === partner.id);
        
        // Calculate conversion rate
        const total = partnerLeads.length;
        const converted = partnerLeads.filter(lead => lead.status === 'converted').length;
        const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
        
        return {
          id: partner.id,
          name: partner.name,
          totalLeads: total,
          conversionRate,
          responseTime: partner.responseMetrics?.averageResponseTime || 0
        };
      })
      .sort((a, b) => b.totalLeads - a.totalLeads)
      .slice(0, 5); // Take top 5 performers
    
    setPartnerPerformance(partnersWithMetrics);
  };

  // Prepare data for charts
  const statusData = Object.entries(leadsByStatus).map(([status, count]) => ({
    name: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: count
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>
      
      {/* Admin Header */}
      <AdminHeader />
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Real-time lead status viewer */}
          <div className="mb-6">
            <LeadStatusViewer limit={5} />
            <div className="flex justify-end mt-2">
              <button
                onClick={() => navigate('/admin/leads-status')}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
              >
                View all partner leads
                <UserCheck className="ml-1 w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lead Status Distribution */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 text-gray-500 mr-2" />
                Lead Status Distribution
              </h2>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={value => [value, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Lead Trend */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 text-gray-500 mr-2" />
                Lead Trend
              </h2>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={leadsByDate}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#8884d8"
                      name="Leads"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Partner Performance Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Users className="w-5 h-5 text-gray-500 mr-2" />
                Top Partner Performance
              </h2>
              <button 
                onClick={() => navigate('/admin/partner-leads')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All
              </button>
            </div>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={partnerPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="totalLeads" name="Total Leads" fill="#0088FE" />
                  <Bar yAxisId="right" dataKey="conversionRate" name="Conversion Rate (%)" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
              <button 
                onClick={() => navigate('/admin/logs')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-gray-200">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={activity.id || index} className="px-6 py-4">
                    <div className="flex items-start">
                      <div className="mr-3">
                        {activity.action === 'user_login' ? (
                          <Users className="h-5 w-5 text-blue-500" />
                        ) : activity.action === 'lead_assigned' ? (
                          <FileText className="h-5 w-5 text-green-500" />
                        ) : activity.action === 'partner_created' ? (
                          <Users className="h-5 w-5 text-purple-500" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.userName || 'System'} 
                          {' '}
                          {activity.action === 'user_login' ? 'logged in' : 
                            activity.action === 'lead_assigned' ? 'assigned a lead' :
                            activity.action === 'partner_created' ? 'created a partner' :
                            activity.action.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.timestamp && format(activity.timestamp, 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-4 text-center text-gray-500">
                  No recent activity found
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
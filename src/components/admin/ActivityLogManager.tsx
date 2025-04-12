import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  User, 
  Clock, 
  FileText, 
  Filter, 
  Download,
  Calendar,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format, subDays } from 'date-fns';

interface ActivityLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: Date;
  details: any;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  status: 'success' | 'error' | 'warning';
}

export function ActivityLogManager() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    action: '',
    user: '',
    resourceType: '',
    dateRange: '7days'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'timestamp' | 'action'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  const fetchActivityLogs = async () => {
    setIsLoading(true);
    try {
      // Create a query to get logs from Firebase
      const logsRef = collection(db, 'activity_logs');
      const q = query(
        logsRef,
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedLogs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as ActivityLog[];
      
      setLogs(fetchedLogs);
      setFilteredLogs(fetchedLogs);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      setError('Failed to load activity logs');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, logs, sortBy, sortDirection]);

  const applyFilters = () => {
    let filtered = [...logs];
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(term) ||
        log.userName.toLowerCase().includes(term) ||
        log.userEmail.toLowerCase().includes(term) ||
        (log.resourceType && log.resourceType.toLowerCase().includes(term))
      );
    }
    
    // Apply action filter
    if (filters.action) {
      filtered = filtered.filter(log => log.action === filters.action);
    }
    
    // Apply user filter
    if (filters.user) {
      filtered = filtered.filter(log => log.userId === filters.user);
    }
    
    // Apply resourceType filter
    if (filters.resourceType) {
      filtered = filtered.filter(log => log.resourceType === filters.resourceType);
    }
    
    // Apply date range filter
    if (filters.dateRange) {
      const now = new Date();
      let startDate: Date;
      
      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case '7days':
          startDate = subDays(now, 7);
          break;
        case '30days':
          startDate = subDays(now, 30);
          break;
        default:
          startDate = subDays(now, 7);
      }
      
      filtered = filtered.filter(log => log.timestamp >= startDate);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'timestamp') {
        return sortDirection === 'asc'
          ? a.timestamp.getTime() - b.timestamp.getTime()
          : b.timestamp.getTime() - a.timestamp.getTime();
      } else if (sortBy === 'action') {
        const result = a.action.localeCompare(b.action);
        return sortDirection === 'asc' ? result : -result;
      }
      return 0;
    });
    
    setFilteredLogs(filtered);
  };

  // When there's limited real data, let's create some demo data
  const generateDemoLogs = (): ActivityLog[] => {
    const actions = ['user_login', 'user_created', 'partner_updated', 'lead_assigned', 'form_created', 'payment_processed', 'message_sent'];
    const resourceTypes = ['user', 'partner', 'lead', 'form', 'payment', 'message'];
    const statuses = ['success', 'error', 'warning'];
    const users = [
      { id: 'admin1', name: 'Admin User', email: 'admin@example.com' },
      { id: 'user1', name: 'John Smith', email: 'john@example.com' }
    ];
    
    const demoLogs: ActivityLog[] = [];
    
    for (let i = 0; i < 20; i++) {
      const actionIndex = Math.floor(Math.random() * actions.length);
      const userIndex = Math.floor(Math.random() * users.length);
      const statusIndex = Math.floor(Math.random() * statuses.length);
      const resourceTypeIndex = Math.floor(Math.random() * resourceTypes.length);
      
      demoLogs.push({
        id: `demo-${i}`,
        action: actions[actionIndex],
        userId: users[userIndex].id,
        userName: users[userIndex].name,
        userEmail: users[userIndex].email,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
        details: { description: `Demo log for ${actions[actionIndex]}` },
        resourceType: resourceTypes[resourceTypeIndex],
        resourceId: `res-${i}`,
        ipAddress: '192.168.1.1',
        status: statuses[statusIndex] as 'success' | 'error' | 'warning'
      });
    }
    
    return demoLogs;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'user_login':
        return <User className="w-4 h-4" />;
      case 'user_created':
      case 'user_updated':
      case 'partner_created':
      case 'partner_updated':
        return <User className="w-4 h-4" />;
      case 'lead_assigned':
      case 'lead_updated':
        return <FileText className="w-4 h-4" />;
      case 'form_created':
      case 'form_updated':
        return <FileText className="w-4 h-4" />;
      case 'payment_processed':
        return <FileText className="w-4 h-4" />;
      default:
        return <History className="w-4 h-4" />;
    }
  };

  // If there's no real data, use demo data
  const displayLogs = filteredLogs.length > 0 ? filteredLogs : generateDemoLogs();

  // Get unique actions, users, and resource types for filters
  const uniqueActions = [...new Set(logs.map(log => log.action))];
  const uniqueUsers = [...new Set(logs.map(log => log.userId))];
  const uniqueUserNames = logs.reduce((acc, log) => {
    acc[log.userId] = log.userName;
    return acc;
  }, {} as Record<string, string>);
  const uniqueResourceTypes = [...new Set(logs.filter(log => log.resourceType).map(log => log.resourceType))];

  const handleSort = (field: 'timestamp' | 'action') => {
    if (field === sortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const formatActionName = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadLogs = () => {
    // Create CSV data
    const csvData = [
      ['Timestamp', 'Action', 'User', 'Email', 'Resource Type', 'Resource ID', 'Status', 'IP Address'],
      ...filteredLogs.map(log => [
        format(log.timestamp, 'yyyy-MM-dd HH:mm:ss'),
        log.action,
        log.userName,
        log.userEmail,
        log.resourceType || '',
        log.resourceId || '',
        log.status,
        log.ipAddress || ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    // Create and download file
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `activity-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
        <button
          onClick={downloadLogs}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </button>
      </div>
      
      <div className="flex space-x-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {showFilters ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
        </button>
      </div>
      
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700">Action</label>
            <select
              value={filters.action}
              onChange={e => setFilters({...filters, action: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{formatActionName(action)}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">User</label>
            <select
              value={filters.user}
              onChange={e => setFilters({...filters, user: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Users</option>
              {uniqueUsers.map(userId => (
                <option key={userId} value={userId}>{uniqueUserNames[userId]}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Resource Type</label>
            <select
              value={filters.resourceType}
              onChange={e => setFilters({...filters, resourceType: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Resource Types</option>
              {uniqueResourceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={e => setFilters({...filters, dateRange: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-lg text-red-700">
          <p>{error}</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      className="flex items-center"
                      onClick={() => handleSort('timestamp')}
                    >
                      Timestamp
                      {sortBy === 'timestamp' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      className="flex items-center"
                      onClick={() => handleSort('action')}
                    >
                      Action
                      {sortBy === 'action' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        <span>
                          {format(log.timestamp, 'MMM d, yyyy HH:mm:ss')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        {getActionIcon(log.action)}
                        <span className="ml-2">{formatActionName(log.action)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {log.userName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {log.userEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {log.resourceType && (
                        <div className="text-gray-900 font-medium capitalize">
                          {log.resourceType}
                        </div>
                      )}
                      {log.resourceId && (
                        <div className="text-gray-500 text-xs">
                          ID: {log.resourceId}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(log.status)}`}>
                        {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {displayLogs.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No activity logs found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { 
  Bell, 
  Users, 
  Send, 
  AlertCircle, 
  CheckCircle, 
  Search,
  Filter,
  RefreshCw,
  CheckSquare,
  Trash2,
  Clock,
  ChevronDown,
  ChevronUp,
  PenSquare
} from 'lucide-react';
import { collection, query, orderBy, getDocs, where, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format } from 'date-fns';

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  recipientId: string;
  recipientName: string;
  createdAt: Date;
  read: boolean;
  type: 'system' | 'admin' | 'lead';
}

export function NotificationsPage() {
  const { partners } = useAdminStore();
  const { sendNotification } = useNotificationStore();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'}>({
    key: 'createdAt',
    direction: 'desc'
  });

  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'admin' as 'admin' | 'system'
  });

  // Fetch all notifications sent by admin
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      // Query the global notifications collection - modified to avoid requiring a composite index
      const notificationsRef = collection(db, 'notifications');
      // Using only orderBy without where clause to avoid index issues
      const q = query(
        notificationsRef,
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const allNotifications = querySnapshot.docs
        // Filter in memory instead of in the query
        .filter(doc => doc.data().createdBy === 'admin')
        .map(doc => {
          const data = doc.data();
          const partnerId = data.partnerId;
          
          // Get partner name
          let recipientName = 'Unknown Partner';
          const partner = partners.find(p => p.id === partnerId);
          if (partner) {
            recipientName = partner.name;
          }
          
          return {
            id: doc.id,
            title: data.title,
            message: data.message,
            recipientId: partnerId,
            recipientName,
            createdAt: data.createdAt?.toDate() || new Date(),
            read: data.read || false,
            type: data.type
          } as AdminNotification;
        });
      
      setNotifications(allNotifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [partners]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleSendNotification = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    
    if (!notificationForm.title || !notificationForm.message) {
      setError('Please provide both title and message');
      setIsLoading(false);
      return;
    }

    if (selectedPartners.length === 0) {
      setError('Please select at least one partner');
      setIsLoading(false);
      return;
    }

    try {
      // Send notification to each selected partner
      await Promise.all(
        selectedPartners.map(async (partnerId) => {
          await sendNotification(
            partnerId,
            notificationForm.title,
            notificationForm.message,
            notificationForm.type
          );
        })
      );

      setSuccess(`Notification sent successfully to ${selectedPartners.length} partner(s)`);
      setNotificationForm({
        title: '',
        message: '',
        type: 'admin'
      });
      setSelectedPartners([]);
      setShowNotificationForm(false);
      
      // Refresh notifications
      await fetchNotifications();
    } catch (err) {
      console.error('Error sending notification:', err);
      setError('Failed to send notification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedNotifications = [...notifications].sort((a, b) => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1;
    
    switch (sortConfig.key) {
      case 'createdAt':
        return direction * (a.createdAt.getTime() - b.createdAt.getTime());
      case 'recipient':
        return direction * a.recipientName.localeCompare(b.recipientName);
      case 'title':
        return direction * a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });
  
  const filteredNotifications = sortedNotifications.filter(notification => 
    notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.recipientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPartners = partners.filter(partner =>
    partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowNotificationForm(!showNotificationForm)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showNotificationForm ? (
              <>
                <ChevronUp className="w-5 h-5 mr-2" />
                Hide Form
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                New Notification
              </>
            )}
          </button>
        </div>
      </div>

      {showNotificationForm && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Send Notification</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notification Type
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="admin"
                    checked={notificationForm.type === 'admin'}
                    onChange={() => setNotificationForm({...notificationForm, type: 'admin'})}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Admin Message</span>
                </label>
                
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="system"
                    checked={notificationForm.type === 'system'}
                    onChange={() => setNotificationForm({...notificationForm, type: 'system'})}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">System Notification</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter notification title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={notificationForm.message}
                onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                rows={4}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter notification message"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipients
              </label>
              <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    checked={selectedPartners.length === partners.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPartners(partners.map(p => p.id));
                      } else {
                        setSelectedPartners([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700">
                    Select All Partners
                  </label>
                </div>
                
                <div className="space-y-2">
                  {filteredPartners.map(partner => (
                    <div key={partner.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedPartners.includes(partner.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPartners([...selectedPartners, partner.id]);
                          } else {
                            setSelectedPartners(selectedPartners.filter(id => id !== partner.id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        {partner.name} <span className="text-gray-500">({partner.email})</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                {success}
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowNotificationForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleSendNotification}
                disabled={isLoading || !notificationForm.title || !notificationForm.message || selectedPartners.length === 0}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send Notification
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search notifications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2"
        />
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('title')}
                  className="flex items-center"
                >
                  Title
                  {sortConfig.key === 'title' && (
                    sortConfig.direction === 'asc' ? 
                      <ChevronUp className="w-4 h-4 ml-1" /> : 
                      <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('recipient')}
                  className="flex items-center"
                >
                  Recipient
                  {sortConfig.key === 'recipient' && (
                    sortConfig.direction === 'asc' ? 
                      <ChevronUp className="w-4 h-4 ml-1" /> : 
                      <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center"
                >
                  Sent
                  {sortConfig.key === 'createdAt' && (
                    sortConfig.direction === 'asc' ? 
                      <ChevronUp className="w-4 h-4 ml-1" /> : 
                      <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
                  <span className="mt-2 block">Loading notifications...</span>
                </td>
              </tr>
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <tr key={notification.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {notification.type === 'admin' ? (
                          <Bell className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Bell className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-md">{notification.message}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{notification.recipientName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {format(notification.createdAt, 'MMM d, yyyy h:mm a')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      notification.read ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {notification.read ? 'Read' : 'Unread'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        title="Send Again"
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => {
                          setNotificationForm({
                            title: notification.title,
                            message: notification.message,
                            type: notification.type as 'admin' | 'system'
                          });
                          setSelectedPartners([notification.recipientId]);
                          setShowNotificationForm(true);
                        }}
                      >
                        <PenSquare className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  {searchTerm ? 'No notifications match your search' : 'No notifications found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
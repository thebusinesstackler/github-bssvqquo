import React from 'react';
import { Bell, Clock, AlertCircle, CheckCircle2, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'lead' | 'system' | 'reminder' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const DUMMY_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'lead',
    title: 'New Lead Assigned',
    message: 'A new diabetes study lead has been assigned to you. Response required within 1 hour.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    read: false,
  },
  {
    id: '2',
    type: 'reminder',
    title: 'Lead Response Required',
    message: 'Urgent: Lead "Sarah Johnson" requires response within 30 minutes.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    read: false,
  },
  {
    id: '3',
    type: 'success',
    title: 'Lead Successfully Randomized',
    message: 'Patient "Michael Brown" has been successfully randomized into the study.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    read: true,
  },
  {
    id: '4',
    type: 'system',
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur tonight at 2 AM EST.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: true,
  },
];

export function NotificationsPage() {
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'lead':
        return <User className="w-6 h-6 text-blue-500" />;
      case 'reminder':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'system':
        return <AlertCircle className="w-6 h-6 text-purple-500" />;
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      default:
        return <Bell className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <button className="text-sm text-blue-600 hover:text-blue-800">
          Mark all as read
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        {DUMMY_NOTIFICATIONS.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start p-4 border-b border-gray-100 ${
              !notification.read ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex-shrink-0">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">
                  {notification.title}
                </p>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
            </div>
            {!notification.read && (
              <div className="ml-4 flex-shrink-0">
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-center">
        <button className="text-sm text-gray-600 hover:text-gray-900">
          Load more notifications
        </button>
      </div>
    </div>
  );
}
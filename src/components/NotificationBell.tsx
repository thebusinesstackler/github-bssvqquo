import React, { useEffect, useState } from 'react';
import { Bell, MessageSquare, UserPlus, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { format } from 'date-fns';

export function NotificationBell() {
  const { user, impersonatedUser } = useAuthStore();
  const { notifications, unreadCount, subscribeToNotifications, markAsRead } = useNotificationStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const effectiveUser = impersonatedUser || user;

  useEffect(() => {
    if (effectiveUser?.id) {
      // Subscribe to real-time notifications for the effective user (the one we're viewing as)
      const unsubscribe = subscribeToNotifications(effectiveUser.id);
      return () => unsubscribe();
    }
  }, [effectiveUser?.id, subscribeToNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'admin':
        return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case 'system':
        return <UserPlus className="w-5 h-5 text-green-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="font-medium text-gray-900">{notification.title}</p>
                        <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                        <p className="mt-2 text-xs text-gray-500">
                          {format(notification.createdAt, 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="ml-4 text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            )}
          </div>
          {notifications.length > 0 && (
            <div className="p-2 border-t border-gray-100 text-center">
              <button 
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={() => {
                  // Mark all notifications as read
                  notifications.filter(n => !n.read).forEach(n => {
                    handleMarkAsRead(n.id);
                  });
                }}
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
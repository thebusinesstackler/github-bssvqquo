import { create } from 'zustand';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'welcome' | 'system' | 'admin' | 'lead';
  read: boolean;
  partnerId: string;
  createdAt: Date;
  createdBy?: string;
  leadId?: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: (partnerId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  sendNotification: (partnerId: string, title: string, message: string, type: 'admin' | 'lead' | 'system', leadId?: string) => Promise<string>;
  subscribeToNotifications: (partnerId: string) => () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async (partnerId: string) => {
    if (!partnerId) {
      console.error('Partner ID is null or undefined. Cannot fetch notifications.');
      set({ error: 'Invalid partner ID', isLoading: false });
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      const notificationsRef = collection(db, `partners/${partnerId}/notifications`);
      const q = query(
        notificationsRef,
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const notifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Notification[];

      set({
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      set({ error: 'Failed to fetch notifications', isLoading: false });
    }
  },

  subscribeToNotifications: (partnerId: string) => {
    // Check for valid partnerId before attempting to query
    if (!partnerId) {
      console.error('Partner ID is null or undefined. Cannot subscribe to notifications.');
      set({ error: 'Invalid partner ID' });
      return () => {}; // Return an empty unsubscribe function
    }
    
    const notificationsRef = collection(db, `partners/${partnerId}/notifications`);
    const q = query(
      notificationsRef,
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Notification[];

      set({
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
        error: null // Clear any previous errors
      });
    }, (error) => {
      console.error('Error subscribing to notifications:', error);
      set({ error: 'Failed to subscribe to notifications' });
    });

    return unsubscribe;
  },

  markAsRead: async (notificationId: string) => {
    try {
      const { notifications } = get();
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification?.partnerId) throw new Error('Notification not found');

      const notificationRef = doc(db, `partners/${notification.partnerId}/notifications`, notificationId);
      await updateDoc(notificationRef, {
        read: true,
        updatedAt: serverTimestamp()
      });

      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: state.unreadCount - 1
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  },

  sendNotification: async (partnerId: string, title: string, message: string, type: 'admin' | 'lead' | 'system', leadId?: string) => {
    if (!partnerId) {
      console.error('Partner ID is null or undefined. Cannot send notification.');
      throw new Error('Invalid partner ID');
    }
    
    try {
      const batch = writeBatch(db);

      // Create notification in partner's subcollection
      const notificationRef = doc(collection(db, `partners/${partnerId}/notifications`));
      const notificationData = {
        partnerId,
        title,
        message,
        type,
        read: false,
        createdAt: serverTimestamp(),
        createdBy: 'admin',
        ...(leadId && { leadId })
      };

      batch.set(notificationRef, notificationData);

      // Create message in partner's messages subcollection
      const messageRef = doc(collection(db, `partners/${partnerId}/messages`));
      const messageData = {
        content: message,
        senderId: 'admin',
        recipientId: partnerId,
        timestamp: serverTimestamp(),
        read: false,
        ...(leadId && { leadId }),
        notificationId: notificationRef.id
      };

      batch.set(messageRef, messageData);

      // Create a global notification entry for real-time updates
      const globalNotificationRef = doc(collection(db, 'notifications'));
      batch.set(globalNotificationRef, {
        ...notificationData,
        id: notificationRef.id
      });

      // Commit all operations atomically
      await batch.commit();

      // Return the notification ID
      return notificationRef.id;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw new Error('Failed to send notification');
    }
  }
}));
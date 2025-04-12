import { create } from 'zustand';
import { Partner, Lead, AdminMetrics, User, SubscriptionTier } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, deleteDoc, doc, query, where, updateDoc, serverTimestamp, getDoc, limit, setDoc } from 'firebase/firestore';
import { deleteUser as deleteFirebaseUser } from 'firebase/auth';

interface AdminStore {
  partners: Partner[];
  adminMetrics: AdminMetrics;
  selectedPartnerId: string | null;
  impersonatedPartnerId: string | null;
  users: User[];
  isLoading: boolean;
  error: string | null;
  
  fetchPartners: () => Promise<void>;
  getPartner: (id: string) => Partner | undefined;
  updatePartnerSubscription: (partnerId: string, tier: SubscriptionTier) => Promise<void>;
  updatePartnerLeadQuota: (partnerId: string, maxLeads: number) => Promise<void>;
  deactivatePartner: (partnerId: string) => Promise<void>;
  reactivatePartner: (partnerId: string) => Promise<void>;
  deletePartner: (partnerId: string) => Promise<void>;
  
  fetchUsers: () => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateUserRole: (userId: string, isAdmin: boolean) => Promise<void>;
  
  assignLead: (leadId: string, partnerId: string) => void;
  reassignLead: (leadId: string, fromPartnerId: string, toPartnerId: string) => void;
  addManualLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'lastUpdated'>, partnerId: string) => void;
  
  startImpersonation: (partnerId: string) => void;
  stopImpersonation: () => void;
  
  generatePerformanceReport: (partnerId: string, startDate: Date, endDate: Date) => void;
  getResponseTimeReport: () => { partnerId: string; averageTime: number }[];
  
  calculateAdminMetrics: () => Promise<void>;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  partners: [],
  adminMetrics: {
    totalLeads: 0,
    activePartners: 0,
    averageResponseTime: 0,
    totalRevenue: 0,
    leadDistribution: [],
    revenueHistory: []
  },
  selectedPartnerId: null,
  impersonatedPartnerId: null,
  users: [],
  isLoading: false,
  error: null,

  fetchPartners: async () => {
    set({ isLoading: true, error: null });
    try {
      const partnersRef = collection(db, 'partners');
      const querySnapshot = await getDocs(partnersRef);
      
      const partners = querySnapshot.docs
        .filter(doc => doc.id !== 'admin') // Exclude admin document
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          billing: doc.data().billing ? {
            ...doc.data().billing,
            nextBillingDate: doc.data().billing?.nextBillingDate?.toDate() || new Date()
          } : undefined
        })) as Partner[];

      console.log("Fetched partners:", partners.length);
      set({ partners, isLoading: false });
      
      // Calculate metrics after fetching partners
      await get().calculateAdminMetrics();
      
      // Automatically fetch users as well to keep them in sync
      await get().fetchUsers();
    } catch (error) {
      console.error('Error fetching partners:', error);
      set({ error: 'Failed to fetch partners', isLoading: false });
    }
  },

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const usersRef = collection(db, 'partners');
      const querySnapshot = await getDocs(usersRef);
      
      const users = querySnapshot.docs
        .filter(doc => doc.id !== 'admin')
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          active: doc.data().active ?? true,
          name: doc.data().name || 'Unknown User',
          role: doc.data().role || 'partner'
        })) as User[];

      console.log("Fetched users:", users.length);
      set({ users, isLoading: false });
    } catch (error) {
      console.error('Error fetching users:', error);
      set({ error: 'Failed to fetch users', isLoading: false });
    }
  },

  deleteUser: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      await deleteDoc(doc(db, 'partners', userId));
      
      set(state => ({
        users: state.users.filter(user => user.id !== userId),
        partners: state.partners.filter(partner => partner.id !== userId),
        isLoading: false
      }));
      
      // Recalculate metrics after deletion
      await get().calculateAdminMetrics();
    } catch (error) {
      console.error('Error deleting user:', error);
      set({ error: 'Failed to delete user', isLoading: false });
    }
  },

  deletePartner: async (partnerId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Delete all subcollections first (leads, notifications, etc.)
      const leadsDocs = await getDocs(collection(db, `partners/${partnerId}/leads`));
      const notificationsDocs = await getDocs(collection(db, `partners/${partnerId}/notifications`));
      const sitesDocs = await getDocs(collection(db, `partners/${partnerId}/sites`));
      const messagesDocs = await getDocs(collection(db, `partners/${partnerId}/messages`));
      
      // Delete leads
      for (const leadDoc of leadsDocs.docs) {
        await deleteDoc(doc(db, `partners/${partnerId}/leads/${leadDoc.id}`));
      }
      
      // Delete notifications
      for (const notifDoc of notificationsDocs.docs) {
        await deleteDoc(doc(db, `partners/${partnerId}/notifications/${notifDoc.id}`));
      }
      
      // Delete sites
      for (const siteDoc of sitesDocs.docs) {
        await deleteDoc(doc(db, `partners/${partnerId}/sites/${siteDoc.id}`));
      }
      
      // Delete messages
      for (const messageDoc of messagesDocs.docs) {
        await deleteDoc(doc(db, `partners/${partnerId}/messages/${messageDoc.id}`));
      }
      
      // Finally delete the partner document
      await deleteDoc(doc(db, 'partners', partnerId));
      
      set(state => ({
        partners: state.partners.filter(partner => partner.id !== partnerId),
        users: state.users.filter(user => user.id !== partnerId),
        isLoading: false
      }));
      
      // Recalculate metrics after deletion
      await get().calculateAdminMetrics();
    } catch (error) {
      console.error('Error deleting partner:', error);
      set({ error: 'Failed to delete partner', isLoading: false });
    }
  },

  updateUserRole: async (userId: string, isAdmin: boolean) => {
    set({ isLoading: true, error: null });
    try {
      const userRef = doc(db, 'partners', userId);
      await updateDoc(userRef, {
        role: isAdmin ? 'admin' : 'partner',
        updatedAt: serverTimestamp()
      });

      set(state => ({
        users: state.users.map(user =>
          user.id === userId
            ? { ...user, role: isAdmin ? 'admin' : 'partner' }
            : user
        ),
        partners: state.partners.map(partner => 
          partner.id === userId
            ? { ...partner, role: isAdmin ? 'admin' : 'partner' }
            : partner
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error('Error updating user role:', error);
      set({ error: 'Failed to update user role', isLoading: false });
    }
  },

  getPartner: (id) => {
    return get().partners.find(p => p.id === id);
  },

  updatePartnerSubscription: async (partnerId, tier) => {
    set({ isLoading: true, error: null });
    try {
      const partnerRef = doc(db, 'partners', partnerId);
      
      // Get partner document to determine pricing
      const partnerDoc = await getDoc(partnerRef);
      if (!partnerDoc.exists()) {
        throw new Error('Partner not found');
      }
      
      // Determine pricing based on tier
      let amount = 0;
      switch(tier) {
        case 'basic':
          amount = 180;
          break;
        case 'professional':
          amount = 299;
          break;
        case 'enterprise':
          amount = 499;
          break;
        case 'none':
          amount = 0;
          break;
      }
      
      // Default lead limits based on subscription
      let maxLeads = 0;
      switch(tier) {
        case 'basic':
          maxLeads = 50;
          break;
        case 'professional':
          maxLeads = 100;
          break;
        case 'enterprise':
          maxLeads = 500;
          break;
        case 'none':
          maxLeads = 10;
          break;
      }
      
      // Use current maxLeads if it's higher than the default
      const currentMaxLeads = partnerDoc.data()?.maxLeads || 0;
      if (currentMaxLeads > maxLeads) {
        maxLeads = currentMaxLeads;
      }
      
      // Update partner document
      await updateDoc(partnerRef, {
        subscription: tier,
        maxLeads,
        billing: {
          plan: tier,
          status: tier === 'none' ? 'inactive' : 'active',
          amount,
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      set((state) => ({
        partners: state.partners.map(partner =>
          partner.id === partnerId
            ? {
                ...partner,
                subscription: tier,
                maxLeads,
                billing: {
                  ...partner.billing,
                  plan: tier,
                  status: tier === 'none' ? 'inactive' : 'active',
                  amount,
                  nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
              }
            : partner
        ),
        users: state.users.map(user =>
          user.id === partnerId
            ? {
                ...user,
                subscription: tier
              }
            : user
        ),
        isLoading: false
      }));
      
      // Recalculate metrics after update
      await get().calculateAdminMetrics();
    } catch (error) {
      console.error('Error updating partner subscription:', error);
      set({ error: 'Failed to update subscription', isLoading: false });
    }
  },

  updatePartnerLeadQuota: async (partnerId, maxLeads) => {
    set({ isLoading: true, error: null });
    try {
      const partnerRef = doc(db, 'partners', partnerId);
      
      // Get partner document to calculate utilization
      const partnerDoc = await getDoc(partnerRef);
      if (!partnerDoc.exists()) {
        throw new Error('Partner not found');
      }
      
      const currentLeads = partnerDoc.data()?.currentLeads || 0;
      const quotaUtilization = maxLeads > 0 ? Math.round((currentLeads / maxLeads) * 100) : 0;
      
      // Update partner document
      await updateDoc(partnerRef, {
        maxLeads,
        quotaUtilization,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      set((state) => ({
        partners: state.partners.map(partner =>
          partner.id === partnerId
            ? {
                ...partner,
                maxLeads,
                quotaUtilization
              }
            : partner
        ),
        users: state.users.map(user =>
          user.id === partnerId
            ? {
                ...user,
                maxLeads
              }
            : user
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error('Error updating partner lead quota:', error);
      set({ error: 'Failed to update lead quota', isLoading: false });
    }
  },

  deactivatePartner: async (partnerId) => {
    set({ isLoading: true, error: null });
    try {
      const partnerRef = doc(db, 'partners', partnerId);
      await updateDoc(partnerRef, {
        active: false,
        updatedAt: serverTimestamp()
      });
      
      set((state) => ({
        partners: state.partners.map(partner =>
          partner.id === partnerId
            ? { ...partner, active: false }
            : partner
        ),
        users: state.users.map(user =>
          user.id === partnerId
            ? { ...user, active: false }
            : user
        ),
        isLoading: false
      }));
      
      // Recalculate metrics after deactivation
      await get().calculateAdminMetrics();
    } catch (error) {
      console.error('Error deactivating partner:', error);
      set({ error: 'Failed to deactivate partner', isLoading: false });
    }
  },

  reactivatePartner: async (partnerId) => {
    set({ isLoading: true, error: null });
    try {
      const partnerRef = doc(db, 'partners', partnerId);
      await updateDoc(partnerRef, {
        active: true,
        updatedAt: serverTimestamp()
      });
      
      set((state) => ({
        partners: state.partners.map(partner =>
          partner.id === partnerId
            ? { ...partner, active: true }
            : partner
        ),
        users: state.users.map(user =>
          user.id === partnerId
            ? { ...user, active: true }
            : user
        ),
        isLoading: false
      }));
      
      // Recalculate metrics after reactivation
      await get().calculateAdminMetrics();
    } catch (error) {
      console.error('Error reactivating partner:', error);
      set({ error: 'Failed to reactivate partner', isLoading: false });
    }
  },

  assignLead: (leadId, partnerId) => {
    console.log(`Assigning lead ${leadId} to partner ${partnerId}`);
  },

  reassignLead: (leadId, fromPartnerId, toPartnerId) => {
    console.log(`Reassigning lead ${leadId} from ${fromPartnerId} to ${toPartnerId}`);
  },

  addManualLead: (lead, partnerId) => {
    console.log(`Adding manual lead for partner ${partnerId}`, lead);
  },

  startImpersonation: (partnerId) => {
    set({ impersonatedPartnerId: partnerId });
  },

  stopImpersonation: () => {
    set({ impersonatedPartnerId: null });
  },

  generatePerformanceReport: (partnerId, startDate, endDate) => {
    console.log(`Generating report for ${partnerId} from ${startDate} to ${endDate}`);
  },

  getResponseTimeReport: () => {
    return get().partners.map(partner => ({
      partnerId: partner.id,
      averageTime: partner.responseMetrics?.averageResponseTime || 0
    }));
  },
  
  // Calculate admin metrics based on actual partner data
  calculateAdminMetrics: async () => {
    try {
      const partners = get().partners;
      
      // Count active partners
      const activePartners = partners.filter(p => p.active).length;
      
      // Calculate total leads
      let totalLeads = 0;
      partners.forEach(partner => {
        totalLeads += partner.currentLeads || 0;
      });
      
      // Calculate average response time from partners with data
      let totalResponseTime = 0;
      let partnersWithResponseTime = 0;
      partners.forEach(partner => {
        if (partner.responseMetrics?.averageResponseTime) {
          totalResponseTime += partner.responseMetrics.averageResponseTime;
          partnersWithResponseTime++;
        }
      });
      const averageResponseTime = partnersWithResponseTime > 0 
        ? Math.round(totalResponseTime / partnersWithResponseTime) 
        : 0;
      
      // Calculate total revenue from paid subscriptions
      let totalRevenue = 0;
      partners.forEach(partner => {
        // Only count active subscriptions that aren't 'none'
        if (partner.active && partner.subscription !== 'none' && partner.billing?.amount) {
          totalRevenue += partner.billing.amount;
        }
      });
      
      // Create lead distribution data
      const leadDistribution = partners.map(partner => ({
        partnerName: partner.name,
        leadsCount: partner.currentLeads || 0,
        responseRate: partner.responseMetrics?.responseRate || 0
      }));
      
      // Set the updated metrics
      set(state => ({
        adminMetrics: {
          ...state.adminMetrics,
          totalLeads,
          activePartners,
          averageResponseTime,
          totalRevenue,
          leadDistribution
        }
      }));
    } catch (error) {
      console.error('Error calculating admin metrics:', error);
    }
  }
}));
import { create } from 'zustand';
import { Partner, Lead, AdminMetrics, User, SubscriptionTier } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, deleteDoc, doc, query, where, updateDoc, serverTimestamp } from 'firebase/firestore';
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
  updatePartnerSubscription: (partnerId: string, tier: SubscriptionTier) => void;
  deactivatePartner: (partnerId: string) => void;
  reactivatePartner: (partnerId: string) => void;
  
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
          billing: {
            ...doc.data().billing,
            nextBillingDate: doc.data().billing?.nextBillingDate?.toDate() || new Date()
          }
        })) as Partner[];

      set({ partners, isLoading: false });
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
    } catch (error) {
      console.error('Error deleting user:', error);
      set({ error: 'Failed to delete user', isLoading: false });
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

  updatePartnerSubscription: (partnerId, tier) => {
    set((state) => ({
      partners: state.partners.map(partner =>
        partner.id === partnerId
          ? {
              ...partner,
              subscription: tier,
              billing: {
                ...partner.billing,
                plan: tier,
                amount: tier === 'basic' ? 99 : tier === 'professional' ? 299 : 999
              }
            }
          : partner
      )
    }));
  },

  deactivatePartner: (partnerId) => {
    set((state) => ({
      partners: state.partners.map(partner =>
        partner.id === partnerId
          ? { ...partner, active: false }
          : partner
      )
    }));
  },

  reactivatePartner: (partnerId) => {
    set((state) => ({
      partners: state.partners.map(partner =>
        partner.id === partnerId
          ? { ...partner, active: true }
          : partner
      )
    }));
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
      averageTime: partner.responseMetrics.averageResponseTime
    }));
  }
}));
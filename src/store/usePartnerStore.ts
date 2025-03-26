import { create } from 'zustand';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

interface Site {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  principalInvestigator: string;
  studyCoordinator: string;
  status: 'active' | 'inactive';
  leads: number;
  responseRate: string;
  createdAt: Date;
}

interface PartnerStore {
  sites: Site[];
  isLoading: boolean;
  error: string | null;
  fetchSites: (partnerId: string) => Promise<void>;
  addSite: (partnerId: string, siteData: Omit<Site, 'id' | 'createdAt' | 'leads' | 'responseRate' | 'status'>) => Promise<void>;
  updateSite: (partnerId: string, siteId: string, updates: Partial<Site>) => Promise<void>;
  deleteSite: (partnerId: string, siteId: string) => Promise<void>;
}

export const usePartnerStore = create<PartnerStore>((set) => ({
  sites: [],
  isLoading: false,
  error: null,

  fetchSites: async (partnerId: string) => {
    set({ isLoading: true, error: null });
    try {
      if (!partnerId) {
        throw new Error('Partner ID is required');
      }

      const sitesRef = collection(db, `partners/${partnerId}/sites`);
      const querySnapshot = await getDocs(sitesRef);
      
      const sites = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Site[];

      set({ sites, isLoading: false, error: null });
    } catch (error) {
      console.error('Error fetching sites:', error);
      set({ error: 'Failed to fetch sites', isLoading: false });
    }
  },

  addSite: async (partnerId: string, siteData) => {
    set({ isLoading: true, error: null });
    try {
      if (!partnerId) {
        throw new Error('Partner ID is required');
      }

      const sitesRef = collection(db, `partners/${partnerId}/sites`);
      
      const newSite = {
        ...siteData,
        status: 'active' as const,
        leads: 0,
        responseRate: '0%',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(sitesRef, newSite);
      
      set(state => ({
        sites: [...state.sites, { id: docRef.id, ...newSite, createdAt: new Date() }],
        isLoading: false,
        error: null
      }));
    } catch (error) {
      console.error('Error adding site:', error);
      set({ error: 'Failed to add site', isLoading: false });
    }
  },

  updateSite: async (partnerId: string, siteId: string, updates) => {
    set({ isLoading: true, error: null });
    try {
      if (!partnerId || !siteId) {
        throw new Error('Partner ID and Site ID are required');
      }

      const siteRef = doc(db, `partners/${partnerId}/sites/${siteId}`);
      await updateDoc(siteRef, updates);

      set(state => ({
        sites: state.sites.map(site =>
          site.id === siteId ? { ...site, ...updates } : site
        ),
        isLoading: false,
        error: null
      }));
    } catch (error) {
      console.error('Error updating site:', error);
      set({ error: 'Failed to update site', isLoading: false });
    }
  },

  deleteSite: async (partnerId: string, siteId: string) => {
    set({ isLoading: true, error: null });
    try {
      if (!partnerId || !siteId) {
        throw new Error('Partner ID and Site ID are required');
      }

      const siteRef = doc(db, `partners/${partnerId}/sites/${siteId}`);
      await deleteDoc(siteRef);

      set(state => ({
        sites: state.sites.filter(site => site.id !== siteId),
        isLoading: false,
        error: null
      }));
    } catch (error) {
      console.error('Error deleting site:', error);
      set({ error: 'Failed to delete site', isLoading: false });
    }
  }
}));
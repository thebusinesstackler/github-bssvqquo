import { create } from 'zustand';
import { db } from '../lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  where,
} from 'firebase/firestore';
import { Partner } from '../types';

export interface Site {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

interface PartnerStore {
  partners: Partner[];
  isLoading: boolean;
  error: string | null;
  fetchPartners: (searchName?: string) => Promise<void>;
  addPartner: (partnerData: Omit<Partner, 'id' | 'createdAt'>) => Promise<string>;
  updatePartner: (partnerId: string, updates: Partial<Partner>) => Promise<void>;
  deletePartner: (partnerId: string) => Promise<void>;
  searchName: string;
  setSearchName: (searchName: string) => void;
  filteredPartners: Partner[];
}

export const usePartnerStore = create<PartnerStore>((set) => ({
  partners: [],
  isLoading: false,
  error: null,
  searchName: '',
  filteredPartners: [],

  setSearchName: (searchName) => set({ searchName }),

  fetchPartners: async (searchName = '') => {
    set({ isLoading: true, error: null });
    try {
      let q = query(
        collection(db, 'partners'),
        orderBy('name') // Assuming you want to order by name
      );

      if (searchName) {
        q = query(
          collection(db, 'partners'),
          where('name', '>=', searchName),
          where('name', '<=', searchName + '\uf8ff'),
          orderBy('name')
        );
      }

      const querySnapshot = await getDocs(q);

      const partners = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Partner[];

      set({
        partners,
        isLoading: false,
        error: null,
        filteredPartners: partners,
      });
    } catch (err) {
      const error = err as Error;
      set({ isLoading: false, error: error.message, partners: [] });
    }
  },

  addPartner: async (partnerData) => {
    set({ isLoading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'partners'), {
        ...partnerData,
        createdAt: serverTimestamp(),
      });

      const newPartner = {
        id: docRef.id,
        ...partnerData,
        createdAt: new Date(),
      };

      set((state) => ({
        partners: [...state.partners, newPartner],
        isLoading: false,
        error: null,
      }));

      return docRef.id;
    } catch (err) {
      const error = err as Error;
      set({ isLoading: false, error: error.message });
      return '';
    }
  },

  updatePartner: async (partnerId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const partnerRef = doc(db, 'partners', partnerId);
      await updateDoc(partnerRef, updates);

      set((state) => ({
        partners: state.partners.map((partner) =>
          partner.id === partnerId ? { ...partner, ...updates } : partner
        ),
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      const error = err as Error;
      set({ isLoading: false, error: error.message });
    }
  },

  deletePartner: async (partnerId) => {
    set({ isLoading: true, error: null });
    try {
      const partnerRef = doc(db, 'partners', partnerId);
      await deleteDoc(partnerRef);

      set((state) => ({
        partners: state.partners.filter((partner) => partner.id !== partnerId),
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      const error = err as Error;
      set({ isLoading: false, error: error.message });
    }
  },
}));
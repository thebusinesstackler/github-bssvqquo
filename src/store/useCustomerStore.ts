import { create } from 'zustand';
import { Customer } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { useAuthStore } from './useAuthStore';

interface CustomerStore {
  customers: Customer[];
  selectedCustomer: Customer | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCustomers: (partnerId: string) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  selectCustomer: (customer: Customer | null) => void;
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: [],
  selectedCustomer: null,
  isLoading: false,
  error: null,

  fetchCustomers: async (partnerId: string) => {
    set({ isLoading: true, error: null });
    try {
      const q = query(collection(db, 'customers'), where('partnerId', '==', partnerId));
      const querySnapshot = await getDocs(q);
      const customers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      
      set({ customers });
    } catch (error) {
      set({ error: 'Failed to fetch customers' });
    } finally {
      set({ isLoading: false });
    }
  },

  addCustomer: async (customerData) => {
    set({ isLoading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'customers'), {
        ...customerData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const newCustomer = {
        id: docRef.id,
        ...customerData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Customer;

      set(state => ({
        customers: [...state.customers, newCustomer]
      }));
    } catch (error) {
      set({ error: 'Failed to add customer' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateCustomer: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const customerRef = doc(db, 'customers', id);
      await updateDoc(customerRef, {
        ...updates,
        updatedAt: new Date()
      });

      set(state => ({
        customers: state.customers.map(customer =>
          customer.id === id
            ? { ...customer, ...updates, updatedAt: new Date() }
            : customer
        )
      }));
    } catch (error) {
      set({ error: 'Failed to update customer' });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteCustomer: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteDoc(doc(db, 'customers', id));
      set(state => ({
        customers: state.customers.filter(customer => customer.id !== id),
        selectedCustomer: state.selectedCustomer?.id === id ? null : state.selectedCustomer
      }));
    } catch (error) {
      set({ error: 'Failed to delete customer' });
    } finally {
      set({ isLoading: false });
    }
  },

  selectCustomer: (customer) => {
    set({ selectedCustomer: customer });
  }
}));
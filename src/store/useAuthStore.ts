import { create } from 'zustand';
import { User } from '../types';
import { loginWithEmailAndPassword, logoutUser, initializeAuth } from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AuthStore {
  user: User | null;
  impersonatedUser: User | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  startImpersonation: (partner: User) => void;
  stopImpersonation: () => void;
  initializeAuthState: () => () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  impersonatedUser: null,
  isLoading: true,
  error: null,
  initialized: false,

  initializeAuthState: () => {
    try {
      // Try to restore session from localStorage first
      const storedSession = localStorage.getItem('userSession');
      const storedImpersonation = localStorage.getItem('impersonatedUser');
      
      if (storedSession) {
        try {
          const userData = JSON.parse(storedSession);
          const impersonatedData = storedImpersonation ? JSON.parse(storedImpersonation) : null;
          set({ 
            user: userData,
            impersonatedUser: impersonatedData,
            isLoading: false,
            initialized: true 
          });
        } catch (error) {
          console.error('Error restoring session:', error);
          localStorage.removeItem('userSession');
          localStorage.removeItem('impersonatedUser');
        }
      }

      // Set up auth state listener
      const unsubscribe = initializeAuth((user: FirebaseUser | null) => {
        if (!user) {
          set({ 
            user: null, 
            impersonatedUser: null, 
            isLoading: false, 
            initialized: true 
          });
          localStorage.removeItem('userSession');
          localStorage.removeItem('impersonatedUser');
          return;
        }

        // User is already authenticated, update the store
        const userData = {
          id: user.uid,
          email: user.email || '',
          name: user.displayName || '',
          role: (user.email === 'theranovex@gmail.com' || user.email === 'digitaltackler@gmail.com') ? 'admin' : 'partner',
          createdAt: new Date(user.metadata?.creationTime || Date.now()),
          active: true
        };

        set({ 
          user: userData,
          isLoading: false,
          initialized: true
        });

        // Store session
        localStorage.setItem('userSession', JSON.stringify(userData));
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error in initializeAuthState:', error);
      set({ 
        user: null,
        impersonatedUser: null,
        isLoading: false,
        initialized: true,
        error: error instanceof Error ? error.message : 'Failed to initialize auth state'
      });
      return () => {};
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const userData = await loginWithEmailAndPassword(email, password);
      set({ user: userData, isLoading: false });
    } catch (error) {
      console.error('Login error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to login', 
        isLoading: false 
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await logoutUser();
      set({ 
        user: null, 
        impersonatedUser: null, 
        isLoading: false 
      });
      localStorage.removeItem('userSession');
      localStorage.removeItem('impersonatedUser');
    } catch (error) {
      console.error('Logout error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to logout',
        isLoading: false 
      });
      throw error;
    }
  },

  updateProfile: async (updates) => {
    set({ isLoading: true, error: null });
    try {
      const currentUser = get().user;
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      // Update Firestore document
      const userRef = doc(db, 'partners', currentUser.id);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date()
      });

      // Update local state
      const updatedUser = { ...currentUser, ...updates };
      localStorage.setItem('userSession', JSON.stringify(updatedUser));
      set({ 
        user: updatedUser,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update profile',
        isLoading: false
      });
      throw error;
    }
  },

  startImpersonation: (partner) => {
    set((state) => {
      const impersonatedUser = {
        ...partner,
        role: 'partner'
      };
      localStorage.setItem('impersonatedUser', JSON.stringify(impersonatedUser));
      return { impersonatedUser };
    });
  },

  stopImpersonation: () => {
    localStorage.removeItem('impersonatedUser');
    set({ impersonatedUser: null });
  }
}));
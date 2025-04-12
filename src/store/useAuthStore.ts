import { create } from 'zustand';
import { User } from '../types';
import { 
  loginWithEmailAndPassword,
  logoutUser,
  initializeAuth
} from '../lib/firebase';

interface AuthStore {
  user: User | null;
  impersonatedUser: User | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  startImpersonation: (user: User) => void;
  stopImpersonation: () => void;
  initializeAuthState: () => () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  impersonatedUser: null,
  isLoading: false,
  error: null,
  initialized: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const userData = await loginWithEmailAndPassword(email, password);
      set({ user: userData as User, isLoading: false });
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
    } catch (error) {
      console.error('Logout error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to logout', 
        isLoading: false 
      });
      throw error;
    }
  },

  startImpersonation: (user: User) => {
    localStorage.setItem('impersonatedUser', JSON.stringify(user));
    set({ impersonatedUser: user });
  },

  stopImpersonation: () => {
    localStorage.removeItem('impersonatedUser');
    set({ impersonatedUser: null });
  },

  initializeAuthState: () => {
    set({ isLoading: true });
    
    // Check for impersonated user in local storage
    const impersonatedUserData = localStorage.getItem('impersonatedUser');
    if (impersonatedUserData) {
      try {
        const impersonatedUser = JSON.parse(impersonatedUserData);
        set({ impersonatedUser });
      } catch (error) {
        console.error('Error parsing impersonated user data:', error);
        localStorage.removeItem('impersonatedUser');
      }
    }
    
    // Initialize Firebase auth state
    const unsubscribe = initializeAuth(user => {
      if (user) {
        set({ 
          user: user as unknown as User, 
          isLoading: false,
          initialized: true
        });
      } else {
        set({ 
          user: null, 
          isLoading: false,
          initialized: true
        });
      }
    });
    
    return unsubscribe;
  }
}));
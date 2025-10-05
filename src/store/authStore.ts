import { create } from 'zustand';
import type { AuthState, User } from '@/types';
import { authService } from '@/services/authService';

interface AuthStore extends AuthState {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, llmApiKey: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const user = await authService.login(email, password);
      set({ user, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Login failed',
        loading: false,
      });
      throw error;
    }
  },

  register: async (email, password, displayName, llmApiKey) => {
    set({ loading: true, error: null });
    try {
      const user = await authService.register(email, password, displayName, llmApiKey);
      set({ user, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Registration failed',
        loading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await authService.logout();
      set({ user: null, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Logout failed',
        loading: false,
      });
      throw error;
    }
  },

  initialize: () => {
    authService.onAuthStateChange((user) => {
      set({ user, loading: false });
    });
  },
}));

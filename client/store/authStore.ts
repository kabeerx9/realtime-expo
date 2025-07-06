import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

export interface AuthState {
  // Auth state
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;

  // Loading states
  isLoading: boolean;
  isSigningIn: boolean;
  isSigningUp: boolean;

  // Error state
  error: string | null;

  // Actions
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  setSigningIn: (signingIn: boolean) => void;
  setSigningUp: (signingUp: boolean) => void;
  setError: (error: string | null) => void;
  signOut: () => void;
  clearError: () => void;

  // Auth flow actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;

  // Computed
  isTokenExpired: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isSigningIn: false,
      isSigningUp: false,
      error: null,

      // Basic setters
      setTokens: (accessToken, refreshToken) => {
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
          error: null,
        });
      },

      setUser: (user) => {
        set({ user, isAuthenticated: true, isLoading: false });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setSigningIn: (signingIn) => {
        set({ isSigningIn: signingIn });
      },

      setSigningUp: (signingUp) => {
        set({ isSigningUp: signingUp });
      },

      setError: (error) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      signOut: () => {
        set({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
          error: null,
          isLoading: false,
          isSigningIn: false,
          isSigningUp: false,
        });
      },

      // Auth flow methods - delegate to auth service
      signIn: async (email: string, password: string) => {
        const { authService } = await import('../services/authService');
        return authService.signIn(email, password);
      },

      signUp: async (email: string, password: string, firstName: string, lastName: string) => {
        const { authService } = await import('../services/authService');
        return authService.signUp(email, password, firstName, lastName);
      },

      refreshAccessToken: async () => {
        const { authService } = await import('../services/authService');
        return authService.refreshAccessToken();
      },

      // Utility methods
      isTokenExpired: () => {
        const { accessToken } = get();
        if (!accessToken) return true;

        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          return Date.now() >= payload.exp * 1000;
        } catch {
          return true;
        }
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

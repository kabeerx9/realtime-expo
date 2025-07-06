import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ConnectionState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  lastConnected: Date | null;
  connectionError: string | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;

  // Server info
  serverUrl: string | null;
  currentRoute: string;

  // Actions
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setConnectionError: (error: string | null) => void;
  setServerUrl: (url: string) => void;
  setCurrentRoute: (route: string) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;

  // Computed
  canReconnect: () => boolean;
  shouldShowOfflineWarning: () => boolean;
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      // Initial state
      isConnected: false,
      isConnecting: false,
      lastConnected: null,
      connectionError: null,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
      serverUrl: null,
      currentRoute: '/',

      // Actions
      setConnected: (connected) => {
        set({
          isConnected: connected,
          isConnecting: false,
          lastConnected: connected ? new Date() : get().lastConnected,
          connectionError: connected ? null : get().connectionError,
        });

        if (connected) {
          get().resetReconnectAttempts();
        }
      },

      setConnecting: (connecting) => {
        set({ isConnecting: connecting });
      },

      setConnectionError: (error) => {
        set({
          connectionError: error,
          isConnecting: false,
          isConnected: false,
        });
      },

      setServerUrl: (url) => {
        set({ serverUrl: url });
      },

      setCurrentRoute: (route) => {
        set({ currentRoute: route });
      },

      incrementReconnectAttempts: () => {
        set((state) => ({
          reconnectAttempts: state.reconnectAttempts + 1,
        }));
      },

      resetReconnectAttempts: () => {
        set({ reconnectAttempts: 0 });
      },

      // Computed
      canReconnect: () => {
        const { reconnectAttempts, maxReconnectAttempts } = get();
        return reconnectAttempts < maxReconnectAttempts;
      },

      shouldShowOfflineWarning: () => {
        const { isConnected, lastConnected } = get();
        if (isConnected) return false;

        if (!lastConnected) return true;

        // Show warning if offline for more than 30 seconds
        const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
        return lastConnected < thirtySecondsAgo;
      },
    }),
    {
      name: 'connection-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lastConnected: state.lastConnected,
        serverUrl: state.serverUrl,
        reconnectAttempts: state.reconnectAttempts,
      }),
    }
  )
);

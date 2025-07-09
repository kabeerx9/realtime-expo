import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { socketConnectionEvents } from '~/services/socketService';

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean; // Keep for UI feedback before first connect
  lastConnected: Date | null;
  connectionError: string | null;

  // We are removing most actions, as the socket service will now drive state changes.
  // We'll keep one for the UI to trigger the initial connection process.
  setConnecting: (isConnecting: boolean) => void;
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      // Initial state
      isConnected: false,
      isConnecting: false,
      lastConnected: null,
      connectionError: null,

      setConnecting: (isConnecting) => set({ isConnecting }),
    }),
    {
      name: 'connection-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lastConnected: state.lastConnected,
      }),
    }
  )
);

// --- Event Listener Initialization ---

/**
 * Subscribes to core socket connection events and updates the connection store.
 * This should be called once on app startup.
 * @returns A cleanup function to unsubscribe from all listeners.
 */
export const initConnectionListeners = () => {
  const onConnect = () => {
    useConnectionStore.setState({
      isConnected: true,
      isConnecting: false,
      connectionError: null,
      lastConnected: new Date(),
    });
  };

  const onDisconnect = () => {
    useConnectionStore.setState({
      isConnected: false,
      isConnecting: false,
      // We could set a generic error here if we want
      // connectionError: 'Disconnected',
    });
  };

  const onConnectError = (err: Error) => {
    useConnectionStore.setState({
      isConnected: false,
      isConnecting: false,
      connectionError: err.message,
    });
  };

  // Subscribe to the events
  socketConnectionEvents.onConnect(onConnect);
  socketConnectionEvents.onDisconnect(onDisconnect);
  socketConnectionEvents.onConnectError(onConnectError);

  // The socket.io client handles automatic reconnection, so we don't need
  // to manage reconnect attempts in the store anymore. The 'connect_error'
  // event will fire on failed attempts.

  // Return a cleanup function
  return () => {
    // Note: socket.io's `off` method without a specific listener function
    // removes all listeners for that event, which is what we want on root cleanup.
    socketConnectionEvents.onConnect(() => {});
    socketConnectionEvents.onDisconnect(() => {});
    socketConnectionEvents.onConnectError(() => {});
  };
};

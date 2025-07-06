import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useConnectionStore } from '../store/connectionStore';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import websocketService from '../services/websocketService';

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  serverUrl?: string;
  reconnectOnMount?: boolean;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  reconnectAttempts: number;
  canReconnect: boolean;
  connect: (url?: string) => void;
  disconnect: () => void;
  forceReconnect: () => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const {
    autoConnect = true,
    serverUrl = 'http://192.168.186.73:3000/',
    reconnectOnMount = true,
  } = options;

  const router = useRouter();
  const mountedRef = useRef(true);

  // Store subscriptions
  const {
    isConnected,
    isConnecting,
    connectionError,
    reconnectAttempts,
    canReconnect: canReconnectStore,
    setCurrentRoute,
  } = useConnectionStore();

  const { setCurrentRoute: setNotificationRoute } = useNotificationStore();
  const { isAuthenticated, user } = useAuthStore();

  // Connect function
  const connect = useCallback(
    (url?: string) => {
      if (!isAuthenticated || !user) {
        console.warn('Cannot connect: User not authenticated');
        return;
      }

      const targetUrl = url || serverUrl;
      console.log('Connecting to WebSocket:', targetUrl);
      websocketService.connect(targetUrl);
    },
    [isAuthenticated, user, serverUrl]
  );

  // Disconnect function
  const disconnect = useCallback(() => {
    console.log('Disconnecting WebSocket');
    websocketService.disconnect();
  }, []);

  // Force reconnect function
  const forceReconnect = useCallback(() => {
    console.log('Force reconnecting WebSocket');
    disconnect();
    setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, 1000);
  }, [connect, disconnect]);

  // Handle toast navigation
  useEffect(() => {
    const unsubscribe = websocketService.onReconnect(() => {
      if (mountedRef.current) {
        router.push('/lobby');
      }
    });

    return unsubscribe;
  }, [router]);

  // Auto-connect on auth change
  useEffect(() => {
    if (isAuthenticated && user && autoConnect && !isConnected && !isConnecting) {
      connect();
    } else if (!isAuthenticated && isConnected) {
      disconnect();
    }
  }, [isAuthenticated, user, autoConnect, isConnected, isConnecting, connect, disconnect]);

  // Handle reconnection on mount
  useEffect(() => {
    if (reconnectOnMount && isAuthenticated && user && !isConnected && !isConnecting) {
      // Check if we should attempt reconnection
      if (canReconnectStore()) {
        connect();
      }
    }
  }, [
    reconnectOnMount,
    isAuthenticated,
    user,
    isConnected,
    isConnecting,
    canReconnectStore,
    connect,
  ]);

  // Route tracking
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    connectionError,
    reconnectAttempts,
    canReconnect: canReconnectStore(),
    connect,
    disconnect,
    forceReconnect,
  };
};

// Specialized hook for route tracking
export const useWebSocketRouteTracking = () => {
  const { setCurrentRoute } = useConnectionStore();
  const { setCurrentRoute: setNotificationRoute } = useNotificationStore();

  const setRoute = useCallback(
    (route: string) => {
      setCurrentRoute(route);
      setNotificationRoute(route);
    },
    [setCurrentRoute, setNotificationRoute]
  );

  return { setRoute };
};

import { KeyboardProvider } from 'react-native-keyboard-controller';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../global.css';
import Toast from 'react-native-toast-message';
import { useEffect } from 'react';
import { usePathname, Stack, useRouter, useSegments } from 'expo-router';
import { useNotificationStore } from '../store/notificationStore';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '~/store/authStore';
import { connectSocket, disconnectSocket } from '~/services/socketService';
import { initConnectionListeners } from '~/store/connectionStore';
import { initChatListeners } from '~/store/chatStore';
import { useChatNotifications } from '~/hooks/useChatNotifications';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

/**
 * A component to manage the socket connection and listeners based on auth state.
 */
function SocketManager() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      console.log('User is authenticated, connecting socket...');
      // Connect and initialize listeners
      connectSocket();
      const cleanupConnection = initConnectionListeners();
      const cleanupChat = initChatListeners();
      // const cleanupGame = initGameListeners(); // etc.

      return () => {
        console.log('User logged out, disconnecting socket...');
        // Disconnect and clean up all listeners
        cleanupConnection();
        cleanupChat();
        // cleanupGame();
        disconnectSocket();
      };
    }
  }, [isAuthenticated]);

  return null;
}

/**
 * A component to manage all real-time notification listeners.
 */
function NotificationManager() {
  useChatNotifications();
  // In the future, you could add more notification hooks here
  // useGameNotifications();
  return null;
}

/**
 * A component to handle route-aware logic, like notifications
 * and protecting routes based on authentication state.
 */
function RouteManager() {
  const { isAuthenticated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const pathname = usePathname();
  const { setCurrentRoute } = useNotificationStore();

  useEffect(() => {
    // Set the current route for the notification store
    setCurrentRoute(pathname);

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      //   router.replace('/login');
      console.log('User is not authenticated, redirecting to login');
    } else if (isAuthenticated && inAuthGroup) {
      //   router.replace('/lobby');
      console.log('User is authenticated, redirecting to lobby');
    }
  }, [isAuthenticated, segments, router, pathname, setCurrentRoute]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <KeyboardProvider>
          <SocketManager />
          <NotificationManager />
          <RouteManager />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: '#ffffff',
              },
              headerTitleStyle: {
                fontSize: 18,
                fontWeight: '600',
              },
              headerShadowVisible: false,
            }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="index" options={{ headerTitle: 'Welcome' }} />
            <Stack.Screen name="details" />
            <Stack.Screen name="todos" />
            <Stack.Screen name="lobby" />
          </Stack>
          <Toast />
        </KeyboardProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

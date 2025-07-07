import { KeyboardProvider } from 'react-native-keyboard-controller';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../global.css';
import Toast from 'react-native-toast-message';
import { useEffect } from 'react';
import { usePathname, Stack } from 'expo-router';
import { useNotificationStore } from '../store/notificationStore';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function RouteTracker() {
  const pathname = usePathname();
  const { setCurrentRoute } = useNotificationStore();

  useEffect(() => {
    setCurrentRoute(pathname);
  }, [pathname, setCurrentRoute]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView>
      <QueryClientProvider client={queryClient}>
        <KeyboardProvider>
          <RouteTracker />
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

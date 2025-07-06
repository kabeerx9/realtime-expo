import { KeyboardProvider } from 'react-native-keyboard-controller';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../global.css';
import Toast from 'react-native-toast-message';
import { useEffect } from 'react';
import { usePathname, Stack } from 'expo-router';
import { useNotificationStore } from '../store/notificationStore';

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
    <QueryClientProvider client={queryClient}>
      <KeyboardProvider>
        <RouteTracker />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="index" />
          <Stack.Screen name="details" />
          <Stack.Screen name="todos" />
          <Stack.Screen name="lobby" />
        </Stack>
        <Toast />
      </KeyboardProvider>
    </QueryClientProvider>
  );
}

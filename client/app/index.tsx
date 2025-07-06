import { Stack, Link, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { useWebSocket } from '../hooks/useWebSocket';
import { useUnreadCounts, useToast } from '../hooks/useNotifications';

import { Button } from '~/components/Button';

export default function Home() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  // Use the new hooks
  const { isConnected, isConnecting, disconnect } = useWebSocket({
    autoConnect: true,
    serverUrl: 'http://192.168.186.73:3000/',
  });
  const { totalUnreadCount } = useUnreadCounts();
  const { showToast } = useToast();

  const handleLogout = async () => {
    try {
      disconnect();
      await authService.signOut();
      showToast('success', 'Logged out successfully');
    } catch (error) {
      showToast('error', 'Logout failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <View className="flex-1 items-center justify-center space-y-4">
          <Text className="mb-8 text-2xl font-bold">Welcome!</Text>

          <Link href="/(auth)/login" asChild>
            <Button title="Login" />
          </Link>

          <Link href="/(auth)/signup" asChild>
            <Button title="Sign Up" />
          </Link>
        </View>
      </>
    );
  }

  return (
    <>
      <View className="flex-1 items-center justify-center space-y-4">
        <Text className="mb-4 text-2xl font-bold">Hello, {user?.firstName}!</Text>
        <Text className="mb-8 text-gray-600">Welcome to your dashboard</Text>

        {/* Connection Status */}
        <View className="mb-4 flex-row items-center">
          <View
            className={`mr-2 h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500' : 'bg-red-500'}`}
          />
          <Text
            className={`text-sm ${isConnected ? 'text-green-600' : isConnecting ? 'text-yellow-600' : 'text-red-600'}`}>
            {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
          </Text>
        </View>

        <Link href="/todos" asChild>
          <Button title="My Todos" />
        </Link>

        <TouchableOpacity
          onPress={() => router.push('/lobby')}
          className="relative items-center rounded-[28px] bg-indigo-500 p-4 shadow-md">
          <Text className="text-center text-lg font-semibold text-white">Join Lobby</Text>
          {totalUnreadCount > 0 && (
            <View className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-red-500">
              <Text className="text-xs font-bold text-white">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <Link href={{ pathname: '/details', params: { name: user?.firstName || 'User' } }} asChild>
          <Button title="Show Details" />
        </Link>

        <TouchableOpacity className="mt-4 rounded-lg bg-red-500 px-6 py-3" onPress={handleLogout}>
          <Text className="font-semibold text-white">Logout</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

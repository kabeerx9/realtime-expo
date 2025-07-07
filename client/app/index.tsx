import { Stack, Link, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { useWebSocket } from '../hooks/useWebSocket';
import { useUnreadCounts, useToast } from '../hooks/useNotifications';
import Rooms from '~/components/rooms/Rooms';

export default function Home() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  // Use the new hooks
  const { isConnected, isConnecting, disconnect } = useWebSocket({
    autoConnect: true,
    // serverUrl: 'http://192.168.186.73:3000/',
    serverUrl: 'http://localhost:3000/',
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
      <View className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-full max-w-sm">
            {/* Welcome Header */}
            <View className="mb-12 items-center">
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-indigo-600">
                <Text className="text-3xl">👋</Text>
              </View>
              <Text className="text-3xl font-bold text-gray-800">Welcome!</Text>
              <Text className="mt-2 text-center text-gray-600">
                Get started by signing in or creating an account
              </Text>
            </View>

            {/* Auth Buttons */}
            <View className="space-y-4">
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity className="w-full rounded-2xl bg-indigo-600 py-4 shadow-lg">
                  <Text className="text-center text-lg font-semibold text-white">Sign In</Text>
                </TouchableOpacity>
              </Link>

              <Link href="/(auth)/signup" asChild>
                <TouchableOpacity className="w-full rounded-2xl border-2 border-indigo-600 bg-white py-4">
                  <Text className="text-center text-lg font-semibold text-indigo-600">
                    Create Account
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="flex flex-col gap-4 px-6 pt-12">
        {/* Header Section */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-800">Hello, {user?.firstName}! 👋</Text>
              <Text className="mt-1 text-gray-600">Welcome back to your dashboard</Text>
            </View>

            {/* Connection Status */}
            <View className="rounded-full bg-white px-4 py-2 shadow-sm">
              <View className="flex-row items-center">
                <View
                  className={`mr-2 h-2 w-2 rounded-full ${
                    isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                />
                <Text
                  className={`text-sm font-medium ${
                    isConnected
                      ? 'text-green-600'
                      : isConnecting
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}>
                  {isConnected ? 'Online' : isConnecting ? 'Connecting' : 'Offline'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Main Actions Grid */}
        <View className="mb-8 space-y-4">
          {/* Todos Card */}
          <Link href="/todos" asChild>
            <TouchableOpacity className="rounded-2xl bg-white p-6 shadow-sm">
              <View className="flex-row items-center">
                <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  <Text className="text-2xl">📝</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-800">My Todos</Text>
                  <Text className="text-gray-600">Manage your tasks and stay organized</Text>
                </View>
                <Text className="text-2xl text-gray-400">›</Text>
              </View>
            </TouchableOpacity>
          </Link>

          {/* Lobby Card */}
          <TouchableOpacity
            onPress={() => router.push('/lobby')}
            className="relative rounded-2xl bg-white p-6 text-black shadow-lg">
            <View className="flex-row items-center">
              <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                <Text className="text-2xl">🎮</Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-black">Join Lobby</Text>
                <Text className="text-black/80">Connect with others in real-time</Text>
              </View>
              <Text className="text-2xl text-black/80">›</Text>
            </View>
            {totalUnreadCount > 0 && (
              <View className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-red-500 shadow-md">
                <Text className="text-xs font-bold text-white">
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Details Card */}
          <Link
            href={{ pathname: '/details', params: { name: user?.firstName || 'User' } }}
            asChild>
            <TouchableOpacity className="rounded-2xl bg-white p-6 shadow-sm">
              <View className="flex-row items-center">
                <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <Text className="text-2xl">ℹ️</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-800">Profile Details</Text>
                  <Text className="text-gray-600">View your account information</Text>
                </View>
                <Text className="text-2xl text-gray-400">›</Text>
              </View>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Logout Section */}
        <View className="mb-8">
          <TouchableOpacity
            className="rounded-2xl border border-red-200 bg-red-50 p-4"
            onPress={handleLogout}>
            <Text className="text-center text-lg font-semibold text-red-600">Sign Out</Text>
          </TouchableOpacity>
        </View>
        <Rooms />
      </View>
    </ScrollView>
  );
}

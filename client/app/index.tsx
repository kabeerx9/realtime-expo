import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useNotificationStore } from '~/store/notificationStore';

export default function Index() {
  const router = useRouter();
  const unreadChatCount = useNotificationStore((state) => state.unreadChatCount);

  return (
    <View className="flex-1 items-center justify-center bg-white p-4">
      <Text className="mb-8 text-3xl font-bold text-gray-800">Welcome Home</Text>

      <TouchableOpacity
        onPress={() => router.push('/lobby')}
        className="relative mb-4 w-full rounded-lg bg-blue-500 p-4 shadow-md">
        <Text className="text-center text-xl font-semibold text-white">Go to Lobby</Text>
        {unreadChatCount > 0 && (
          <View className="absolute -right-2 -top-2 h-7 w-7 items-center justify-center rounded-full bg-red-500 shadow-lg">
            <Text className="text-sm font-bold text-white">{unreadChatCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/todos')}
        className="w-full rounded-lg bg-gray-200 p-4">
        <Text className="text-center text-xl font-semibold text-gray-700">View Todos</Text>
      </TouchableOpacity>
    </View>
  );
}

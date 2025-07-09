import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useNotificationStore } from '~/store/notificationStore';
import { useGame } from '~/hooks/game/useGame';

const GameButton = () => {
  const router = useRouter();
  const { status, myScore, opponentScore, winnerId, myId } = useGame();

  const navigateToGame = () => router.push('/game');

  console.log('status', status);

  switch (status) {
    case 'waiting':
      return (
        <TouchableOpacity
          onPress={navigateToGame}
          className="mt-5 w-full rounded-lg border border-blue-400 bg-blue-100 p-4">
          <Text className="text-center text-xl font-semibold text-blue-800">
            Waiting for Opponent...
          </Text>
          <Text className="text-center text-sm text-blue-700">Click to enter the room</Text>
        </TouchableOpacity>
      );

    case 'active':
      return (
        <TouchableOpacity
          onPress={navigateToGame}
          className="mt-5 w-full rounded-lg border border-yellow-400 bg-yellow-100 p-4">
          <Text className="text-center text-xl font-semibold text-yellow-800">
            Game in Progress!
          </Text>
          <Text className="text-center text-base font-medium text-yellow-700">
            You: {myScore} | Opponent: {opponentScore}
          </Text>
        </TouchableOpacity>
      );

    case 'finished':
      const youWon = winnerId === myId;
      return (
        <TouchableOpacity
          onPress={navigateToGame}
          className={`mt-5 w-full rounded-lg p-4 ${
            youWon ? 'border border-green-400 bg-green-100' : 'border border-red-400 bg-red-100'
          }`}>
          <Text className="text-center text-xl font-semibold text-gray-800">Game Finished!</Text>
          <Text
            className={`text-center text-base font-medium ${
              youWon ? 'text-green-800' : 'text-red-800'
            }`}>
            {youWon ? 'You Won!' : 'You Lost'} (Final: {myScore} - {opponentScore})
          </Text>
        </TouchableOpacity>
      );

    default: // 'idle'
      return (
        <TouchableOpacity
          onPress={navigateToGame}
          className="mt-5 w-full rounded-lg bg-green-500 p-4 shadow-md">
          <Text className="text-center text-xl font-semibold text-white">Play Game</Text>
        </TouchableOpacity>
      );
  }
};

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

      <GameButton />
    </View>
  );
}

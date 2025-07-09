import { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGame } from '~/hooks/game/useGame';
import { initGameListeners, useGameStore } from '~/store/game/gameStore';

// Helper component for displaying a team
const TeamDisplay = ({
  title,
  players,
}: {
  title: string;
  players: { id: string; name: string; position: string }[];
}) => (
  <View className="flex-1 items-center rounded-lg border border-gray-200 bg-gray-50 p-2">
    <Text className="text-lg font-bold text-gray-700">{title}</Text>
    {players.map((player) => (
      <Text key={player.id} className="text-gray-600">
        {player.name} ({player.position})
      </Text>
    ))}
  </View>
);

const Game = () => {
  const {
    status,
    myPlayers,
    findGame,
    opponentPlayers,
    myScore,
    opponentScore,
    events,
    winnerId,
    myId,
  } = useGame();

  const resetGame = useGameStore((state) => state._reset);

  useEffect(() => {
    // Find a game immediately on mount
    findGame();

    // Set up listeners and cleanup on unmount
    const cleanupListeners = initGameListeners();
    return () => {
      cleanupListeners();
      resetGame(); // Reset store on unmount
    };
  }, [findGame, resetGame]);

  const handlePlayAgain = () => {
    resetGame();
    findGame();
  };

  // --- RENDER LOGIC ---

  if (status === 'idle' || status === 'waiting') {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-100">
        <Text className="text-2xl font-bold text-gray-700">Searching for Opponent...</Text>
        <Text className="mt-2 text-gray-500">This shouldn&apos;t take long!</Text>
      </SafeAreaView>
    );
  }

  if (status === 'finished') {
    const youWon = winnerId === myId;
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-800">
        <Text className={`text-5xl font-bold ${youWon ? 'text-green-400' : 'text-red-400'}`}>
          {youWon ? 'You Won!' : 'You Lost'}
        </Text>
        <Text className="mt-4 text-xl text-white">Final Score</Text>
        <Text className="text-lg text-gray-300">
          You: {myScore} - Opponent: {opponentScore}
        </Text>
        <TouchableOpacity
          onPress={handlePlayAgain}
          className="mt-8 rounded-lg bg-indigo-600 px-8 py-3">
          <Text className="text-xl font-bold text-white">Play Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- Active Game Screen ---
  return (
    <SafeAreaView className="flex-1 bg-white p-4">
      {/* Header with scores */}
      <View className="mb-4 flex-row items-center justify-around rounded-lg bg-gray-800 p-4">
        <Text className="text-2xl font-bold text-green-400">You: {myScore}</Text>
        <Text className="text-2xl font-bold text-red-400">Opponent: {opponentScore}</Text>
      </View>

      {/* Team Displays */}
      <View className="mb-4 flex-row space-x-4">
        <TeamDisplay title="Your Team" players={myPlayers} />
        <TeamDisplay title="Opponent's Team" players={opponentPlayers} />
      </View>

      {/* Event Log */}
      <View className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-2">
        <Text className="mb-2 text-center text-lg font-bold text-gray-700">Game Log</Text>
        <ScrollView contentContainerClassName="p-2">
          {events.length > 0 ? (
            [...events].reverse().map((event) => (
              <Text key={event.id} className="mb-1 text-sm text-gray-600">
                - {event.playerName} {event.action} ({event.pointsChange > 0 ? '+' : ''}
                {event.pointsChange})
              </Text>
            ))
          ) : (
            <Text className="text-center text-gray-500">Game is starting...</Text>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Game;

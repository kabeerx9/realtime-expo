import { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';

import { useGame } from '~/hooks/game/useGame';
import { useGameStore } from '~/store/game/gameStore';

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
  const navigation = useNavigation();
  const {
    leaveGame,
    syncGameState,
    findGame: findGameAction,
  } = useGameStore((state) => ({
    leaveGame: state.leaveGame,
    syncGameState: state.syncGameState,
    findGame: state.findGame,
  }));

  useEffect(() => {
    // When we enter the screen, decide whether to sync or find a new game.
    if (status === 'idle') {
      // If we're not in a game, find one.
      findGameAction();
    } else {
      // Otherwise, we're already in a game, just sync its state.
      syncGameState();
    }
  }, [syncGameState, findGameAction, status]);

  const handlePlayAgain = () => {
    // leaveGame also resets the store
    leaveGame();
    findGameAction();
  };

  const handleLeaveGame = () => {
    leaveGame();
    navigation.goBack();
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
    let resultText = 'It&apos;s a Draw!';
    let resultColor = 'text-yellow-400';
    if (winnerId) {
      if (winnerId === myId) {
        resultText = 'You Won!';
        resultColor = 'text-green-400';
      } else {
        resultText = 'You Lost';
        resultColor = 'text-red-400';
      }
    }

    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-800">
        <Text className={`text-5xl font-bold ${resultColor}`}>{resultText}</Text>
        <Text className="mt-4 text-xl text-white">Final Score</Text>
        <Text className="text-lg text-gray-300">
          You: {myScore} - Opponent: {opponentScore}
        </Text>
        <TouchableOpacity
          onPress={handlePlayAgain}
          className="mt-8 rounded-lg bg-indigo-600 px-8 py-3">
          <Text className="text-xl font-bold text-white">Play Again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLeaveGame} className="mt-4">
          <Text className="text-gray-400">Exit to Menu</Text>
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

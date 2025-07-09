import { useCallback } from 'react';
import { useGameStore } from '~/store/game/gameStore';
import { useConnectionStore } from '~/store/connectionStore';

export const useGame = () => {
  const { status, myPlayers, findGame, opponentPlayers, myScore, opponentScore, events, winnerId } =
    useGameStore();
  const myId = useConnectionStore((state) => state.socketId);

  return {
    status,
    myPlayers,
    findGame,
    opponentPlayers,
    myScore,
    opponentScore,
    events,
    winnerId,
    myId,
  };
};

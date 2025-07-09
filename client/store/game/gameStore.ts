import { create } from 'zustand';

import { emitSocketEvent, subscribeToSocketEvent } from '~/services/socketService';
import { useConnectionStore } from '../connectionStore';

interface Player {
  id: string;
  name: string;
  position: string;
  baseSkill: number;
}
interface GameEvent {
  id: string;
  playerId: string;
  playerName: string;
  action: string;
  pointsChange: number;
  timestamp: Date;
}

type GameStatus = 'idle' | 'waiting' | 'active' | 'finished';

interface GameState {
  status: GameStatus;
  myPlayers: Player[];
  opponentPlayers: Player[];
  myScore: number;
  opponentScore: number;
  events: GameEvent[];
  winnerId: string | null;

  // actions
  findGame: () => void;
  // Internal setters called by listeners
  _handleRoomCreated: (data: { roomId: string; players: Player[] }) => void;
  _handleRoomJoined: (data: { roomId: string; players: Player[] }) => void;
  _handleGameStarting: (data: {
    roomId: string;
    scores: { [socketId: string]: number };
    playerAssignments: { [socketId: string]: Player[] };
  }) => void;
  _handleGameEvent: (data: {
    event: GameEvent;
    currentScore: number;
    opponentScore: number;
    allScores: { [socketId: string]: number };
    gameEnded: boolean;
    isMyPlayer: boolean;
  }) => void;
  _handleGameEnded: (data: {
    message: string;
    finalScores: { [socketId: string]: number };
    winnerId?: string;
  }) => void;
  _reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // intitial state
  status: 'idle',
  myPlayers: [],
  opponentPlayers: [],
  myScore: 0,
  opponentScore: 0,
  events: [],
  winnerId: null,

  // actions

  findGame: () => {
    emitSocketEvent('find_or_create_room');
  },
  _handleRoomCreated: (data) => {
    set({ status: 'waiting', myPlayers: data.players });
  },
  _handleRoomJoined: (data) => {
    // This is the same as creating a room from the user's perspective.
    // They have joined and are now waiting for the game to start.
    set({ status: 'waiting', myPlayers: data.players });
  },
  _handleGameStarting: (data) => {
    const mySocketId = useConnectionStore.getState().socketId;
    if (!mySocketId) return; // Can't process if we don't know who we are

    const opponentSocketId = Object.keys(data.playerAssignments).find((id) => id !== mySocketId);

    set({
      status: 'active',
      myPlayers: data.playerAssignments[mySocketId] || [],
      opponentPlayers: opponentSocketId ? data.playerAssignments[opponentSocketId] : [],
      myScore: data.scores[mySocketId] || 0,
      opponentScore: opponentSocketId ? data.scores[opponentSocketId] : 0,
    });
  },
  _handleGameEvent: (data) => {
    // The server now sends scores relative to the player, so we just update.
    set((state) => ({
      events: [...state.events, data.event],
      myScore: data.currentScore,
      opponentScore: data.opponentScore,
    }));
  },
  _handleGameEnded: (data) => {
    set({
      status: 'finished',
      winnerId: data.winnerId,
    });
  },
  _reset: () => {
    set({
      status: 'idle',
      myPlayers: [],
      opponentPlayers: [],
      myScore: 0,
      opponentScore: 0,
      events: [],
      winnerId: null,
    });
  },
}));

export const initGameListeners = () => {
  const unsubscribeRoomCreated = subscribeToSocketEvent('room_created', (data) => {
    useGameStore.getState()._handleRoomCreated(data);
  });
  const unsubscribeRoomJoined = subscribeToSocketEvent('room_joined', (data) => {
    useGameStore.getState()._handleRoomJoined(data);
  });
  const unsubscribeGameStarting = subscribeToSocketEvent('game_starting', (data) => {
    useGameStore.getState()._handleGameStarting(data);
  });
  const unsubscribeGameEvent = subscribeToSocketEvent('game_event', (data) => {
    useGameStore.getState()._handleGameEvent(data);
  });
  const unsubscribeGameEnded = subscribeToSocketEvent('game_ended', (data) => {
    useGameStore.getState()._handleGameEnded(data);
  });

  return () => {
    unsubscribeRoomCreated();
    unsubscribeRoomJoined();
    unsubscribeGameStarting();
    unsubscribeGameEvent();
    unsubscribeGameEnded();
  };
};

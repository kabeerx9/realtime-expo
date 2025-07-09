import { io, Socket } from 'socket.io-client';
import { env } from '~/config/env';
import { useAuthStore } from '~/store/authStore';

// Game Events types
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

// --------------------------------------------------------------------------------
// 1. EVENT TYPES
// Define all client-server events here for full-stack type safety.
// These should ideally be shared with the server codebase.
// --------------------------------------------------------------------------------

export interface ServerToClientEvents {
  message: (data: { id: string; user: string; text: string; timestamp: string }) => void;
  chat_history: (
    data: Array<{ id: string; user: string; text: string; timestamp: string }>
  ) => void;

  // ---------- Game Events ---------- //

  room_created: (data: { roomId: string; players: Player[] }) => void;
  room_joined: (data: { roomId: string; players: Player[] }) => void;
  game_starting: (data: {
    roomId: string;
    scores: { [socketId: string]: number };
    playerAssignments: { [socketId: string]: Player[] };
  }) => void;

  game_event: (data: {
    event: GameEvent;
    currentScore: number;
    opponentScore: number;
    allScores: { [socketId: string]: number };
    gameEnded: boolean;
    isMyPlayer: boolean;
  }) => void;

  game_ended: (data: {
    message: string;
    finalScores: { [socketId: string]: number };
    winnerId?: string;
  }) => void;

  room_status: (data: any) => void; // Using 'any' for now, will be properly typed in the store
}

export interface ClientToServerEvents {
  message: (data: { text: string; user: string }) => void;

  // ---------- Game Events ---------- //

  find_or_create_room: () => void;
  leave_room: () => void;
  get_room_status: () => void;
}

// --------------------------------------------------------------------------------
// 2. SOCKET INSTANCE
// Create the single, reusable socket instance.
// --------------------------------------------------------------------------------

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(env.API_URL, {
  autoConnect: false,
  // This is important for auth
  // It attaches the auth token from the store to each connection attempt
  auth: (cb) => {
    const token = useAuthStore.getState().accessToken;
    cb({ token });
  },
});

// --------------------------------------------------------------------------------
// 3. PUBLIC API
// Expose a clean, easy-to-use API for the rest of the application.
// --------------------------------------------------------------------------------

/**
 * Connects the socket to the server.
 */
export const connectSocket = () => {
  if (socket.connected) return;
  socket.connect();
};

/**
 * Disconnects the socket from the server.
 */
export const disconnectSocket = () => {
  if (socket.disconnected) return;
  socket.disconnect();
};

/**
 * Emits a typed event to the server.
 * @param event The name of the event.
 * @param payload The data to send.
 */
export const emitSocketEvent = <Event extends keyof ClientToServerEvents>(
  event: Event,
  ...args: Parameters<ClientToServerEvents[Event]>
) => {
  socket.emit(event, ...args);
};

/**
 * Subscribes to a typed event from the server.
 * Returns an `unsubscribe` function for cleanup.
 * @param event The name of the event to listen for.
 * @param callback The function to run when the event is received.
 */
export const subscribeToSocketEvent = <Event extends keyof ServerToClientEvents>(
  event: Event,
  callback: ServerToClientEvents[Event]
) => {
  socket.on(event, callback as any); // Using 'as any' as a temporary workaround for complex Emitter types
  // Return a function to clean up the event listener
  return () => socket.off(event, callback as any); // Using 'as any' as a temporary workaround for complex Emitter types
};

/**
 * Provides a way for stores to react to core connection events
 * without needing to subscribe to every specific event.
 */
export const socketConnectionEvents = {
  onConnect: (callback: () => void) => socket.on('connect', callback),
  onDisconnect: (callback: () => void) => socket.on('disconnect', callback),
  onConnectError: (callback: (err: Error) => void) => socket.on('connect_error', callback),
  getSocketId: () => socket.id,
};

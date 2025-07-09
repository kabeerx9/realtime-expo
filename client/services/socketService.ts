import { io, Socket } from 'socket.io-client';
import { env } from '~/config/env';
import { useAuthStore } from '~/store/authStore';

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
  // Example of another event
  // user_typing: (data: { user: string }) => void;
}

export interface ClientToServerEvents {
  message: (data: { text: string; user: string }) => void;
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
};

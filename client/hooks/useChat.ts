import { useCallback } from 'react';
import { useChatStore, Message } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { useConnectionStore } from '../store/connectionStore';

/**
 * This hook provides a clean interface for UI components to interact with the chat system.
 * It acts as a Facade, selecting state and actions from the underlying stores.
 */
export const useChat = () => {
  // 1. Select state from stores
  const messages = useChatStore((state) => state.messages);
  const sendMessageAction = useChatStore((state) => state.sendMessage);

  const isConnected = useConnectionStore((state) => state.isConnected);
  const currentUser = useAuthStore((state) => state.user);

  // 2. Define business logic and actions for the UI
  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || !isConnected) {
        // In a real app, you might set an error state here
        return;
      }
      sendMessageAction(text);
    },
    [isConnected, sendMessageAction]
  );

  const isMyMessage = useCallback(
    (message: Message) => {
      // The server is the source of truth for the user,
      // so we compare against the user info in the message payload.
      // We check against the authenticated user in our auth store.
      return message.user === currentUser?.firstName;
    },
    [currentUser]
  );

  // 3. Return the public API for the component
  return {
    messages,
    isConnected,
    sendMessage,
    isMyMessage,
  };
};

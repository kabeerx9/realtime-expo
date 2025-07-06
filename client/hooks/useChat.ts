import { useCallback } from 'react';
import { useChatStore, Message } from '../store/chatStore';
import { useConnectionStore } from '../store/connectionStore';
import { useAuthStore } from '../store/authStore';
import websocketService from '../services/websocketService';

export interface UseChatOptions {
  maxMessageLength?: number;
}

export interface UseChatReturn {
  // Messages
  messages: Message[];

  // Loading states
  isLoadingHistory: boolean;
  hasMoreHistory: boolean;

  // Error state
  chatError: string | null;

  // Connection state
  isConnected: boolean;

  // Typing indicators
  typingUsers: string[];

  // Actions
  sendMessage: (text: string) => void;
  clearError: () => void;
  loadMoreHistory: () => void;
  startTyping: () => void;
  stopTyping: () => void;

  // Utilities
  isMyMessage: (message: Message) => boolean;
  getMessagesByUser: (user: string) => Message[];
  getRecentMessages: (count: number) => Message[];
  canSendMessage: (text: string) => boolean;
  getMessageCount: () => number;
}

export const useChat = (options: UseChatOptions = {}): UseChatReturn => {
  const { maxMessageLength = 500 } = options;

  // Store subscriptions
  const {
    messages,
    isLoadingHistory,
    hasMoreHistory,
    chatError,
    typingUsers,
    setChatError,
    getMessagesByUser,
    getRecentMessages,
    getTotalMessageCount,
    setLoadingHistory,
  } = useChatStore();

  const { isConnected } = useConnectionStore();
  const { user } = useAuthStore();

  // Validate if message can be sent
  const canSendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) {
        return false;
      }

      if (text.length > maxMessageLength) {
        setChatError(`Message too long. Maximum ${maxMessageLength} characters allowed.`);
        return false;
      }

      if (!isConnected) {
        setChatError('Not connected to chat server');
        return false;
      }

      return true;
    },
    [maxMessageLength, isConnected, setChatError]
  );

  // Send message function
  const sendMessage = useCallback(
    (text: string) => {
      if (!canSendMessage(text)) {
        return;
      }

      if (!user) {
        setChatError('User not authenticated');
        return;
      }

      const messageData = {
        text: text.trim(),
        user: user.firstName,
      };

      websocketService.sendMessage(messageData);
    },
    [user, setChatError, canSendMessage]
  );

  // Clear error function
  const clearError = useCallback(() => {
    setChatError(null);
  }, [setChatError]);

  // Load more history function
  const loadMoreHistory = useCallback(() => {
    if (isLoadingHistory || !hasMoreHistory) {
      return;
    }

    setLoadingHistory(true);

    // Simulate loading history - in real app, this would be an API call
    setTimeout(() => {
      setLoadingHistory(false);
      // For now, just indicate no more history
      useChatStore.getState().setHasMoreHistory(false);
    }, 1000);
  }, [isLoadingHistory, hasMoreHistory, setLoadingHistory]);

  // Check if message is from current user
  const isMyMessage = useCallback(
    (message: Message) => {
      return message.user === user?.firstName;
    },
    [user]
  );

  // Get message count
  const getMessageCount = useCallback(() => {
    return getTotalMessageCount();
  }, [getTotalMessageCount]);

  // Typing functions
  const startTyping = useCallback(() => {
    if (!user) return;
    websocketService.sendTyping(user.firstName);
  }, [user]);

  const stopTyping = useCallback(() => {
    if (!user) return;
    websocketService.sendStoppedTyping(user.firstName);
  }, [user]);

  return {
    // Messages
    messages,

    // Loading states
    isLoadingHistory,
    hasMoreHistory,

    // Error state
    chatError,

    // Connection state
    isConnected,

    // Typing indicators
    typingUsers,

    // Actions
    sendMessage,
    clearError,
    loadMoreHistory,
    startTyping,
    stopTyping,

    // Utilities
    isMyMessage,
    getMessagesByUser,
    getRecentMessages,
    canSendMessage,
    getMessageCount,
  };
};

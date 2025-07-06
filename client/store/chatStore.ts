import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Message {
  id: string;
  text: string;
  user: string;
  timestamp: Date;
}

export interface ChatState {
  // Messages
  messages: Message[];

  // Chat settings
  maxMessages: number;
  maxMessageLength: number;

  // Loading states
  isLoadingHistory: boolean;
  hasMoreHistory: boolean;

  // Error state
  chatError: string | null;

  // Typing indicators
  typingUsers: string[];

  // Actions
  addMessage: (message: Message) => void;

  // Chat history
  setChatHistory: (messages: Message[]) => void;
  prependHistoryMessages: (messages: Message[]) => void;
  setLoadingHistory: (loading: boolean) => void;
  setHasMoreHistory: (hasMore: boolean) => void;

  // Error handling
  setChatError: (error: string | null) => void;
  clearChat: () => void;

  // Typing indicators
  addTypingUser: (user: string) => void;
  removeTypingUser: (user: string) => void;
  clearTypingUsers: () => void;

  // Utilities
  getMessagesByUser: (user: string) => Message[];
  getRecentMessages: (count: number) => Message[];
  getTotalMessageCount: () => number;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      messages: [],
      maxMessages: 100,
      maxMessageLength: 500,
      isLoadingHistory: false,
      hasMoreHistory: true,
      chatError: null,
      typingUsers: [],

      // Message actions
      addMessage: (message) => {
        set((state) => {
          // Check if message already exists to prevent duplicates
          const existingMessage = state.messages.find((msg) => msg.id === message.id);
          if (existingMessage) {
            return state; // Don't add duplicate
          }

          const newMessages = [...state.messages, message];
          // Keep only max messages
          if (newMessages.length > state.maxMessages) {
            newMessages.splice(0, newMessages.length - state.maxMessages);
          }
          return { messages: newMessages };
        });
      },

      // Chat history
      setChatHistory: (messages) => {
        set({ messages: messages.slice(-get().maxMessages) });
      },

      prependHistoryMessages: (messages) => {
        set((state) => ({
          messages: [...messages, ...state.messages],
        }));
      },

      setLoadingHistory: (loading) => {
        set({ isLoadingHistory: loading });
      },

      setHasMoreHistory: (hasMore) => {
        set({ hasMoreHistory: hasMore });
      },

      // Error handling
      setChatError: (error) => {
        set({ chatError: error });
      },

      clearChat: () => {
        set({
          messages: [],
          isLoadingHistory: false,
          hasMoreHistory: true,
          chatError: null,
          typingUsers: [],
        });
      },

      // Typing indicators
      addTypingUser: (user) => {
        set((state) => {
          if (state.typingUsers.includes(user)) {
            return state; // User already typing
          }
          return { typingUsers: [...state.typingUsers, user] };
        });
      },

      removeTypingUser: (user) => {
        set((state) => ({
          typingUsers: state.typingUsers.filter((u) => u !== user),
        }));
      },

      clearTypingUsers: () => {
        set({ typingUsers: [] });
      },

      // Utilities
      getMessagesByUser: (user) => {
        return get().messages.filter((msg) => msg.user === user);
      },

      getRecentMessages: (count) => {
        const messages = get().messages;
        return messages.slice(-count);
      },

      getTotalMessageCount: () => {
        return get().messages.length;
      },
    }),
    {
      name: 'chat-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        messages: state.messages,
      }),
    }
  )
);

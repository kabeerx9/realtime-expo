import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { emitSocketEvent, subscribeToSocketEvent } from '~/services/socketService';
import { useAuthStore } from '~/store/authStore';
import { useNotificationStore } from './notificationStore';

export interface Message {
  id: string;
  text: string;
  user: string;
  timestamp: Date;
}

export interface ChatState {
  messages: Message[];
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  sendMessage: (text: string) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],

      setMessages: (messages) => set({ messages }),

      sendMessage: (text) => {
        // Get the current user from the auth store
        const user = useAuthStore.getState().user;
        if (!user) {
          console.error('Cannot send message, user not authenticated.');
          return;
        }

        // Send the event with the user's name, like the old implementation
        emitSocketEvent('message', { text, user: user.firstName });
      },

      addMessage: (message) => {
        set((state) => {
          // Prevent duplicates
          if (state.messages.some((m) => m.id === message.id)) {
            return state;
          }
          // Add the new message
          const newMessages = [...state.messages, message];
          // Optional: cap the number of messages to prevent memory issues
          if (newMessages.length > 100) {
            newMessages.splice(0, newMessages.length - 100);
          }
          return { messages: newMessages };
        });
      },

      clearChat: () => {
        set({ messages: [] });
      },
    }),
    {
      name: 'chat-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the messages array
      partialize: (state) => ({
        messages: state.messages,
      }),
    }
  )
);

// --- Event Listener Initialization ---

/**
 * Subscribes to chat-related socket events and updates the chat store.
 * @returns A cleanup function to unsubscribe from all listeners.
 */
export const initChatListeners = () => {
  const unsubscribeMessage = subscribeToSocketEvent('message', (payload) => {
    console.log('[Socket] Received message:', payload);

    useChatStore.getState().addMessage({
      ...payload,
      timestamp: new Date(payload.timestamp),
    });
  });

  const unsubscribeHistory = subscribeToSocketEvent('chat_history', (history) => {
    console.log('[Socket] Received chat_history:', history);
    const formattedHistory = history.map((msg) => ({
      ...msg,
      timestamp: new Date(msg.timestamp), // Convert string timestamp to Date object
    }));
    useChatStore.getState().setMessages(formattedHistory);
  });

  // When you add more events (e.g., typing), you subscribe here:
  // const unsubscribeUserTyping = subscribeToSocketEvent('user_typing', ...);

  return () => {
    unsubscribeMessage();
    unsubscribeHistory();
    // unsubscribeUserTyping();
  };
};

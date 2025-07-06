# Realtime Expo App

A production-ready React Native Expo app with WebSocket-based realtime features, built with TypeScript and a layered architecture pattern.

## Realtime Architecture

This app implements a clean, scalable architecture pattern for realtime features using WebSockets. The architecture follows a layered approach that separates concerns and ensures maintainability.

### Architecture Layers

```
UI Components → Custom Hooks → Zustand Stores → WebSocket Service
```

#### 1. **UI Components Layer**
- React Native screens and components
- Only concerned with rendering and user interactions
- Uses custom hooks for all state management and business logic

#### 2. **Custom Hooks Layer**
- React integration layer that bridges UI components with stores
- Handles React-specific concerns (useEffect, component lifecycle)
- Provides clean, reusable APIs for components
- Examples: `useWebSocket`, `useChat`, `useNotifications`

#### 3. **Zustand Stores Layer**
- State management and business logic
- Handles complex state updates and synchronization
- Provides computed values and actions
- Examples: `connectionStore`, `chatStore`, `notificationStore`

#### 4. **WebSocket Service Layer**
- Pure networking layer
- Handles connection management, reconnection, and message routing
- Integrates with stores for state updates
- No UI concerns - only networking logic

### Key Benefits

- **Separation of Concerns**: Each layer has a single responsibility
- **Testability**: Pure functions and isolated state management
- **Scalability**: Easy to add new features without touching existing code
- **Maintainability**: Clear data flow and predictable state updates
- **Reusability**: Hooks and stores can be reused across components

## Chat Example of this Architecture

The chat feature demonstrates how all layers work together in a real-world scenario.

### Data Flow Example

When a user sends a message, here's the complete flow:

```
1. User types message in lobby.tsx
2. Component calls sendMessage() from useChat hook
3. useChat hook calls chatStore.sendMessage()
4. chatStore calls websocketService.sendMessage()
5. WebSocket sends message to server
6. Server broadcasts to all connected clients
7. WebSocket receives message and calls chatStore.addMessage()
8. chatStore updates messages array
9. Components re-render with new message
10. If user is on different screen, toast notification shows
```

### Implementation Details

#### 1. UI Component (`app/lobby.tsx`)
```typescript
// Only handles UI concerns
const { isConnected, connectionError } = useWebSocket();
const { messages, sendMessage, canSendMessage } = useChat();
const { showToast } = useNotifications();

const handleSendMessage = () => {
  if (newMessage.trim() && canSendMessage(newMessage.trim())) {
    sendMessage(newMessage.trim());
    setNewMessage('');
  }
};
```

#### 2. Custom Hooks (`hooks/useChat.ts`)
```typescript
// React integration layer
export const useChat = () => {
  const chatStore = useChatStore();
  const authStore = useAuthStore();

  const sendMessage = useCallback((text: string) => {
    const user = authStore.user?.firstName;
    if (user) {
      chatStore.sendMessage(text, user);
    }
  }, [chatStore, authStore]);

  return {
    messages: chatStore.messages,
    sendMessage,
    canSendMessage: chatStore.canSendMessage,
    // ... other methods
  };
};
```

#### 3. Zustand Store (`store/chatStore.ts`)
```typescript
// Business logic and state management
export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],

  sendMessage: (text: string, user: string) => {
    const message: Message = {
      id: Date.now().toString(),
      text,
      user,
      timestamp: new Date(),
    };

    // Send via WebSocket service
    websocketService.sendMessage({ text, user });
  },

  addMessage: (message: Message) => {
    set((state) => {
      // Prevent duplicates
      if (state.messages.some(m => m.id === message.id)) {
        return state;
      }
      return {
        messages: [...state.messages, message]
      };
    });
  },
}));
```

#### 4. WebSocket Service (`services/websocketService.ts`)
```typescript
// Pure networking layer
class WebSocketService {
  setupEventListeners() {
    this.socket.on('message', (message: Message) => {
      // Update chat store
      chatStore.addMessage(message);

      // Handle notifications
      this.handleMessageNotification(message);
    });
  }

  sendMessage(messageData: { text: string; user: string }) {
    if (this.socket && connectionStore.isConnected) {
      this.socket.emit('message', messageData);
    }
  }

  private handleMessageNotification(message: Message) {
    // Check if should show notification
    if (notificationStore.shouldShowNotification('chat', message.user)) {
      notificationStore.addNotification({
        type: 'chat',
        title: `New message from ${message.user}`,
        message: message.text,
      });
    }
  }
}
```

### Advanced Features

#### 1. **Automatic Reconnection**
```typescript
// connectionStore.ts - Exponential backoff strategy
const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
```

#### 2. **Route-Aware Notifications**
```typescript
// notificationStore.ts - Only show toasts when not on chat screen
shouldShowNotification: (type, user) => {
  if (type === 'chat' && currentRoute === '/lobby') return false;
  return true;
}
```

#### 3. **Duplicate Message Prevention**
```typescript
// chatStore.ts - Prevent duplicate messages
addMessage: (message: Message) => {
  if (state.messages.some(m => m.id === message.id)) {
    return state; // Don't add duplicate
  }
  return { messages: [...state.messages, message] };
}
```

#### 4. **Persistent State**
```typescript
// All stores use AsyncStorage for persistence
export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      // ... store implementation
    }),
    {
      name: 'connection-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### Store Responsibilities

| Store | Purpose | Key Features |
|-------|---------|-------------|
| `connectionStore` | WebSocket connection state | Auto-reconnect, server URL, connection status |
| `chatStore` | Chat messages and logic | Message history, duplicate prevention, user identification |
| `notificationStore` | Toast notifications | Route awareness, unread counts, muting, settings |
| `authStore` | Authentication state | User info, login/logout, token management |

### Hook Responsibilities

| Hook | Purpose | Returns |
|------|---------|---------|
| `useWebSocket` | Connection management | `isConnected`, `connect`, `disconnect`, `reconnect` |
| `useChat` | Chat functionality | `messages`, `sendMessage`, `canSendMessage`, `isMyMessage` |
| `useNotifications` | Toast management | `showToast`, `unreadCounts`, `muteUser` |

### Adding New Features

To add a new realtime feature (e.g., user typing indicators):

1. **Add to Store**: Define state and actions in relevant store
2. **Update Service**: Add WebSocket event handlers
3. **Create Hook**: Add React integration layer
4. **Update UI**: Use hook in components

Example:
```typescript
// 1. Add to chatStore
typingUsers: string[],
setTypingUsers: (users: string[]) => set({ typingUsers: users }),

// 2. Update websocketService
this.socket.on('user_typing', (users) => {
  chatStore.setTypingUsers(users);
});

// 3. Add to useChat hook
const typingUsers = chatStore.typingUsers;
return { typingUsers, /* ... */ };

// 4. Use in component
const { typingUsers } = useChat();
```

This architecture scales beautifully as your app grows, maintaining clean separation of concerns and making it easy to add complex realtime features.

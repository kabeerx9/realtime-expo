import { io, Socket } from 'socket.io-client';
import { useConnectionStore } from '../store/connectionStore';
import { useChatStore, Message } from '../store/chatStore';
import { useNotificationStore } from '../store/notificationStore';

type ReconnectCallback = () => void;

class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectCallbacks: ReconnectCallback[] = [];
  private isReconnecting = false;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  // Pure networking methods
  connect(serverUrl: string) {
    if (this.socket) {
      console.log('WebSocket already connected');
      return;
    }

    const connectionStore = useConnectionStore.getState();
    const chatStore = useChatStore.getState();

    console.log('Connecting to WebSocket server:', serverUrl);

    connectionStore.setServerUrl(serverUrl);
    connectionStore.setConnecting(true);

    this.socket = io(serverUrl, {
      timeout: 10000,
      reconnection: false, // We'll handle reconnection manually
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      connectionStore.setConnected(true);
      this.stopReconnection();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      connectionStore.setConnected(false);

      // Start reconnection if not manually disconnected
      if (reason !== 'io client disconnect') {
        this.startReconnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      connectionStore.setConnectionError(error.message);
      this.startReconnection();
    });

    this.socket.on('message', (message: Message) => {
      console.log('Received message:', message);

      // Add message to store
      chatStore.addMessage(message);

      // Handle notifications
      this.handleMessageNotification(message);
    });

    this.socket.on('chat_history', (history: Message[]) => {
      console.log('Received chat history:', history.length, 'messages');
      chatStore.setChatHistory(history);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      connectionStore.setConnectionError(error.message || 'Unknown error');
      chatStore.setChatError(error.message || 'Chat error occurred');
    });

    this.socket.on('user_typing', (data: { user: string }) => {
      console.log(`${data.user} is typing`);
      chatStore.addTypingUser(data.user);
    });

    this.socket.on('user_stopped_typing', (data: { user: string }) => {
      console.log(`${data.user} stopped typing`);
      chatStore.removeTypingUser(data.user);
    });

    // ----------- ROOM RELATED EVENTS ------------

    this.socket.on('room_created', (data) => {
      console.log('room details ', data);
    });

    this.socket.on('room_joined', (data) => {
      console.log('room details ', data);
    });

    this.socket.on('room_status', (data) => {
      console.log('room status ', data);
    });

    // ----------- GAME RELATED EVENTS ------------
  }

  // ------ METHODS FOR ROOM RELATED EVENTS ----------

  createRoom() {
    if (this.socket && this.getIsConnected()) {
      this.socket.emit('create_room');
    }
  }

  joinRoom(roomId: string) {
    if (this.socket && this.getIsConnected()) {
      this.socket.emit('join_room', { roomId });
    }
  }

  // for a player to get the status of the room he is in
  getRoomStatus() {
    if (this.socket && this.getIsConnected()) {
      this.socket.emit('get_room_status');
    }
  }

  leaveRoom() {
    if (this.socket && this.getIsConnected()) {
      this.socket.emit('leave_room');
    }
  }
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.stopReconnection();

      const connectionStore = useConnectionStore.getState();
      connectionStore.setConnected(false);
      connectionStore.setConnectionError(null);

      const chatStore = useChatStore.getState();
      chatStore.clearChat();
    }
  }

  sendMessage(messageData: { text: string; user: string }) {
    const connectionStore = useConnectionStore.getState();
    const chatStore = useChatStore.getState();

    if (!this.socket || !connectionStore.isConnected) {
      console.warn('Cannot send message: WebSocket not connected');
      chatStore.setChatError('Not connected to chat server');
      return;
    }

    // Create message with unique ID
    const message: Message = {
      id: Date.now().toString(),
      text: messageData.text,
      user: messageData.user,
      timestamp: new Date(),
    };

    // Send to server - server will broadcast to all clients including sender
    this.socket.emit('message', message);
  }

  sendTyping(user: string) {
    const connectionStore = useConnectionStore.getState();

    if (!this.socket || !connectionStore.isConnected) {
      console.warn('Cannot send typing: WebSocket not connected');
      return;
    }

    this.socket.emit('user_typing', { user });
  }

  sendStoppedTyping(user: string) {
    const connectionStore = useConnectionStore.getState();

    if (!this.socket || !connectionStore.isConnected) {
      console.warn('Cannot send stopped typing: WebSocket not connected');
      return;
    }

    this.socket.emit('user_stopped_typing', { user });
  }

  // Reconnection logic
  private startReconnection() {
    if (this.isReconnecting) return;

    const connectionStore = useConnectionStore.getState();

    if (!connectionStore.canReconnect()) {
      console.log('Max reconnection attempts reached');
      connectionStore.setConnectionError('Failed to reconnect. Please refresh the app.');
      return;
    }

    this.isReconnecting = true;
    connectionStore.incrementReconnectAttempts();

    const delay = Math.min(1000 * Math.pow(2, connectionStore.reconnectAttempts), 30000);
    console.log(`Reconnecting in ${delay}ms... (attempt ${connectionStore.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      const serverUrl = connectionStore.serverUrl;
      if (serverUrl) {
        this.socket = null; // Reset socket
        this.connect(serverUrl);
      }
      this.isReconnecting = false;
    }, delay);
  }

  private stopReconnection() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.isReconnecting = false;

    const connectionStore = useConnectionStore.getState();
    connectionStore.resetReconnectAttempts();
  }

  private handleMessageNotification(message: Message) {
    const notificationStore = useNotificationStore.getState();

    // Don't show notifications for own messages
    const authStore = require('../store/authStore').useAuthStore.getState();
    if (message.user === authStore.user?.firstName) {
      return;
    }

    // Check if we should show notification
    if (!notificationStore.shouldShowNotification('chat', message.user)) {
      return;
    }

    // Add notification to store
    notificationStore.addNotification({
      type: 'chat',
      title: `New message from ${message.user}`,
      message: message.text,
      priority: 'normal',
      data: { messageId: message.id, user: message.user },
    });

    // Show toast if enabled
    if (notificationStore.settings.enableInAppNotifications) {
      this.showToast(message);
    }
  }

  private showToast(message: Message) {
    const Toast = require('react-native-toast-message').default;
    const notificationStore = useNotificationStore.getState();

    Toast.show({
      type: 'info',
      text1: `New message from ${message.user}`,
      text2: message.text,
      visibilityTime: notificationStore.settings.notificationTimeout,
      autoHide: true,
      onPress: () => {
        // This will be handled by the navigation hook
        this.notifyReconnectCallbacks();
        Toast.hide();
      },
    });
  }

  // Callback system for navigation
  onReconnect(callback: ReconnectCallback) {
    this.reconnectCallbacks.push(callback);
    return () => {
      this.reconnectCallbacks = this.reconnectCallbacks.filter((cb) => cb !== callback);
    };
  }

  private notifyReconnectCallbacks() {
    this.reconnectCallbacks.forEach((callback) => callback());
  }

  // Getters (for backward compatibility during migration)
  getIsConnected(): boolean {
    return useConnectionStore.getState().isConnected;
  }

  getMessages(): Message[] {
    return useChatStore.getState().messages;
  }

  // Store integration helpers
  getConnectionStore() {
    return useConnectionStore.getState();
  }

  getChatStore() {
    return useChatStore.getState();
  }

  getNotificationStore() {
    return useNotificationStore.getState();
  }
}

export default WebSocketService.getInstance();

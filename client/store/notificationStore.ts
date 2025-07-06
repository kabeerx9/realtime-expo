import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationSettings {
  // Notification preferences
  enableChatNotifications: boolean;
  enableSoundNotifications: boolean;
  enableInAppNotifications: boolean;
  enableBackgroundNotifications: boolean;

  // Notification timing
  notificationTimeout: number;

  // Do not disturb
  muteUntil: Date | null;
  mutedUsers: string[];
  mutedChannels: string[];
}

export interface PendingNotification {
  id: string;
  type: 'chat' | 'system' | 'error' | 'success' | 'warning';
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high';
}

export interface NotificationState {
  // Settings
  settings: NotificationSettings;

  // Pending notifications
  pendingNotifications: PendingNotification[];

  // Current route awareness
  currentRoute: string;

  // Unread counts
  unreadChatCount: number;
  unreadSystemCount: number;

  // Actions
  updateSettings: (settings: Partial<NotificationSettings>) => void;

  // Notification management
  addNotification: (notification: Omit<PendingNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // Route awareness
  setCurrentRoute: (route: string) => void;

  // Unread counts
  setUnreadChatCount: (count: number) => void;
  incrementUnreadChatCount: () => void;
  resetUnreadChatCount: () => void;
  setUnreadSystemCount: (count: number) => void;
  incrementUnreadSystemCount: () => void;
  resetUnreadSystemCount: () => void;

  // Muting
  muteUser: (user: string) => void;
  unmuteUser: (user: string) => void;
  muteChannel: (channel: string) => void;
  unmuteChannel: (channel: string) => void;
  setMuteUntil: (date: Date | null) => void;

  // Utilities
  shouldShowNotification: (type: string, user?: string, channel?: string) => boolean;
  getUnreadNotifications: () => PendingNotification[];
  getTotalUnreadCount: () => number;
  isMuted: () => boolean;
}

const defaultSettings: NotificationSettings = {
  enableChatNotifications: true,
  enableSoundNotifications: true,
  enableInAppNotifications: true,
  enableBackgroundNotifications: true,
  notificationTimeout: 4000,
  muteUntil: null,
  mutedUsers: [],
  mutedChannels: [],
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      // Initial state
      settings: defaultSettings,
      pendingNotifications: [],
      currentRoute: '/',
      unreadChatCount: 0,
      unreadSystemCount: 0,

      // Settings
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      // Notification management
      addNotification: (notificationData) => {
        const notification: PendingNotification = {
          ...notificationData,
          id: `notification-${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
          isRead: false,
        };

        set((state) => ({
          pendingNotifications: [...state.pendingNotifications, notification],
        }));

        // Auto-increment unread counts
        if (notificationData.type === 'chat') {
          get().incrementUnreadChatCount();
        } else if (notificationData.type === 'system') {
          get().incrementUnreadSystemCount();
        }
      },

      markNotificationRead: (id) => {
        set((state) => ({
          pendingNotifications: state.pendingNotifications.map((notif) =>
            notif.id === id ? { ...notif, isRead: true } : notif
          ),
        }));
      },

      markAllNotificationsRead: () => {
        set((state) => ({
          pendingNotifications: state.pendingNotifications.map((notif) => ({
            ...notif,
            isRead: true,
          })),
        }));
      },

      removeNotification: (id) => {
        set((state) => ({
          pendingNotifications: state.pendingNotifications.filter((notif) => notif.id !== id),
        }));
      },

      clearAllNotifications: () => {
        set({
          pendingNotifications: [],
          unreadChatCount: 0,
          unreadSystemCount: 0,
        });
      },

      // Route awareness
      setCurrentRoute: (route) => {
        set({ currentRoute: route });

        // Reset unread count when entering chat route
        if (route === '/lobby') {
          get().resetUnreadChatCount();
        }
      },

      // Unread counts
      setUnreadChatCount: (count) => {
        set({ unreadChatCount: count });
      },

      incrementUnreadChatCount: () => {
        set((state) => ({
          unreadChatCount: state.unreadChatCount + 1,
        }));
      },

      resetUnreadChatCount: () => {
        set({ unreadChatCount: 0 });
      },

      setUnreadSystemCount: (count) => {
        set({ unreadSystemCount: count });
      },

      incrementUnreadSystemCount: () => {
        set((state) => ({
          unreadSystemCount: state.unreadSystemCount + 1,
        }));
      },

      resetUnreadSystemCount: () => {
        set({ unreadSystemCount: 0 });
      },

      // Muting
      muteUser: (user) => {
        set((state) => ({
          settings: {
            ...state.settings,
            mutedUsers: state.settings.mutedUsers.includes(user)
              ? state.settings.mutedUsers
              : [...state.settings.mutedUsers, user],
          },
        }));
      },

      unmuteUser: (user) => {
        set((state) => ({
          settings: {
            ...state.settings,
            mutedUsers: state.settings.mutedUsers.filter((u) => u !== user),
          },
        }));
      },

      muteChannel: (channel) => {
        set((state) => ({
          settings: {
            ...state.settings,
            mutedChannels: state.settings.mutedChannels.includes(channel)
              ? state.settings.mutedChannels
              : [...state.settings.mutedChannels, channel],
          },
        }));
      },

      unmuteChannel: (channel) => {
        set((state) => ({
          settings: {
            ...state.settings,
            mutedChannels: state.settings.mutedChannels.filter((c) => c !== channel),
          },
        }));
      },

      setMuteUntil: (date) => {
        set((state) => ({
          settings: { ...state.settings, muteUntil: date },
        }));
      },

      // Utilities
      shouldShowNotification: (type, user, channel) => {
        const { settings, currentRoute } = get();

        // Don't show notifications if globally disabled
        if (!settings.enableInAppNotifications) return false;

        // Don't show chat notifications if on chat route
        if (type === 'chat' && currentRoute === '/lobby') return false;

        // Check if currently muted
        if (get().isMuted()) return false;

        // Check if user is muted
        if (user && settings.mutedUsers.includes(user)) return false;

        // Check if channel is muted
        if (channel && settings.mutedChannels.includes(channel)) return false;

        // Check type-specific settings
        if (type === 'chat' && !settings.enableChatNotifications) return false;

        return true;
      },

      getUnreadNotifications: () => {
        return get().pendingNotifications.filter((notif) => !notif.isRead);
      },

      getTotalUnreadCount: () => {
        const { unreadChatCount, unreadSystemCount } = get();
        return unreadChatCount + unreadSystemCount;
      },

      isMuted: () => {
        const { settings } = get();
        if (!settings.muteUntil) return false;
        return new Date() < settings.muteUntil;
      },
    }),
    {
      name: 'notification-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
        unreadChatCount: state.unreadChatCount,
        unreadSystemCount: state.unreadSystemCount,
      }),
    }
  )
);

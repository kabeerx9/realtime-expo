import { useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'expo-router';
import {
  useNotificationStore,
  PendingNotification,
  NotificationSettings,
} from '../store/notificationStore';
import Toast from 'react-native-toast-message';

export interface UseNotificationsOptions {
  autoTrackRoute?: boolean;
  enableToasts?: boolean;
}

export interface UseNotificationsReturn {
  // Notification data
  pendingNotifications: PendingNotification[];
  unreadChatCount: number;
  unreadSystemCount: number;
  totalUnreadCount: number;
  settings: NotificationSettings;

  // Status
  isMuted: boolean;
  currentRoute: string;

  // Actions
  showToast: (
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message?: string
  ) => void;
  addNotification: (notification: Omit<PendingNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;

  // Settings
  updateSettings: (settings: Partial<NotificationSettings>) => void;

  // Muting
  muteUser: (user: string) => void;
  unmuteUser: (user: string) => void;
  muteUntil: (date: Date) => void;
  unmute: () => void;

  // Navigation
  navigateToChat: () => void;

  // Utilities
  getUnreadNotifications: () => PendingNotification[];
  shouldShowNotification: (type: string, user?: string) => boolean;
}

export const useNotifications = (options: UseNotificationsOptions = {}): UseNotificationsReturn => {
  const { autoTrackRoute = true, enableToasts = true } = options;

  const pathname = usePathname();
  const router = useRouter();

  // Store subscriptions
  const {
    pendingNotifications,
    unreadChatCount,
    unreadSystemCount,
    settings,
    currentRoute,
    setCurrentRoute,
    addNotification: addNotificationToStore,
    markNotificationRead,
    markAllNotificationsRead,
    removeNotification: removeNotificationFromStore,
    clearAllNotifications,
    updateSettings: updateNotificationSettings,
    muteUser: muteUserInStore,
    unmuteUser: unmuteUserFromStore,
    setMuteUntil,
    shouldShowNotification: shouldShowNotificationFromStore,
    getUnreadNotifications: getUnreadNotificationsFromStore,
    getTotalUnreadCount,
    isMuted: getIsMuted,
  } = useNotificationStore();

  // Auto-track route changes
  useEffect(() => {
    if (autoTrackRoute) {
      setCurrentRoute(pathname);
    }
  }, [pathname, autoTrackRoute, setCurrentRoute]);

  // Show toast notification
  const showToast = useCallback(
    (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => {
      if (!enableToasts) return;

      Toast.show({
        type,
        text1: title,
        text2: message,
        visibilityTime: settings.notificationTimeout,
        autoHide: true,
      });
    },
    [enableToasts, settings.notificationTimeout]
  );

  // Add notification
  const addNotification = useCallback(
    (notification: Omit<PendingNotification, 'id' | 'timestamp' | 'isRead'>) => {
      addNotificationToStore(notification);

      // Show toast if enabled and should show
      if (enableToasts && shouldShowNotificationFromStore(notification.type)) {
        showToast(
          notification.type as 'success' | 'error' | 'info' | 'warning',
          notification.title,
          notification.message
        );
      }
    },
    [addNotificationToStore, enableToasts, shouldShowNotificationFromStore, showToast]
  );

  // Mark as read
  const markAsRead = useCallback(
    (id: string) => {
      markNotificationRead(id);
    },
    [markNotificationRead]
  );

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    markAllNotificationsRead();
  }, [markAllNotificationsRead]);

  // Remove notification
  const removeNotification = useCallback(
    (id: string) => {
      removeNotificationFromStore(id);
    },
    [removeNotificationFromStore]
  );

  // Clear all notifications
  const clearAll = useCallback(() => {
    clearAllNotifications();
  }, [clearAllNotifications]);

  // Update settings
  const updateSettings = useCallback(
    (newSettings: Partial<NotificationSettings>) => {
      updateNotificationSettings(newSettings);
    },
    [updateNotificationSettings]
  );

  // Mute user
  const muteUser = useCallback(
    (user: string) => {
      muteUserInStore(user);
      showToast('info', 'User muted', `${user} has been muted`);
    },
    [muteUserInStore, showToast]
  );

  // Unmute user
  const unmuteUser = useCallback(
    (user: string) => {
      unmuteUserFromStore(user);
      showToast('info', 'User unmuted', `${user} has been unmuted`);
    },
    [unmuteUserFromStore, showToast]
  );

  // Mute until specific time
  const muteUntil = useCallback(
    (date: Date) => {
      setMuteUntil(date);
      const duration = Math.round((date.getTime() - Date.now()) / 1000 / 60); // minutes
      showToast('info', 'Notifications muted', `Muted for ${duration} minutes`);
    },
    [setMuteUntil, showToast]
  );

  // Unmute
  const unmute = useCallback(() => {
    setMuteUntil(null);
    showToast('info', 'Notifications unmuted', 'You will now receive notifications');
  }, [setMuteUntil, showToast]);

  // Navigate to chat
  const navigateToChat = useCallback(() => {
    router.push('/lobby');
  }, [router]);

  // Get unread notifications
  const getUnreadNotifications = useCallback(() => {
    return getUnreadNotificationsFromStore();
  }, [getUnreadNotificationsFromStore]);

  // Should show notification
  const shouldShowNotification = useCallback(
    (type: string, user?: string) => {
      return shouldShowNotificationFromStore(type, user);
    },
    [shouldShowNotificationFromStore]
  );

  return {
    // Notification data
    pendingNotifications,
    unreadChatCount,
    unreadSystemCount,
    totalUnreadCount: getTotalUnreadCount(),
    settings,

    // Status
    isMuted: getIsMuted(),
    currentRoute,

    // Actions
    showToast,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,

    // Settings
    updateSettings,

    // Muting
    muteUser,
    unmuteUser,
    muteUntil,
    unmute,

    // Navigation
    navigateToChat,

    // Utilities
    getUnreadNotifications,
    shouldShowNotification,
  };
};

// Specialized hook for toast only
export const useToast = () => {
  const { settings } = useNotificationStore();

  const showToast = useCallback(
    (
      type: 'success' | 'error' | 'info' | 'warning',
      title: string,
      message?: string,
      options?: {
        duration?: number;
        onPress?: () => void;
      }
    ) => {
      Toast.show({
        type,
        text1: title,
        text2: message,
        visibilityTime: options?.duration || settings.notificationTimeout,
        autoHide: true,
        onPress: options?.onPress,
      });
    },
    [settings.notificationTimeout]
  );

  const hideToast = useCallback(() => {
    Toast.hide();
  }, []);

  return {
    showToast,
    hideToast,
  };
};

// Specialized hook for unread badge counts
export const useUnreadCounts = () => {
  const {
    unreadChatCount,
    unreadSystemCount,
    getTotalUnreadCount,
    resetUnreadChatCount,
    resetUnreadSystemCount,
  } = useNotificationStore();

  const totalUnreadCount = getTotalUnreadCount();

  return {
    unreadChatCount,
    unreadSystemCount,
    totalUnreadCount,
    resetUnreadChatCount,
    resetUnreadSystemCount,
    hasUnreadMessages: totalUnreadCount > 0,
  };
};

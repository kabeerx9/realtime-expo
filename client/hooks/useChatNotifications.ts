import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { subscribeToSocketEvent } from '~/services/socketService';
import { useNotificationStore } from '~/store/notificationStore';
import Toast from 'react-native-toast-message';

/**
 * This hook is responsible for handling real-time chat notifications.
 * It listens for incoming messages and displays clickable toasts.
 */
export const useChatNotifications = () => {
  const router = useRouter();
  const { shouldShowNotification, incrementUnreadChatCount } = useNotificationStore();

  useEffect(() => {
    // Subscribe to the message event
    const unsubscribe = subscribeToSocketEvent('message', (payload) => {
      // Check if we should show a notification
      if (shouldShowNotification('chat', payload.user)) {
        // Increment the unread count in the store
        incrementUnreadChatCount();

        // Show a clickable toast notification
        Toast.show({
          type: 'info',
          text1: `New message from ${payload.user}`,
          text2: payload.text,
          visibilityTime: 4000,
          onPress: () => {
            // On press, navigate to the lobby and hide the toast
            router.push('/lobby');
            Toast.hide();
          },
        });
      }
    });

    // Return the cleanup function
    return () => {
      unsubscribe();
    };
  }, [router, shouldShowNotification, incrementUnreadChatCount]);
};

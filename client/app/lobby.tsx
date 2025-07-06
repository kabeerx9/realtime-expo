import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform } from 'react-native';

import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useWebSocket } from '../hooks/useWebSocket';
import { useChat } from '../hooks/useChat';
import { useNotifications } from '../hooks/useNotifications';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Lobby() {
  const [newMessage, setNewMessage] = useState('');
  const scrollViewRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use the new hooks
  const { isConnected, connectionError } = useWebSocket();
  const {
    messages,
    chatError,
    sendMessage,
    isMyMessage,
    clearError,
    canSendMessage,
    typingUsers,
    startTyping,
    stopTyping,
  } = useChat();
  const { showToast } = useNotifications();

  useEffect(() => {
    // Auto scroll to bottom when new messages arrive
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Show error toasts
  useEffect(() => {
    if (connectionError) {
      showToast('error', 'Connection Error', connectionError);
    }
  }, [connectionError, showToast]);

  useEffect(() => {
    if (chatError) {
      showToast('error', 'Chat Error', chatError);
    }
  }, [chatError, showToast]);

  const handleSendMessage = () => {
    if (newMessage.trim() && canSendMessage(newMessage.trim())) {
      sendMessage(newMessage.trim());
      setNewMessage('');

      // Stop typing when message is sent
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping();
    }
  };

  const handleClearError = () => {
    clearError();
  };

  const handleTextChange = (text: string) => {
    setNewMessage(text);

    // Handle typing indicators
    if (text.trim() && isConnected) {
      // Start typing
      startTyping();

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 2000);
    } else if (!text.trim()) {
      // Stop typing if input is empty
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping();
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-4 pt-2">
        {/* Connection Status */}
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View
              className={`mr-2 h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <Text
              className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
          {(connectionError || chatError) && (
            <TouchableOpacity
              onPress={handleClearError}
              className="rounded-md bg-red-100 px-3 py-1">
              <Text className="text-xs font-medium text-red-600">Clear Error</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Messages Container */}
        <View className="flex-1 rounded-lg border border-gray-200 bg-gray-50">
          <KeyboardAwareScrollView
            ref={scrollViewRef}
            className="flex-1 p-4"
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {messages.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-center text-base text-gray-500">
                  No messages yet. Start the conversation!
                </Text>
              </View>
            ) : (
              <View className="flex-1">
                {messages.map((message) => {
                  const isMine = isMyMessage(message);
                  return (
                    <View
                      key={message.id}
                      className={`mb-4 ${isMine ? 'items-end' : 'items-start'}`}>
                      <View
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          isMine
                            ? 'rounded-tr-md bg-blue-500'
                            : 'rounded-tl-md border border-gray-200 bg-white'
                        }`}>
                        {!isMine && (
                          <Text className="mb-1 text-xs font-semibold text-blue-600">
                            {message.user}
                          </Text>
                        )}
                        <Text className={`text-base ${isMine ? 'text-white' : 'text-gray-800'}`}>
                          {message.text}
                        </Text>
                      </View>
                      <Text
                        className={`mt-1 text-xs text-gray-500 ${isMine ? 'text-right' : 'text-left'}`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <View className="mx-[-16px] mb-3 border-t border-gray-200 bg-gray-50 px-4 py-2">
                <Text className="text-sm text-gray-500">
                  {typingUsers.length === 1
                    ? `${typingUsers[0]} is typing...`
                    : typingUsers.length === 2
                      ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
                      : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`}
                </Text>
              </View>
            )}

            {/* Message Input */}
            <View className="mb-10 mt-auto pt-3">
              <View className="flex-row items-end space-x-3">
                <View className="flex-1">
                  <TextInput
                    value={newMessage}
                    onChangeText={handleTextChange}
                    placeholder="Type your message..."
                    className={`flex-1 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-base ${
                      Platform.OS === 'ios' ? 'min-h-[44px]' : 'min-h-[48px]'
                    } ${!isConnected ? 'bg-gray-100' : ''}`}
                    multiline
                    maxLength={500}
                    onSubmitEditing={handleSendMessage}
                    returnKeyType="send"
                    editable={isConnected}
                    textAlignVertical="top"
                    style={{
                      maxHeight: 120,
                      ...(Platform.OS === 'android' && { textAlignVertical: 'top' }),
                    }}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleSendMessage}
                  disabled={!canSendMessage(newMessage.trim())}
                  className={`rounded-2xl px-6 py-3 ${
                    canSendMessage(newMessage.trim()) ? 'bg-blue-500' : 'bg-gray-300'
                  } ${Platform.OS === 'ios' ? 'min-h-[44px]' : 'min-h-[48px]'} items-center justify-center`}>
                  <Text
                    className={`text-base font-semibold ${
                      canSendMessage(newMessage.trim()) ? 'text-white' : 'text-gray-500'
                    }`}>
                    Send
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAwareScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

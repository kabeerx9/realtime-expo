import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { Container } from '~/components/Container';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useWebSocket } from '../hooks/useWebSocket';
import { useChat } from '../hooks/useChat';
import { useNotifications } from '../hooks/useNotifications';

export default function Lobby() {
  const [newMessage, setNewMessage] = useState('');
  const scrollViewRef = useRef<any>(null);

  // Use the new hooks
  const { isConnected, connectionError } = useWebSocket();
  const { messages, chatError, sendMessage, isMyMessage, clearError, canSendMessage } = useChat();
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
    }
  };

  const handleClearError = () => {
    clearError();
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Lobby Chat' }} />
      <Container>
        <View className="flex-1 p-4">
          {/* Connection Status */}
          <View className="mb-4 flex-row items-center">
            <View
              className={`mr-2 h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <Text className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
            {(connectionError || chatError) && (
              <TouchableOpacity
                onPress={handleClearError}
                className="ml-2 rounded bg-red-100 px-2 py-1">
                <Text className="text-xs text-red-600">Clear Error</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Messages */}
          <KeyboardAwareScrollView
            ref={scrollViewRef}
            className="mb-4 flex-1 rounded-lg bg-gray-50 p-3"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {messages.length === 0 ? (
              <Text className="mt-4 text-center text-gray-500">
                No messages yet. Start the conversation!
              </Text>
            ) : (
              messages.map((message) => {
                const isMine = isMyMessage(message);
                return (
                  <View key={message.id} className={`mb-4 ${isMine ? 'items-end' : 'items-start'}`}>
                    <View
                      className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        isMine
                          ? 'rounded-tr-sm bg-blue-500'
                          : 'rounded-tl-sm border border-gray-200 bg-white'
                      }`}>
                      {!isMine && (
                        <Text className="mb-1 text-xs font-semibold text-blue-600">
                          {message.user}
                        </Text>
                      )}
                      <Text className={`${isMine ? 'text-white' : 'text-gray-800'}`}>
                        {message.text}
                      </Text>
                    </View>
                    <Text
                      className={`mt-1 text-xs text-gray-500 ${isMine ? 'text-right' : 'text-left'}`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                );
              })
            )}
          </KeyboardAwareScrollView>

          {/* Message Input */}
          <View className="flex-row items-center space-x-2">
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type your message..."
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3"
              multiline
              maxLength={500}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
              editable={isConnected}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!canSendMessage(newMessage.trim())}
              className={`rounded-lg px-4 py-3 ${
                canSendMessage(newMessage.trim()) ? 'bg-blue-500' : 'bg-gray-300'
              }`}>
              <Text
                className={`font-semibold ${
                  canSendMessage(newMessage.trim()) ? 'text-white' : 'text-gray-500'
                }`}>
                Send
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Container>
    </>
  );
}

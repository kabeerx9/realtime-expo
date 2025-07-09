import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';

import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useChat } from '../hooks/useChat';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Lobby() {
  const [newMessage, setNewMessage] = useState('');
  // The ref now points to the KeyboardAwareScrollView
  const scrollViewRef = useRef<ScrollView>(null);

  // Use our new, simplified hook
  const { messages, isConnected, sendMessage, isMyMessage } = useChat();

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      // Use a short timeout to ensure the UI has updated before scrolling
      setTimeout(() => scrollViewRef.current?.scrollToEnd(), 100);
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && isConnected) {
      sendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const canSend = newMessage.trim().length > 0 && isConnected;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 p-4">
        {/* Connection Status */}
        <View className="mb-3 flex-row items-center">
          <View
            className={`mr-2 h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <Text
            className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>

        <View className="flex-1 rounded-lg border border-gray-200 bg-gray-50">
          <KeyboardAwareScrollView
            ref={scrollViewRef}
            className="flex-1 p-4"
            keyboardShouldPersistTaps="handled">
            {/* Message list rendered with map */}
            {messages.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-center text-base text-gray-500">
                  No messages yet. Start the conversation!
                </Text>
              </View>
            ) : (
              messages.map((message) => {
                const isMine = isMyMessage(message);
                return (
                  <View key={message.id} className={`mb-4 ${isMine ? 'items-end' : 'items-start'}`}>
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
              })
            )}
          </KeyboardAwareScrollView>

          {/* Message Input */}
          <View className="border-t border-gray-200 bg-gray-50 p-3">
            <View className="flex-row items-center space-x-3">
              <TextInput
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Type your message..."
                className={`flex-1 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-base ${
                  !isConnected ? 'bg-gray-100' : ''
                }`}
                multiline
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
                editable={isConnected}
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={!canSend}
                className={`h-12 w-12 items-center justify-center rounded-full ${
                  canSend ? 'bg-blue-500' : 'bg-gray-300'
                }`}>
                {/* Using an icon would be better here, but Text is fine for now */}
                <Text className="text-xl">🚀</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

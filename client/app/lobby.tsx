import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform, FlatList } from 'react-native';

import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useChat } from '../hooks/useChat';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Lobby() {
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Use our new, simplified hook
  const { messages, isConnected, sendMessage, isMyMessage } = useChat();

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
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

        {/* Messages Container */}
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled">
          <View className="flex-1">
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center">
                  <Text className="text-center text-base text-gray-500">
                    No messages yet. Start the conversation!
                  </Text>
                </View>
              }
              renderItem={({ item: message }) => {
                const isMine = isMyMessage(message);
                return (
                  <View className={`mb-4 ${isMine ? 'items-end' : 'items-start'}`}>
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
              }}
              className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-4"
              contentContainerStyle={{ flexGrow: 1 }}
            />
          </View>

          {/* Message Input */}
          <View className="mt-3 flex-row items-center space-x-3">
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
              className={`rounded-2xl px-6 py-3 ${
                canSend ? 'bg-blue-500' : 'bg-gray-300'
              } items-center justify-center`}>
              <Text
                className={`text-base font-semibold ${canSend ? 'text-white' : 'text-gray-500'}`}>
                Send
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  );
}

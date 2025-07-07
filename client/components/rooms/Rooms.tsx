import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Text, View, TouchableOpacity, TextInput, Modal } from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';

const Rooms = () => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Variables
  const snapPoints = useMemo(() => ['40%', '65%'], []);

  // Callbacks
  const handleSheetChanges = useCallback((index: number) => {
    setIsSheetOpen(index !== -1);
  }, []);

  const handleOpenSheet = useCallback(() => {
    setIsSheetOpen(true);
    bottomSheetRef.current?.expand();
  }, []);

  const handleCloseSheet = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const handleCreateRoom = useCallback(() => {
    // TODO: Handle create room
    console.log('Create room pressed');
  }, []);

  const handleJoinRoom = useCallback(() => {
    // TODO: Handle join room
    console.log('Join room with code:', joinRoomCode);
  }, [joinRoomCode]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  return (
    <>
      {/* Trigger Button */}
      <View className="px-6 pb-6">
        <TouchableOpacity
          onPress={handleOpenSheet}
          className="rounded-2xl bg-indigo-600 p-4 shadow-lg">
          <View className="flex-row items-center justify-center">
            <Text className="mr-2 text-xl">🏠</Text>
            <Text className="text-center text-lg font-semibold text-white">Manage Rooms</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Modal Container for Bottom Sheet */}
      <Modal
        visible={isSheetOpen}
        transparent={true}
        animationType="none"
        statusBarTranslucent={true}>
        <View className="flex-1">
          <BottomSheet
            ref={bottomSheetRef}
            index={0}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
            enablePanDownToClose={true}
            backgroundStyle={{ backgroundColor: '#f8fafc' }}
            handleIndicatorStyle={{ backgroundColor: '#cbd5e1' }}
            backdropComponent={renderBackdrop}>
            <BottomSheetView className="flex-1 px-6">
              {/* Header */}
              <View className="mb-6 items-center">
                <Text className="text-2xl font-bold text-gray-800">Room Management</Text>
                <Text className="mt-1 text-gray-600">Create or join a room to get started</Text>
              </View>

              {/* Create Room Section */}
              <View className="mb-6">
                <TouchableOpacity
                  onPress={handleCreateRoom}
                  className="rounded-2xl bg-green-600 p-4 shadow-sm">
                  <View className="flex-row items-center justify-center">
                    <Text className="mr-3 text-xl">➕</Text>
                    <Text className="text-lg font-semibold text-white">Create New Room</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View className="mb-6 flex-row items-center">
                <View className="h-px flex-1 bg-gray-300" />
                <Text className="mx-4 font-medium text-gray-500">OR</Text>
                <View className="h-px flex-1 bg-gray-300" />
              </View>

              {/* Join Room Section */}
              <View className="space-y-4">
                <Text className="text-lg font-semibold text-gray-800">Join Existing Room</Text>

                <View className="rounded-xl border border-gray-200 bg-white p-1">
                  <BottomSheetTextInput
                    value={joinRoomCode}
                    onChangeText={setJoinRoomCode}
                    placeholder="Enter room code..."
                    placeholderTextColor="#9ca3af"
                    className="px-4 py-3 text-base text-gray-800"
                    autoCapitalize="characters"
                    maxLength={6}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleJoinRoom}
                  disabled={joinRoomCode.length === 0}
                  className={`rounded-2xl p-4 ${
                    joinRoomCode.length > 0 ? 'bg-blue-600 shadow-sm' : 'bg-gray-300'
                  }`}>
                  <View className="flex-row items-center justify-center">
                    <Text className="mr-3 text-xl">🚪</Text>
                    <Text
                      className={`text-lg font-semibold ${
                        joinRoomCode.length > 0 ? 'text-white' : 'text-gray-500'
                      }`}>
                      Join Room
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Info Section */}
              <View className="mt-6 rounded-xl bg-blue-50 p-4">
                <Text className="mb-1 text-sm font-medium text-blue-800">💡 Quick Tip</Text>
                <Text className="text-sm text-blue-700">
                  Room codes are usually 4-6 characters. Ask the room creator for the code to join.
                </Text>
              </View>
            </BottomSheetView>
          </BottomSheet>
        </View>
      </Modal>
    </>
  );
};

export default Rooms;

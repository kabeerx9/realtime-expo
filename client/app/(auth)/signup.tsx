import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { Link, router } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useAuthStore } from '../../store/authStore';

export default function SignupScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signUp, isSigningUp, error, clearError } = useAuthStore();

  React.useEffect(() => {
    clearError();
  }, []);

  const handleSignup = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await signUp(email, password, firstName, lastName);
      router.replace('/');
    } catch (err) {
      const errorMsg = typeof err === 'string' ? err : error || 'Something went wrong';
      Alert.alert('Signup Failed', errorMsg);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAwareScrollView className="flex-1">
        <View className="flex-1 justify-center px-6">
          <View className="mb-8">
            <Text className="mb-2 text-3xl font-bold text-gray-900">Create Account</Text>
            <Text className="text-gray-600">Sign up to get started</Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="mb-2 text-sm font-medium text-gray-700">First Name</Text>
              <TextInput
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter your first name"
                autoCapitalize="words"
              />
            </View>

            <View>
              <Text className="mb-2 text-sm font-medium text-gray-700">Last Name</Text>
              <TextInput
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter your last name"
                autoCapitalize="words"
              />
            </View>

            <View>
              <Text className="mb-2 text-sm font-medium text-gray-700">Email</Text>
              <TextInput
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View>
              <Text className="mb-2 text-sm font-medium text-gray-700">Password</Text>
              <TextInput
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
              />
            </View>

            {error && (
              <Text className="text-sm text-red-500">
                {typeof error === 'string' ? error : 'An error occurred'}
              </Text>
            )}

            <TouchableOpacity
              className="mt-6 w-full rounded-lg bg-blue-600 py-3"
              onPress={handleSignup}
              disabled={isSigningUp}>
              <Text className="text-center font-semibold text-white">
                {isSigningUp ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <View className="mt-6 flex-row justify-center">
              <Text className="text-gray-600">Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text className="font-semibold text-blue-600">Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

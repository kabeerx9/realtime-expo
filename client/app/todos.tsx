import React, { useState } from 'react';
import { Stack } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  useTodos,
  useCreateTodo,
  useToggleTodo,
  useDeleteTodo,
  Todo,
  CreateTodoInput,
} from '~/hooks/useTodos';
import { Button } from '~/components/Button';

export default function TodosScreen() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTodo, setNewTodo] = useState<CreateTodoInput>({
    title: '',
    description: '',
    priority: 'medium',
  });
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');

  // Queries and mutations
  const {
    data: todos = [],
    isLoading,
    error,
    refetch,
  } = useTodos(filter === 'all' ? {} : { completed: filter === 'completed' });
  const createTodoMutation = useCreateTodo();
  const toggleTodoMutation = useToggleTodo();
  const deleteTodoMutation = useDeleteTodo();

  const handleCreateTodo = async () => {
    if (!newTodo.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    try {
      await createTodoMutation.mutateAsync(newTodo);
      setNewTodo({ title: '', description: '', priority: 'medium' });
      setShowCreateForm(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create todo');
    }
  };

  const handleToggleTodo = async (id: string) => {
    try {
      await toggleTodoMutation.mutateAsync(id);
    } catch (error) {
      Alert.alert('Error', 'Failed to update todo');
    }
  };

  const handleDeleteTodo = async (id: string) => {
    Alert.alert('Delete Todo', 'Are you sure you want to delete this todo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTodoMutation.mutateAsync(id);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete todo');
          }
        },
      },
    ]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-amber-500';
      case 'low':
        return 'bg-emerald-500';
      default:
        return 'bg-gray-500';
    }
  };

  const renderTodo = ({ item }: { item: Todo }) => (
    <View className="mx-4 mb-3 rounded-2xl bg-white p-5 shadow-lg shadow-black/5">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => handleToggleTodo(item.id)}
              className={`mr-4 h-6 w-6 items-center justify-center rounded-full border-2 ${
                item.completed
                  ? 'border-emerald-500 bg-emerald-500'
                  : 'border-gray-300 hover:border-emerald-400'
              }`}>
              {item.completed && <Text className="text-sm font-bold text-white">✓</Text>}
            </TouchableOpacity>
            <View className="flex-1">
              <Text
                className={`text-lg font-semibold ${
                  item.completed ? 'text-gray-400 line-through' : 'text-gray-900'
                }`}>
                {item.title}
              </Text>
            </View>
          </View>

          {item.description && (
            <Text
              className={`ml-10 mt-2 text-sm leading-5 ${
                item.completed ? 'text-gray-400' : 'text-gray-600'
              }`}>
              {item.description}
            </Text>
          )}

          <View className="ml-10 mt-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className={`mr-3 rounded-full px-3 py-1 ${getPriorityColor(item.priority)}`}>
                <Text className="text-xs font-semibold capitalize text-white">{item.priority}</Text>
              </View>
              <Text className="text-xs font-medium text-gray-500">
                {new Date(item.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => handleDeleteTodo(item.id)}
          className="ml-3 rounded-full bg-red-50 px-3 py-2 active:bg-red-100">
          <Text className="text-xs font-semibold text-red-600">Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (error) {
    return (
      <View className="flex-1 bg-gray-50 pt-12">
        <View className="flex-1 items-center justify-center px-6">
          <View className="rounded-2xl bg-white p-8 shadow-lg shadow-black/5">
            <Text className="mb-3 text-center text-lg font-semibold text-gray-900">
              Oops! Something went wrong
            </Text>
            <Text className="mb-6 text-center text-gray-600">
              Failed to load your todos. Please try again.
            </Text>
            <Button title="Retry" onPress={() => refetch()} />
          </View>
        </View>
      </View>
    );
  }

  const renderListHeader = () => (
    <>
      {/* Header */}
      <View className="bg-white px-6 py-4 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-gray-900">My Todos</Text>
            <Text className="mt-1 text-sm text-gray-600">
              {todos.length} {todos.length === 1 ? 'task' : 'tasks'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowCreateForm(!showCreateForm)}
            className={`rounded-2xl px-6 py-3 ${
              showCreateForm
                ? 'border border-gray-300 bg-gray-100'
                : 'bg-blue-500 shadow-lg shadow-blue-500/25'
            }`}>
            <Text className={`font-semibold ${showCreateForm ? 'text-gray-700' : 'text-white'}`}>
              {showCreateForm ? 'Cancel' : '+ Add Todo'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Create Form */}
      {showCreateForm && (
        <View className="mx-4 mt-4 rounded-2xl bg-white p-6 shadow-lg shadow-black/5">
          <Text className="mb-4 text-lg font-semibold text-gray-900">Create New Todo</Text>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-gray-700">Title</Text>
            <TextInput
              placeholder="What needs to be done?"
              value={newTodo.title}
              onChangeText={(text) => setNewTodo({ ...newTodo, title: text })}
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-gray-700">Description (optional)</Text>
            <TextInput
              placeholder="Add more details..."
              value={newTodo.description}
              onChangeText={(text) => setNewTodo({ ...newTodo, description: text })}
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />
          </View>

          <View className="mb-6">
            <Text className="mb-3 text-sm font-medium text-gray-700">Priority</Text>
            <View className="flex-row gap-3">
              {['low', 'medium', 'high'].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  onPress={() => setNewTodo({ ...newTodo, priority: priority as any })}
                  className={`flex-1 rounded-xl px-4 py-3 ${
                    newTodo.priority === priority
                      ? 'bg-blue-500 shadow-lg shadow-blue-500/25'
                      : 'border border-gray-200 bg-gray-100'
                  }`}>
                  <Text
                    className={`text-center font-medium capitalize ${
                      newTodo.priority === priority ? 'text-white' : 'text-gray-700'
                    }`}>
                    {priority}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Button
            title={createTodoMutation.isPending ? 'Creating...' : 'Create Todo'}
            onPress={handleCreateTodo}
            disabled={createTodoMutation.isPending}
          />
        </View>
      )}

      {/* Filter */}
      <View className="px-4 pb-2 pt-4">
        <View className="rounded-2xl bg-white p-2 shadow-sm shadow-black/5">
          <View className="flex-row">
            {['all', 'pending', 'completed'].map((filterType) => (
              <TouchableOpacity
                key={filterType}
                onPress={() => setFilter(filterType as any)}
                className={`mx-1 flex-1 rounded-xl px-4 py-3 ${
                  filter === filterType
                    ? 'bg-blue-500 shadow-lg shadow-blue-500/25'
                    : 'bg-transparent'
                }`}>
                <Text
                  className={`text-center font-medium capitalize ${
                    filter === filterType ? 'text-white' : 'text-gray-600'
                  }`}>
                  {filterType}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </>
  );

  return (
    <View className="flex-1 bg-gray-50 pt-12">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-4 font-medium text-gray-500">Loading your todos...</Text>
        </View>
      ) : (
        <FlatList
          data={todos}
          renderItem={renderTodo}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderListHeader}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-16">
              <View className="items-center">
                <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <Text className="text-2xl">📝</Text>
                </View>
                <Text className="mb-2 text-lg font-semibold text-gray-900">
                  {filter === 'all' ? 'No todos yet' : `No ${filter} todos`}
                </Text>
                <Text className="px-8 text-center text-gray-500">
                  {filter === 'all'
                    ? 'Create your first todo to get started!'
                    : `You don't have any ${filter} todos right now.`}
                </Text>
              </View>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

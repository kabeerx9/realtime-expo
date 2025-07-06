import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/authService';

// Remove all the duplicate axios setup and use the shared apiClient

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CreateTodoInput {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
}

// Query key factory
export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...todoKeys.lists(), filters] as const,
  details: () => [...todoKeys.all, 'detail'] as const,
  detail: (id: string) => [...todoKeys.details(), id] as const,
};

// Fetch todos
export const useTodos = (filters: { completed?: boolean } = {}) => {
  return useQuery({
    queryKey: todoKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.completed !== undefined) {
        params.append('completed', filters.completed.toString());
      }

      const response = await apiClient.get(`/todos?${params.toString()}`);
      return response.data.data.todos as Todo[];
    },
  });
};

// Create todo
export const useCreateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTodoInput) => {
      const response = await apiClient.post('/todos', input);
      return response.data.data as Todo;
    },
    onSuccess: (newTodo) => {
      // Invalidate and refetch todos
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });

      // Optimistically update the cache
      queryClient.setQueryData<Todo[]>(todoKeys.list({}), (old) => {
        return old ? [newTodo, ...old] : [newTodo];
      });
    },
  });
};

// Toggle todo
export const useToggleTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.patch(`/todos/${id}/toggle`);
      return response.data.data as Todo;
    },
    onSuccess: (updatedTodo) => {
      // Update all relevant queries
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });

      // Optimistically update the cache
      queryClient.setQueriesData<Todo[]>({ queryKey: todoKeys.lists() }, (old) => {
        return old?.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo));
      });
    },
  });
};

// Delete todo
export const useDeleteTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/todos/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      // Update all relevant queries
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });

      // Optimistically update the cache
      queryClient.setQueriesData<Todo[]>({ queryKey: todoKeys.lists() }, (old) => {
        return old?.filter((todo) => todo.id !== deletedId);
      });
    },
  });
};

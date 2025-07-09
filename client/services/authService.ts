import axios, { AxiosError, isAxiosError, InternalAxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import { useAuthStore } from '../store/authStore';
import { env } from '~/config/env';

const API_BASE_URL = `${env.API_URL}/api`; // Replace with your machine's IP
// const API_BASE_URL = 'http://localhost:3000/api'; // Replace with your machine's IP

// Simple axios instance for unauthenticated requests
const authAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Add retry logic to the unauthenticated client
axiosRetry(authAxios, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error: AxiosError) =>
    axiosRetry.isNetworkError(error) ||
    axiosRetry.isRetryableError(error) ||
    (error.response?.status ? error.response.status >= 500 : false),
});

// Token refresh function (standalone to avoid circular reference)
async function refreshAccessToken(): Promise<string> {
  const { refreshToken, setTokens } = useAuthStore.getState();

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await authAxios.post('/auth/refresh-token', {
    refreshToken,
  });

  const responseData = response.data;
  if (responseData.success) {
    const { accessToken, refreshToken: newRefreshToken } = responseData.data;
    setTokens(accessToken, newRefreshToken);
    return accessToken;
  } else {
    throw new Error(responseData.message || 'Token refresh failed');
  }
}

// Authenticated API client for protected routes
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add retry logic
axiosRetry(apiClient, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error: AxiosError) =>
    axiosRetry.isNetworkError(error) ||
    axiosRetry.isRetryableError(error) ||
    (error.response?.status ? error.response.status >= 500 : false),
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      try {
        const newToken = await refreshAccessToken();
        if (error.config && newToken) {
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return apiClient.request(error.config);
        }
      } catch (refreshError) {
        useAuthStore.getState().signOut();
      }
    }
    return Promise.reject(error);
  }
);

// Export the authenticated API client for reuse
export { apiClient };

// Auth Service
export const authService = {
  async signIn(email: string, password: string): Promise<void> {
    const { setSigningIn, setTokens, setUser, setError } = useAuthStore.getState();

    try {
      setSigningIn(true);
      setError(null);

      const response = await authAxios.post('/auth/login', {
        email,
        password,
      });

      // Handle the response structure properly
      const responseData = response.data;
      if (responseData.success) {
        const { user, accessToken, refreshToken } = responseData.data;
        setTokens(accessToken, refreshToken);
        setUser(user);
      } else {
        throw new Error(responseData.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = this.handleError(error);
      setError(errorMessage);
      throw errorMessage;
    } finally {
      setSigningIn(false);
    }
  },

  async signUp(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<void> {
    const { setSigningUp, setTokens, setUser, setError } = useAuthStore.getState();

    try {
      setSigningUp(true);
      setError(null);

      const response = await authAxios.post('/auth/register', {
        email,
        password,
        firstName,
        lastName,
      });

      // Handle the response structure properly
      const responseData = response.data;
      if (responseData.success) {
        const { user, accessToken, refreshToken } = responseData.data;
        setTokens(accessToken, refreshToken);
        setUser(user);
      } else {
        throw new Error(responseData.message || 'Signup failed');
      }
    } catch (error) {
      const errorMessage = this.handleError(error);
      setError(errorMessage);
      throw errorMessage;
    } finally {
      setSigningUp(false);
    }
  },

  async refreshAccessToken(): Promise<boolean> {
    const { refreshToken, setTokens, signOut } = useAuthStore.getState();

    if (!refreshToken) {
      signOut();
      return false;
    }

    try {
      const response = await authAxios.post('/auth/refresh-token', {
        refreshToken,
      });

      const responseData = response.data;
      if (responseData.success) {
        const { accessToken, refreshToken: newRefreshToken } = responseData.data;
        setTokens(accessToken, newRefreshToken);
      } else {
        throw new Error(responseData.message || 'Token refresh failed');
      }

      return true;
    } catch {
      signOut();
      return false;
    }
  },

  async signOut(): Promise<void> {
    const { accessToken, signOut } = useAuthStore.getState();

    try {
      if (accessToken) {
        await apiClient.post('/auth/logout');
      }
    } catch (error) {
      // Ignore logout errors, still sign out locally
      console.log('Logout error (ignored):', error);
    } finally {
      signOut();
    }
  },

  handleError(error: any): string {
    if (isAxiosError(error)) {
      // Check server response structure
      const responseData = error.response?.data;

      // Handle the new error structure: { error: { message, details }, success: false }
      if (responseData?.error) {
        if (responseData.error.details && Array.isArray(responseData.error.details)) {
          return responseData.error.details.join(', ');
        }
        if (responseData.error.message) {
          return responseData.error.message;
        }
      }

      // Handle old structure
      if (responseData?.message) {
        return responseData.message;
      }
      if (responseData?.details && Array.isArray(responseData.details)) {
        return responseData.details.join(', ');
      }

      const status = error.response?.status;
      if (status === 401) {
        return 'Invalid credentials';
      }
      if (status === 400) {
        return 'Invalid request. Please check your input.';
      }
      if (status && status >= 500) {
        return 'Server error. Please try again later.';
      }
      if (error.code === 'ECONNREFUSED') {
        return 'Unable to connect to server. Please check your connection.';
      }
    }

    // Handle regular Error objects
    if (error instanceof Error) {
      return error.message;
    }

    return 'An unexpected error occurred';
  },
};

export default authService;

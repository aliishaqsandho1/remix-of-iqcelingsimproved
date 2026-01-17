import { apiConfig } from '@/utils/apiConfig';

// Auth types
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  status?: string;
  roles: string[];
}

export interface LoginResponse {
  token?: string;
  user?: User;
  mfa_required?: boolean;
  message?: string;
  lockedUntil?: string;
}

export interface AuthError {
  message: string;
  lockedUntil?: string;
}

// Token storage keys
const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'auth_user';

// Token management
export const tokenManager = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  getUser: (): User | null => {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  setUser: (user: User): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  removeUser: (): void => {
    localStorage.removeItem(USER_KEY);
  },

  clearAuth: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  }
};

// Get authorization header
export const getAuthHeader = (): Record<string, string> => {
  const token = tokenManager.getToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

// Auth API functions
export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const url = `${apiConfig.getBaseUrl()}/login`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      const error: AuthError = {
        message: data.message || 'Login failed',
        lockedUntil: data.lockedUntil,
      };
      throw error;
    }

    // If login successful with token, store credentials
    if (data.token && data.user) {
      tokenManager.setToken(data.token);
      tokenManager.setUser(data.user);
    }

    return data;
  },

  logout: async (): Promise<{ message: string }> => {
    const url = `${apiConfig.getBaseUrl()}/logout`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });

      // Always clear local auth data, even if server call fails
      tokenManager.clearAuth();

      if (!response.ok) {
        // Still return success since we've cleared local auth
        return { message: 'Logged out successfully' };
      }

      return await response.json();
    } catch (error) {
      // Clear auth even on network error
      tokenManager.clearAuth();
      return { message: 'Logged out successfully' };
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const url = `${apiConfig.getBaseUrl()}/me`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      // If unauthorized, clear auth data
      if (response.status === 401) {
        tokenManager.clearAuth();
      }
      const data = await response.json();
      throw new Error(data.message || 'Failed to get user');
    }

    const user = await response.json();
    tokenManager.setUser(user);
    return user;
  },

  // Validate token by calling /me endpoint
  validateToken: async (): Promise<boolean> => {
    try {
      await authApi.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  },
};

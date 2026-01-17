import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, tokenManager, User, LoginResponse, AuthError } from '@/services/authApi';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaRequired: boolean;
  login: (username: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);
  const { toast } = useToast();

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = tokenManager.getToken();
      
      if (token) {
        try {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          // Token invalid or expired
          tokenManager.clearAuth();
          setUser(null);
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await authApi.login(username, password);

      if (response.mfa_required) {
        setMfaRequired(true);
        return response;
      }

      if (response.token && response.user) {
        setUser(response.user);
        setMfaRequired(false);
        toast({
          title: "Welcome back!",
          description: `Logged in as ${response.user.firstName} ${response.user.lastName}`,
        });
      }

      return response;
    } catch (error) {
      const authError = error as AuthError;
      
      // Handle account locked
      if (authError.lockedUntil) {
        const lockedUntil = new Date(authError.lockedUntil);
        toast({
          title: "Account Locked",
          description: `Too many failed attempts. Try again after ${lockedUntil.toLocaleTimeString()}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Failed",
          description: authError.message || "Invalid credentials",
          variant: "destructive",
        });
      }
      
      throw error;
    }
  }, [toast]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
      setUser(null);
      setMfaRequired(false);
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      // Even if logout API fails, clear local state
      setUser(null);
      setMfaRequired(false);
    }
  }, [toast]);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
      tokenManager.clearAuth();
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && !mfaRequired,
    isLoading,
    mfaRequired,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

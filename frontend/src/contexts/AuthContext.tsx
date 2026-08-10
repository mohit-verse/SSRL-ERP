import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User } from '../features/auth/auth.types';
import { useCurrentUserQuery } from '../features/auth/auth.hooks';
import { useQueryClient } from '@tanstack/react-query';
import { AUTH_KEYS } from '../features/auth/auth.hooks';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  hasRole: (role: string | string[]) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'ssrl_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const queryClient = useQueryClient();

  const { data: userResponse, isLoading: isUserLoading, isError } = useCurrentUserQuery(!!token);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = useCallback((newToken: string, userData: User) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    // Pre-populate the cache with the user data from login response
    queryClient.setQueryData(AUTH_KEYS.user, { success: true, message: 'Restored', data: userData });
  }, [queryClient]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    queryClient.removeQueries({ queryKey: AUTH_KEYS.user });
    // Also clear any other cached business data
    queryClient.clear();
  }, [queryClient]);

  // If there's an error fetching the user (e.g. invalid token), logout automatically
  useEffect(() => {
    if (isError && token) {
      logout();
    }
  }, [isError, token, logout]);

  const user = userResponse?.data || null;
  const isAuthenticated = !!user && !!token;
  // If we have a token but no user data yet, we are still loading the session
  const isLoading = (!!token && isUserLoading);

  const hasRole = useCallback((roles: string | string[]) => {
    if (!user) return false;
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    return rolesArray.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

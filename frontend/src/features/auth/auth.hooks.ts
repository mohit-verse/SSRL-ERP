import { useQuery, useMutation } from '@tanstack/react-query';
import { authApi } from './auth.api';

export const AUTH_KEYS = {
  user: ['currentUser'] as const,
};

export const useCurrentUserQuery = (enabled: boolean) => {
  return useQuery({
    queryKey: AUTH_KEYS.user,
    queryFn: authApi.getCurrentUser,
    enabled,
    retry: false,
    staleTime: Infinity, // Keep user data fresh during session
  });
};

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: authApi.login,
  });
};

export const useLogoutMutation = () => {
  return useMutation({
    mutationFn: authApi.logout,
  });
};

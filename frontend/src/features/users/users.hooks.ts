import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from './users.api';

export const USERS_KEYS = {
  all: ['users'] as const,
  list: (params: any) => [...USERS_KEYS.all, 'list', params] as const,
  detail: (id: string) => [...USERS_KEYS.all, 'detail', id] as const,
};

export const useUsersQuery = (params?: any) => {
  return useQuery({
    queryKey: USERS_KEYS.list(params),
    queryFn: () => usersApi.list(params),
  });
};

export const useUserQuery = (id: string) => {
  return useQuery({
    queryKey: USERS_KEYS.detail(id),
    queryFn: () => usersApi.get(id),
    enabled: !!id,
  });
};

export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEYS.all });
    },
  });
};

export const useUpdateUserMutation = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEYS.all });
    },
  });
};

export const useActivateUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEYS.all });
    },
  });
};

export const useDeactivateUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEYS.all });
    },
  });
};

export const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: ({ id, new_password }: { id: string; new_password: string }) => usersApi.resetPassword(id, { new_password }),
  });
};

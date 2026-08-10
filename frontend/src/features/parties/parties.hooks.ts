import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partiesApi, Party } from './parties.api';

export const PARTIES_KEYS = {
  all: ['parties'] as const,
  lists: () => [...PARTIES_KEYS.all, 'list'] as const,
  list: (params: any) => [...PARTIES_KEYS.lists(), params] as const,
  details: () => [...PARTIES_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PARTIES_KEYS.details(), id] as const,
};

export const usePartiesQuery = (params: { page?: number; limit?: number; q?: string; is_active?: boolean }) => {
  return useQuery({
    queryKey: PARTIES_KEYS.list(params),
    queryFn: () => partiesApi.list(params),
  });
};

export const usePartyQuery = (id: string) => {
  return useQuery({
    queryKey: PARTIES_KEYS.detail(id),
    queryFn: () => partiesApi.get(id),
    enabled: !!id,
  });
};

export const useCreatePartyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: partiesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARTIES_KEYS.lists() });
    },
  });
};

export const useUpdatePartyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Party> }) => partiesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PARTIES_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PARTIES_KEYS.detail(variables.id) });
    },
  });
};

export const useActivatePartyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: partiesApi.activate,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: PARTIES_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PARTIES_KEYS.detail(id) });
    },
  });
};

export const useDeactivatePartyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: partiesApi.deactivate,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: PARTIES_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PARTIES_KEYS.detail(id) });
    },
  });
};

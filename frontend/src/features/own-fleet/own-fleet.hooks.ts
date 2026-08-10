import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ownFleetApi, OwnVehicle } from './own-fleet.api';

export const OWN_FLEET_KEYS = {
  all: ['own-fleet'] as const,
  lists: () => [...OWN_FLEET_KEYS.all, 'list'] as const,
  list: (params: any) => [...OWN_FLEET_KEYS.lists(), params] as const,
  details: () => [...OWN_FLEET_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...OWN_FLEET_KEYS.details(), id] as const,
};

export const useOwnFleetQuery = (params: { page?: number; limit?: number; q?: string; status?: string }) => {
  return useQuery({
    queryKey: OWN_FLEET_KEYS.list(params),
    queryFn: () => ownFleetApi.list(params),
  });
};

export const useOwnVehicleQuery = (id: string) => {
  return useQuery({
    queryKey: OWN_FLEET_KEYS.detail(id),
    queryFn: () => ownFleetApi.get(id),
    enabled: !!id,
  });
};

export const useCreateOwnVehicleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ownFleetApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OWN_FLEET_KEYS.lists() });
    },
  });
};

export const useUpdateOwnVehicleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OwnVehicle> }) => ownFleetApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: OWN_FLEET_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: OWN_FLEET_KEYS.detail(variables.id) });
    },
  });
};

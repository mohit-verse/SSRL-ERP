import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleDirectoryApi } from './vehicle-directory.api';

export const VEHICLE_DIR_KEYS = {
  all: ['vehicle-directory'] as const,
  lists: () => [...VEHICLE_DIR_KEYS.all, 'list'] as const,
  list: (params: any) => [...VEHICLE_DIR_KEYS.lists(), params] as const,
  details: () => [...VEHICLE_DIR_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...VEHICLE_DIR_KEYS.details(), id] as const,
  history: (id: string) => [...VEHICLE_DIR_KEYS.detail(id), 'history'] as const,
};

export const useVehicleDirectoryQuery = (params: { page?: number; limit?: number; q?: string; is_active?: boolean }) => {
  return useQuery({
    queryKey: VEHICLE_DIR_KEYS.list(params),
    queryFn: () => vehicleDirectoryApi.list(params),
  });
};

export const useVehicleQuery = (id: string) => {
  return useQuery({
    queryKey: VEHICLE_DIR_KEYS.detail(id),
    queryFn: () => vehicleDirectoryApi.get(id),
    enabled: !!id,
  });
};

export const useVehicleHistoryQuery = (id: string) => {
  return useQuery({
    queryKey: VEHICLE_DIR_KEYS.history(id),
    queryFn: () => vehicleDirectoryApi.getHistory(id),
    enabled: !!id,
    retry: false, // The backend might return 404 if not implemented
  });
};

export const useUpdateVehicleOwnerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { owner_name: string; owner_mobile: string } }) => vehicleDirectoryApi.updateOwner(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: VEHICLE_DIR_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: VEHICLE_DIR_KEYS.detail(variables.id) });
    },
  });
};

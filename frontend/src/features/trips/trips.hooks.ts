import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripsApi } from './trips.api';

export const TRIPS_KEYS = {
  all: ['trips'] as const,
  lists: () => [...TRIPS_KEYS.all, 'list'] as const,
  list: (params: any) => [...TRIPS_KEYS.lists(), params] as const,
  details: () => [...TRIPS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TRIPS_KEYS.details(), id] as const,
  documents: (id: string) => [...TRIPS_KEYS.detail(id), 'documents'] as const,
};

export const useTripsQuery = (params: { page?: number; limit?: number; q?: string; status?: string; vehicle_type?: string }) => {
  return useQuery({
    queryKey: TRIPS_KEYS.list(params),
    queryFn: () => tripsApi.list(params),
  });
};

export const useTripQuery = (id: string) => {
  return useQuery({
    queryKey: TRIPS_KEYS.detail(id),
    queryFn: () => tripsApi.get(id),
    enabled: !!id,
  });
};

export const useCreateTripMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRIPS_KEYS.lists() });
    },
  });
};

export const useUpdateTripMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => tripsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: TRIPS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TRIPS_KEYS.detail(variables.id) });
    },
  });
};

export const useSoftDeleteTripMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripsApi.softDelete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: TRIPS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TRIPS_KEYS.detail(id) });
    },
  });
};

export const useRestoreTripMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripsApi.restore,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: TRIPS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TRIPS_KEYS.detail(id) });
    },
  });
};

export const useAddTripExpenseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => tripsApi.addExpense(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: TRIPS_KEYS.detail(variables.id) });
    },
  });
};

export const useTripDocumentsQuery = (id: string) => {
  return useQuery({
    queryKey: TRIPS_KEYS.documents(id),
    queryFn: () => tripsApi.getDocuments(id),
    enabled: !!id,
    retry: false, // Don't retry if endpoint is missing (404)
  });
};

export const useSaveTripDocumentsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => tripsApi.saveDocuments(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: TRIPS_KEYS.documents(variables.id) });
      queryClient.invalidateQueries({ queryKey: TRIPS_KEYS.detail(variables.id) });
    },
  });
};

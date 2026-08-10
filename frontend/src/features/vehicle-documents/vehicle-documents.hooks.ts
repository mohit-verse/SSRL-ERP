import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleDocumentsApi } from './vehicle-documents.api';

export const VEHICLE_DOCS_KEYS = {
  all: ['vehicle-documents'] as const,
  list: (vehicleId: string) => [...VEHICLE_DOCS_KEYS.all, vehicleId] as const,
};

export const useVehicleDocumentsQuery = (vehicleId: string) => {
  return useQuery({
    queryKey: VEHICLE_DOCS_KEYS.list(vehicleId),
    queryFn: () => vehicleDocumentsApi.list(vehicleId),
    enabled: !!vehicleId,
    retry: false, // The backend might return 404 if not implemented
  });
};

export const useCreateUploadSessionMutation = () => {
  return useMutation({
    mutationFn: vehicleDocumentsApi.createSession,
  });
};

export const useSaveVehicleDocumentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleId, data }: { vehicleId: string; data: any }) => vehicleDocumentsApi.save(vehicleId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: VEHICLE_DOCS_KEYS.list(variables.vehicleId) });
    },
  });
};

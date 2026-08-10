import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from './billing.api';
import { EligibleTripsParams, GenerateBillPayload, CancelBillPayload } from './billing.types';

export const BILLING_KEYS = {
  all: ['bills'] as const,
  lists: () => [...BILLING_KEYS.all, 'list'] as const,
  list: (params: any) => [...BILLING_KEYS.lists(), params] as const,
  details: () => [...BILLING_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...BILLING_KEYS.details(), id] as const,
  eligibleTrips: (params: EligibleTripsParams) => [...BILLING_KEYS.all, 'eligibleTrips', params] as const,
};

export const useEligibleTripsQuery = (params: EligibleTripsParams, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: BILLING_KEYS.eligibleTrips(params),
    queryFn: () => billingApi.getEligibleTrips(params),
    enabled: options?.enabled,
  });
};

export const useBillsQuery = (params: { page?: number; limit?: number; q?: string }) => {
  return useQuery({
    queryKey: BILLING_KEYS.list(params),
    queryFn: () => billingApi.listBills(params),
  });
};

export const useBillQuery = (id: string) => {
  return useQuery({
    queryKey: BILLING_KEYS.detail(id),
    queryFn: () => billingApi.getBill(id),
    enabled: !!id,
  });
};

export const useGenerateBillMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, idempotencyKey }: { payload: GenerateBillPayload; idempotencyKey: string }) => 
      billingApi.generateBill(payload, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ['bills', 'eligibleTrips'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
};

export const useCancelBillMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload, idempotencyKey }: { id: string; payload: CancelBillPayload; idempotencyKey?: string }) => 
      billingApi.cancelBill(id, payload, idempotencyKey),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ['bills', 'eligibleTrips'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
};

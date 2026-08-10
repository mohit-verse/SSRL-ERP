import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from './payments.api';
import { RecordPaymentPayload, CancelPaymentPayload } from './payments.types';

export const PAYMENTS_KEYS = {
  all: ['payments'] as const,
  lists: () => [...PAYMENTS_KEYS.all, 'list'] as const,
  list: (params: any) => [...PAYMENTS_KEYS.lists(), params] as const,
  details: () => [...PAYMENTS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PAYMENTS_KEYS.details(), id] as const,
  outstandings: () => [...PAYMENTS_KEYS.all, 'outstanding'] as const,
  outstanding: (partyId: string) => [...PAYMENTS_KEYS.outstandings(), partyId] as const,
};

export const usePaymentsQuery = (params: { page?: number; limit?: number; q?: string }) => {
  return useQuery({
    queryKey: PAYMENTS_KEYS.list(params),
    queryFn: () => paymentsApi.listPayments(params),
  });
};

export const usePaymentQuery = (id: string) => {
  return useQuery({
    queryKey: PAYMENTS_KEYS.detail(id),
    queryFn: () => paymentsApi.getPayment(id),
    enabled: !!id,
  });
};

export const useOutstandingQuery = (partyId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: PAYMENTS_KEYS.outstanding(partyId),
    queryFn: () => paymentsApi.getOutstanding(partyId),
    enabled: options?.enabled,
  });
};

export const useCreatePaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, idempotencyKey }: { payload: RecordPaymentPayload; idempotencyKey: string }) => 
      paymentsApi.recordPayment(payload, idempotencyKey),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PAYMENTS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PAYMENTS_KEYS.outstanding(variables.payload.partyId) });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
};

export const useCancelPaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload, idempotencyKey }: { id: string; payload: CancelPaymentPayload; idempotencyKey: string }) => 
      paymentsApi.cancelPayment(id, payload, idempotencyKey),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: PAYMENTS_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: PAYMENTS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PAYMENTS_KEYS.outstanding(data.data.party_id) });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
};

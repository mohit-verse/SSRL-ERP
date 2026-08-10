import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from './submissions.api';
import { CreateSubmissionPayload, ReissueSubmissionPayload } from './submissions.types';

export const SUBMISSIONS_KEYS = {
  all: ['submissions'] as const,
  lists: () => [...SUBMISSIONS_KEYS.all, 'list'] as const,
  list: (params: any) => [...SUBMISSIONS_KEYS.lists(), params] as const,
  details: () => [...SUBMISSIONS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...SUBMISSIONS_KEYS.details(), id] as const,
  eligibleBills: (partyId: string) => [...SUBMISSIONS_KEYS.all, 'eligibleBills', partyId] as const,
};

export const useEligibleBillsQuery = (partyId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: SUBMISSIONS_KEYS.eligibleBills(partyId),
    queryFn: () => submissionsApi.getEligibleBills(partyId),
    enabled: options?.enabled,
  });
};

export const useSubmissionsQuery = (params: { page?: number; limit?: number; q?: string }) => {
  return useQuery({
    queryKey: SUBMISSIONS_KEYS.list(params),
    queryFn: () => submissionsApi.listSubmissions(params),
  });
};

export const useSubmissionQuery = (id: string) => {
  return useQuery({
    queryKey: SUBMISSIONS_KEYS.detail(id),
    queryFn: () => submissionsApi.getSubmission(id),
    enabled: !!id,
  });
};

export const useCreateSubmissionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, idempotencyKey }: { payload: CreateSubmissionPayload; idempotencyKey: string }) => 
      submissionsApi.createSubmission(payload, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBMISSIONS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ['submissions', 'eligibleBills'] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
};

export const useReissueSubmissionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload, idempotencyKey }: { id: string; payload: ReissueSubmissionPayload; idempotencyKey: string }) => 
      submissionsApi.reissueSubmission(id, payload, idempotencyKey),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SUBMISSIONS_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: SUBMISSIONS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ['submissions', 'eligibleBills'] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
};

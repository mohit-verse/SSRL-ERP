import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { numberSequencesApi } from './number-sequences.api';

export const NUMBER_SEQUENCES_KEYS = {
  all: ['number-sequences'] as const,
  current: () => [...NUMBER_SEQUENCES_KEYS.all, 'current'] as const,
  preview: (key: string, params: any) => [...NUMBER_SEQUENCES_KEYS.all, 'preview', key, params] as const,
};

export const useCurrentSequencesQuery = () => {
  return useQuery({
    queryKey: NUMBER_SEQUENCES_KEYS.current(),
    queryFn: () => numberSequencesApi.getCurrentSequences(),
  });
};

export const usePreviewNumberQuery = (sequenceKey: string, params: { entityId?: string }, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: NUMBER_SEQUENCES_KEYS.preview(sequenceKey, params),
    queryFn: () => numberSequencesApi.previewNextNumber(sequenceKey, params),
    enabled: options?.enabled,
  });
};

export const useResetSequencesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: numberSequencesApi.resetSequences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NUMBER_SEQUENCES_KEYS.all });
    },
  });
};

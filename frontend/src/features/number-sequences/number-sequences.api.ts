import { apiClient } from '../../api/client';
import { NumberSequence } from './number-sequences.types';

export const numberSequencesApi = {
  getCurrentSequences: async () => {
    const response = await apiClient.get<{ success: boolean; data: NumberSequence[] }>('/number-sequences/current');
    return response.data;
  },

  previewNextNumber: async (sequenceKey: string, params: { entityId?: string }) => {
    const response = await apiClient.get<{ success: boolean; data: { nextNumber: string } }>(`/number-sequences/preview/${sequenceKey}`, { params });
    return response.data;
  },

  resetSequences: async (data: { financialYearId: string }) => {
    const response = await apiClient.post<{ success: boolean; data: any }>('/number-sequences/reset', data);
    return response.data;
  },
};

import { apiClient } from '../../api/client';
import { Submission, CreateSubmissionPayload, ReissueSubmissionPayload } from './submissions.types';
import { Bill } from '../billing/billing.types';
import { PaginatedResponse } from '../billing/billing.api';

export const submissionsApi = {
  getEligibleBills: async (party_id: string) => {
    const response = await apiClient.get<{ success: boolean; data: Bill[] }>('/submissions/eligible-bills', {
      params: { party_id }
    });
    return response.data;
  },

  createSubmission: async (payload: CreateSubmissionPayload, idempotencyKey: string) => {
    const response = await apiClient.post<{ success: boolean; data: Submission }>('/submissions', payload, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
    return response.data;
  },

  listSubmissions: async (params: { page?: number; limit?: number; q?: string }) => {
    const response = await apiClient.get<PaginatedResponse<Submission>>('/submissions', { params });
    return response.data;
  },

  getSubmission: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: Submission }>(`/submissions/${id}`);
    return response.data;
  },

  reissueSubmission: async (id: string, payload: ReissueSubmissionPayload, idempotencyKey: string) => {
    const response = await apiClient.post<{ success: boolean; data: Submission }>(`/submissions/${id}/reissue`, payload, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
    return response.data;
  },
};

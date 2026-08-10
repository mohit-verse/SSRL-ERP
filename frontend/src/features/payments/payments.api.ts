import { apiClient } from '../../api/client';
import { Payment, OutstandingResponse, RecordPaymentPayload, CancelPaymentPayload } from './payments.types';
import { PaginatedResponse } from '../billing/billing.api';

export const paymentsApi = {
  recordPayment: async (payload: RecordPaymentPayload, idempotencyKey: string) => {
    const response = await apiClient.post<{ success: boolean; data: Payment }>('/payments', payload, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
    return response.data;
  },

  listPayments: async (params: { page?: number; limit?: number; q?: string }) => {
    const response = await apiClient.get<PaginatedResponse<Payment>>('/payments', { params });
    return response.data;
  },

  getPayment: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: Payment }>(`/payments/${id}`);
    return response.data;
  },

  getOutstanding: async (partyId: string) => {
    const response = await apiClient.get<{ success: boolean; data: OutstandingResponse }>(`/payments/outstanding/${partyId}`);
    return response.data;
  },

  cancelPayment: async (id: string, payload: CancelPaymentPayload, idempotencyKey: string) => {
    const response = await apiClient.post<{ success: boolean; data: Payment }>(`/payments/${id}/cancel`, payload, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
    return response.data;
  },
};

import { apiClient } from '../../api/client';
import { Bill, GenerateBillPayload, CancelBillPayload, EligibleTripsParams, BillsQueryParams } from './billing.types';
import { Trip } from '../trips/trips.types';

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    data: T[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  }
}

export const billingApi = {
  getEligibleTrips: async (params: EligibleTripsParams) => {
    const response = await apiClient.get<{ success: boolean; data: Trip[] }>('/bills/eligible-trips', { params });
    return response.data;
  },

  generateBill: async (payload: GenerateBillPayload, idempotencyKey: string) => {
    const response = await apiClient.post<{ success: boolean; data: Bill }>('/bills/generate', payload, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
    return response.data;
  },

  listBills: async (params: BillsQueryParams) => {
    const response = await apiClient.get<PaginatedResponse<Bill>>('/bills', { params });
    return response.data;
  },

  getBill: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: Bill }>(`/bills/${id}`);
    return response.data;
  },

  cancelBill: async (id: string, payload: CancelBillPayload, idempotencyKey?: string) => {
    const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined;
    const response = await apiClient.post<{ success: boolean; data: Bill }>(`/bills/${id}/cancel`, payload, {
      headers,
    });
    return response.data;
  },
};

import { apiClient } from '../../api/client';
import { ExportPayload } from './reports.types';

export const reportsApi = {
  getMonthlyTripRegister: async (params: { year: number; month: number }) => {
    const response = await apiClient.get<{ success: boolean; data: any }>('/reports/monthly-trip-register', { params });
    return response.data;
  },

  getPartyLedger: async (params: { id: string; startDate?: string; endDate?: string }) => {
    const response = await apiClient.get<{ success: boolean; data: any }>('/reports/party-ledger', { params });
    return response.data;
  },

  getVehicleOwnerLedger: async (params: { id: string; startDate?: string; endDate?: string }) => {
    const response = await apiClient.get<{ success: boolean; data: any }>('/reports/vehicle-owner-ledger', { params });
    return response.data;
  },

  getOutstandingReport: async () => {
    const response = await apiClient.get<{ success: boolean; data: any }>('/reports/outstanding');
    return response.data;
  },

  getPendingPODReport: async () => {
    const response = await apiClient.get<{ success: boolean; data: any }>('/reports/pending-pod');
    return response.data;
  },

  getFinancialSummary: async (params: { year: number; month: number }) => {
    const response = await apiClient.get<{ success: boolean; data: any }>('/reports/financial-summary', { params });
    return response.data;
  },

  getProfitSummary: async (params: { year: number; month: number }) => {
    const response = await apiClient.get<{ success: boolean; data: any }>('/reports/profit-summary', { params });
    return response.data;
  },

  exportReport: async (payload: ExportPayload) => {
    const response = await apiClient.post('/reports/export', payload, {
      responseType: 'blob', // Important for file download
    });
    return response.data; // This will be a blob
  },
};

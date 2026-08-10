import { apiClient } from '../../api/client';
import { FinancialYear } from './financial-years.types';

export const financialYearsApi = {
  list: async () => {
    const response = await apiClient.get<{ success: boolean; data: FinancialYear[] }>('/financial-years');
    return response.data;
  },

  get: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: FinancialYear }>(`/financial-years/${id}`);
    return response.data;
  },

  create: async (data: Partial<FinancialYear>) => {
    const response = await apiClient.post<{ success: boolean; data: FinancialYear }>('/financial-years', data);
    return response.data;
  },

  update: async (id: string, data: Partial<FinancialYear>) => {
    const response = await apiClient.put<{ success: boolean; data: FinancialYear }>(`/financial-years/${id}`, data);
    return response.data;
  },

  activate: async (id: string) => {
    const response = await apiClient.post<{ success: boolean; data: FinancialYear }>(`/financial-years/${id}/activate`);
    return response.data;
  },
};

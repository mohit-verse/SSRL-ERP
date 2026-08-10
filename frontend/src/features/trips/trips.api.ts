import { apiClient } from '../../api/client';
import { Trip, TripExpense, TripDocument } from './trips.types';

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

export const tripsApi = {
  list: async (params: { page?: number; limit?: number; q?: string; status?: string; vehicle_type?: string }) => {
    const response = await apiClient.get<PaginatedResponse<Trip>>('/trips', { params });
    return response.data;
  },
  get: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: Trip }>(`/trips/${id}`);
    return response.data;
  },
  create: async (data: Partial<Trip>) => {
    const response = await apiClient.post<{ success: boolean; data: Trip }>('/trips', data);
    return response.data;
  },
  update: async (id: string, data: Partial<Trip>) => {
    const response = await apiClient.put<{ success: boolean; data: Trip }>(`/trips/${id}`, data);
    return response.data;
  },
  softDelete: async (id: string) => {
    const response = await apiClient.delete<{ success: boolean; data: null }>(`/trips/${id}`);
    return response.data;
  },
  restore: async (id: string) => {
    const response = await apiClient.post<{ success: boolean; data: null }>(`/trips/${id}/restore`);
    return response.data;
  },
  addExpense: async (id: string, data: Partial<TripExpense>) => {
    const response = await apiClient.post<{ success: boolean; data: TripExpense }>(`/trips/${id}/expenses`, data);
    return response.data;
  },
  
  // These are documented in API.md but not present in the backend codebase
  getDocuments: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: TripDocument[] }>(`/trips/${id}/documents`);
    return response.data;
  },
  saveDocuments: async (id: string, data: any) => {
    const response = await apiClient.post<{ success: boolean; data: any }>(`/trips/${id}/documents`, data);
    return response.data;
  },
  deleteDocument: async (documentId: string) => {
    const response = await apiClient.delete<{ success: boolean; data: null }>(`/trip-documents/${documentId}`);
    return response.data;
  },
};

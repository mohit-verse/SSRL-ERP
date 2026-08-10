import { apiClient } from '../../api/client';
import { PaginatedResponse } from '../parties/parties.api';

export interface VehicleDirectory {
  id: string;
  vehicle_number: string;
  owner_name: string;
  owner_mobile: string;
  is_active: boolean;
  created_at: string;
}

export const vehicleDirectoryApi = {
  list: async (params: { page?: number; limit?: number; q?: string; is_active?: boolean }) => {
    const response = await apiClient.get<PaginatedResponse<VehicleDirectory>>('/vehicle-directory', { params });
    return response.data;
  },
  get: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: VehicleDirectory }>(`/vehicle-directory/${id}`);
    return response.data;
  },
  updateOwner: async (id: string, data: { owner_name: string; owner_mobile: string }) => {
    const response = await apiClient.put<{ success: boolean; data: VehicleDirectory }>(`/vehicle-directory/${id}`, data);
    return response.data;
  },
  getHistory: async (id: string) => {
    // API contract docs specify this endpoint for history
    const response = await apiClient.get<{ success: boolean; data: any[] }>(`/vehicle-directory/${id}/history`);
    return response.data;
  }
};

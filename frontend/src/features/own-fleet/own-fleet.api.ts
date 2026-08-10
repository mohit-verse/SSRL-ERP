import { apiClient } from '../../api/client';
import { PaginatedResponse } from '../parties/parties.api';

export interface OwnVehicle {
  id: string;
  vehicle_number: string;
  vehicle_type?: string | null;
  brand?: string | null;
  model?: string | null;
  manufacturing_year?: number | null;
  chassis_number?: string | null;
  engine_number?: string | null;
  registration_date?: string | null;
  purchase_date?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SOLD';
  created_at: string;
}

export const ownFleetApi = {
  list: async (params: { page?: number; limit?: number; q?: string; status?: string }) => {
    const response = await apiClient.get<PaginatedResponse<OwnVehicle>>('/own-fleet', { params });
    return response.data;
  },
  get: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: OwnVehicle }>(`/own-fleet/${id}`);
    return response.data;
  },
  create: async (data: Partial<OwnVehicle>) => {
    const response = await apiClient.post<{ success: boolean; data: OwnVehicle }>('/own-fleet', data);
    return response.data;
  },
  update: async (id: string, data: Partial<OwnVehicle>) => {
    const response = await apiClient.put<{ success: boolean; data: OwnVehicle }>(`/own-fleet/${id}`, data);
    return response.data;
  }
};

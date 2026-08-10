import { apiClient } from '../../api/client';

export interface Party {
  id: string;
  party_name: string;
  party_type: 'MARKET' | 'COMPANY';
  gst_number?: string | null;
  contact_person?: string | null;
  mobile?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  billing_type?: 'INDIVIDUAL' | 'CONSOLIDATED' | null;
  payment_type?: 'STANDARD' | 'BULK' | null;
  is_active: boolean;
  created_at: string;
}

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

export const partiesApi = {
  list: async (params: { page?: number; limit?: number; q?: string; is_active?: boolean }) => {
    const response = await apiClient.get<PaginatedResponse<Party>>('/parties', { params });
    return response.data;
  },
  get: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: Party }>(`/parties/${id}`);
    return response.data;
  },
  create: async (data: Partial<Party>) => {
    const response = await apiClient.post<{ success: boolean; data: Party }>('/parties', data);
    return response.data;
  },
  update: async (id: string, data: Partial<Party>) => {
    const response = await apiClient.put<{ success: boolean; data: Party }>(`/parties/${id}`, data);
    return response.data;
  },
  activate: async (id: string) => {
    const response = await apiClient.post(`/parties/${id}/activate`);
    return response.data;
  },
  deactivate: async (id: string) => {
    const response = await apiClient.post(`/parties/${id}/deactivate`);
    return response.data;
  }
};

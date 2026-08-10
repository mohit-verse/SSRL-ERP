import { apiClient } from '../../api/client';
import { User, UserListResponse } from './users.types';

export const usersApi = {
  list: async (params?: any) => {
    const response = await apiClient.get<UserListResponse>('/users', { params });
    return response.data;
  },

  get: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: User }>(`/users/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post<{ success: boolean; data: User }>('/users', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.put<{ success: boolean; data: User }>(`/users/${id}`, data);
    return response.data;
  },

  activate: async (id: string) => {
    const response = await apiClient.post<{ success: boolean }>(`/users/${id}/activate`);
    return response.data;
  },

  deactivate: async (id: string) => {
    const response = await apiClient.post<{ success: boolean }>(`/users/${id}/deactivate`);
    return response.data;
  },

  resetPassword: async (id: string, data: { new_password: string }) => {
    const response = await apiClient.post<{ success: boolean }>(`/users/${id}/reset-password`, data);
    return response.data;
  },
};

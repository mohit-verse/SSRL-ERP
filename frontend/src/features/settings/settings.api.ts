import { apiClient } from '../../api/client';
import { Setting } from './settings.types';

export const settingsApi = {
  list: async () => {
    const response = await apiClient.get<{ success: boolean; data: Setting[] }>('/settings');
    return response.data;
  },

  get: async (key: string) => {
    const response = await apiClient.get<{ success: boolean; data: Setting }>(`/settings/${key}`);
    return response.data;
  },

  create: async (data: Partial<Setting>) => {
    const response = await apiClient.post<{ success: boolean; data: Setting }>('/settings', data);
    return response.data;
  },

  update: async (key: string, data: { setting_value?: string | null; description?: string | null }) => {
    const response = await apiClient.put<{ success: boolean; data: Setting }>(`/settings/${key}`, data);
    return response.data;
  },
};

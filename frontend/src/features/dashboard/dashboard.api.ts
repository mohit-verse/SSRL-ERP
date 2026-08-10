import { apiClient } from '../../api/client';
import { DashboardData } from './dashboard.types';

export const dashboardApi = {
  getDashboard: async () => {
    const response = await apiClient.get<{ success: boolean; data: DashboardData }>('/dashboard');
    return response.data;
  },
};

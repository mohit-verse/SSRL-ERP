import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from './dashboard.api';

export const DASHBOARD_KEYS = {
  all: ['dashboard'] as const,
};

export const useDashboardQuery = () => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.all,
    queryFn: () => dashboardApi.getDashboard(),
    staleTime: 60 * 1000, // 1 minute
  });
};

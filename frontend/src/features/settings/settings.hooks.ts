import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from './settings.api';

export const SETTINGS_KEYS = {
  all: ['settings'] as const,
  list: () => [...SETTINGS_KEYS.all, 'list'] as const,
  detail: (key: string) => [...SETTINGS_KEYS.all, 'detail', key] as const,
};

export const useSettingsQuery = () => {
  return useQuery({
    queryKey: SETTINGS_KEYS.list(),
    queryFn: () => settingsApi.list(),
  });
};

export const useSettingQuery = (key: string) => {
  return useQuery({
    queryKey: SETTINGS_KEYS.detail(key),
    queryFn: () => settingsApi.get(key),
    enabled: !!key,
  });
};

export const useCreateSettingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.all });
    },
  });
};

export const useUpdateSettingMutation = (key: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { setting_value?: string | null; description?: string | null }) => settingsApi.update(key, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.all });
    },
  });
};

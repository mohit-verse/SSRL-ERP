import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialYearsApi } from './financial-years.api';

export const FINANCIAL_YEARS_KEYS = {
  all: ['financial-years'] as const,
  list: () => [...FINANCIAL_YEARS_KEYS.all, 'list'] as const,
  detail: (id: string) => [...FINANCIAL_YEARS_KEYS.all, 'detail', id] as const,
};

export const useFinancialYearsQuery = () => {
  return useQuery({
    queryKey: FINANCIAL_YEARS_KEYS.list(),
    queryFn: () => financialYearsApi.list(),
  });
};

export const useFinancialYearQuery = (id: string) => {
  return useQuery({
    queryKey: FINANCIAL_YEARS_KEYS.detail(id),
    queryFn: () => financialYearsApi.get(id),
    enabled: !!id,
  });
};

export const useCreateFinancialYearMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: financialYearsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCIAL_YEARS_KEYS.all });
    },
  });
};

export const useUpdateFinancialYearMutation = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => financialYearsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCIAL_YEARS_KEYS.all });
    },
  });
};

export const useActivateFinancialYearMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financialYearsApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCIAL_YEARS_KEYS.all });
    },
  });
};

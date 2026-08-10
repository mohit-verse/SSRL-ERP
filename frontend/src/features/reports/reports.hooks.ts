import { useQuery, useMutation } from '@tanstack/react-query';
import { reportsApi } from './reports.api';
import { ExportPayload } from './reports.types';

export const REPORTS_KEYS = {
  all: ['reports'] as const,
  monthlyTripRegister: (params: any) => [...REPORTS_KEYS.all, 'monthly-trip-register', params] as const,
  partyLedger: (params: any) => [...REPORTS_KEYS.all, 'party-ledger', params] as const,
  vehicleOwnerLedger: (params: any) => [...REPORTS_KEYS.all, 'vehicle-owner-ledger', params] as const,
  outstanding: () => [...REPORTS_KEYS.all, 'outstanding'] as const,
  pendingPod: () => [...REPORTS_KEYS.all, 'pending-pod'] as const,
  financialSummary: (params: any) => [...REPORTS_KEYS.all, 'financial-summary', params] as const,
  profitSummary: (params: any) => [...REPORTS_KEYS.all, 'profit-summary', params] as const,
};

export const useMonthlyTripRegisterQuery = (params: { year: number; month: number }, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: REPORTS_KEYS.monthlyTripRegister(params),
    queryFn: () => reportsApi.getMonthlyTripRegister(params),
    enabled: options?.enabled !== false,
  });
};

export const usePartyLedgerQuery = (params: { id: string; startDate?: string; endDate?: string }, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: REPORTS_KEYS.partyLedger(params),
    queryFn: () => reportsApi.getPartyLedger(params),
    enabled: options?.enabled,
  });
};

export const useVehicleOwnerLedgerQuery = (params: { id: string; startDate?: string; endDate?: string }, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: REPORTS_KEYS.vehicleOwnerLedger(params),
    queryFn: () => reportsApi.getVehicleOwnerLedger(params),
    enabled: options?.enabled,
  });
};

export const useOutstandingReportQuery = () => {
  return useQuery({
    queryKey: REPORTS_KEYS.outstanding(),
    queryFn: () => reportsApi.getOutstandingReport(),
  });
};

export const usePendingPodReportQuery = () => {
  return useQuery({
    queryKey: REPORTS_KEYS.pendingPod(),
    queryFn: () => reportsApi.getPendingPODReport(),
  });
};

export const useFinancialSummaryQuery = (params: { year: number; month: number }, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: REPORTS_KEYS.financialSummary(params),
    queryFn: () => reportsApi.getFinancialSummary(params),
    enabled: options?.enabled !== false,
  });
};

export const useProfitSummaryQuery = (params: { year: number; month: number }, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: REPORTS_KEYS.profitSummary(params),
    queryFn: () => reportsApi.getProfitSummary(params),
    enabled: options?.enabled !== false,
  });
};

export const useExportReportMutation = () => {
  return useMutation({
    mutationFn: (payload: ExportPayload) => reportsApi.exportReport(payload),
  });
};

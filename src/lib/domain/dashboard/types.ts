export interface TripKpiMetrics {
  totalTrips: number;
  planned: number;
  inTransit: number;
  delivered: number;
  settled: number;
  cancelled: number;
}

export interface FinancialKpiMetrics {
  partyReceivables: number;
  vehicleOwnerPayables: number;
  pendingUnsettledPayments: number;
  currentFyFreight: number;
}

export interface MasterDataKpiMetrics {
  totalParties: number;
  totalVehicleOwners: number;
  totalVehicles: number;
  totalDrivers: number;
}

export interface DocumentControlKpiMetrics {
  failedDocuments: number;
  activeDocuments: number;
  outdatedBills: number;
  attentionItemsCount: number;
  alerts: string[];
}

export interface ExecutiveDashboardMetrics {
  trips: TripKpiMetrics;
  financials: FinancialKpiMetrics;
  masters: MasterDataKpiMetrics;
  controls: DocumentControlKpiMetrics;
  timestamp: string;
}

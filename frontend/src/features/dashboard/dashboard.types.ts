export interface DashboardKPICards {
  monthlyRevenue: number;
  monthlyExpense: number;
  monthlyProfit: number;
  totalOutstanding: number;
}

export interface DashboardData {
  kpiCards: DashboardKPICards;
  todaysTrips: any[];
  pendingPOD: any[];
  billsPendingSubmission: any[];
  outstandingPayments: any[];
  documentAlerts: any[];
  recentActivity: any[];
}

import { ReportingEngine } from '../reporting-engine/reporting.engine';

export class DashboardService {
  static async getDashboardData() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const [
      revenue,
      expense,
      profit,
      outstanding,
      todaysTrips,
      pendingPOD,
      billsPendingSubmission,
      outstandingPayments,
      documentAlerts,
      recentActivity,
    ] = await Promise.all([
      ReportingEngine.getMonthlyRevenue(year, month),
      ReportingEngine.getMonthlyExpense(year, month),
      ReportingEngine.getMonthlyProfit(year, month),
      ReportingEngine.getTotalOutstanding(),
      ReportingEngine.getTodaysTrips(),
      ReportingEngine.getPendingPOD(),
      ReportingEngine.getBillsPendingSubmission(),
      ReportingEngine.getOutstandingPayments(),
      ReportingEngine.getVehicleDocumentAlerts(),
      ReportingEngine.getRecentActivity(10),
    ]);

    return {
      kpiCards: {
        monthlyRevenue: revenue,
        monthlyExpense: expense,
        monthlyProfit: profit,
        totalOutstanding: outstanding,
      },
      todaysTrips,
      pendingPOD,
      billsPendingSubmission,
      outstandingPayments,
      documentAlerts,
      recentActivity,
    };
  }
}

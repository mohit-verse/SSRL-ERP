import { ReportingEngine } from '../reporting-engine/reporting.engine';

export class ReportsService {
  static async getMonthlyTripRegister(year: number, month: number) {
    return ReportingEngine.getMonthlyTripRegister(year, month);
  }

  static async getPartyLedger(partyId: string, startDate?: Date, endDate?: Date) {
    return ReportingEngine.getPartyLedger(partyId, startDate, endDate);
  }

  static async getVehicleOwnerLedger(ownerMobile: string, startDate?: Date, endDate?: Date) {
    return ReportingEngine.getVehicleOwnerLedger(ownerMobile, startDate, endDate);
  }

  static async getOutstandingReport() {
    return ReportingEngine.getOutstandingReport();
  }

  static async getPendingPODReport() {
    return ReportingEngine.getPendingPODReport();
  }

  static async getFinancialSummary(year: number, month: number) {
    return ReportingEngine.getFinancialSummary(year, month);
  }

  static async getProfitSummary(year: number, month: number) {
    return ReportingEngine.getProfitSummary(year, month);
  }
}

export interface ExportPayload {
  reportType: 'MONTHLY_TRIPS' | 'PARTY_LEDGER' | 'VEHICLE_OWNER_LEDGER' | 'OUTSTANDING_REPORT' | 'PENDING_POD' | 'FINANCIAL_SUMMARY' | 'PROFIT_SUMMARY';
  format: 'EXCEL' | 'PDF';
  filters?: any;
}

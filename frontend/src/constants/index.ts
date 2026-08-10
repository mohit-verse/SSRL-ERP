export const APP_CONFIG = {
  name: 'SSRL ERP',
  version: '1.0.0',
};

export const ROUTES = {
  PUBLIC: {
    LOGIN: '/login',
  },
  PROTECTED: {
    DASHBOARD: '/',
    TRIPS: '/trips',
    BILLING: '/billing',
    BILLS: '/bills',
    PAYMENTS: '/payments',
    PAYMENTS_CREATE: '/payments/new',
    REPORTS: '/reports',
    REPORTS_MONTHLY_TRIPS: '/reports/monthly-trip-register',
    REPORTS_PARTY_LEDGER: '/reports/party-ledger',
    REPORTS_VEHICLE_OWNER_LEDGER: '/reports/vehicle-owner-ledger',
    REPORTS_OUTSTANDING: '/reports/outstanding',
    REPORTS_PENDING_POD: '/reports/pending-pod',
    REPORTS_FINANCIAL_SUMMARY: '/reports/financial-summary',
    REPORTS_PROFIT_SUMMARY: '/reports/profit-summary',
    SETTINGS: '/settings',
    MASTER_DATA: '/master-data',
    MASTER_DATA_PARTIES: '/master-data/parties',
    MASTER_DATA_VEHICLE_DIRECTORY: '/master-data/vehicle-directory',
    MASTER_DATA_OWN_FLEET: '/master-data/own-fleet',
    SUBMISSIONS: '/submissions',
    SUBMISSIONS_CREATE: '/submissions/create',
  }
};

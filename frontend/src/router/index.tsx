import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { NotFoundPage } from '../pages/NotFoundPage';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';

// Master Data Pages
import { PartiesListPage } from '../pages/parties/PartiesListPage';
import { PartyCreatePage } from '../pages/parties/PartyCreatePage';
import { PartyEditPage } from '../pages/parties/PartyEditPage';
import { VehicleDirectoryListPage } from '../pages/vehicle-directory/VehicleDirectoryListPage';
import { VehicleDetailsPage } from '../pages/vehicle-directory/VehicleDetailsPage';
import { OwnFleetListPage } from '../pages/own-fleet/OwnFleetListPage';
import { OwnVehicleCreatePage } from '../pages/own-fleet/OwnVehicleCreatePage';
import { OwnVehicleEditPage } from '../pages/own-fleet/OwnVehicleEditPage';
import { OwnVehicleDetailsPage } from '../pages/own-fleet/OwnVehicleDetailsPage';

// Trips Pages
import { TripsListPage } from '../pages/trips/TripsListPage';
import { TripCreatePage } from '../pages/trips/TripCreatePage';
import { TripEditPage } from '../pages/trips/TripEditPage';
import { TripDetailsPage } from '../pages/trips/TripDetailsPage';

// Billing Pages
import { BillingPage } from '../pages/billing/BillingPage';
import { BillsListPage } from '../pages/billing/BillsListPage';
import { BillDetailsPage } from '../pages/billing/BillDetailsPage';

// Submissions Pages
import { SubmissionsPage } from '../pages/submissions/SubmissionsPage';
import { SubmissionsListPage } from '../pages/submissions/SubmissionsListPage';
import { SubmissionDetailsPage } from '../pages/submissions/SubmissionDetailsPage';

// Payments Pages
import { PaymentsPage } from '../pages/payments/PaymentsPage';
import { PaymentsListPage } from '../pages/payments/PaymentsListPage';
import { PaymentDetailsPage } from '../pages/payments/PaymentDetailsPage';

// Reports Pages
import { ReportsPage } from '../pages/reports/ReportsPage';
import { MonthlyTripRegisterPage } from '../pages/reports/MonthlyTripRegisterPage';
import { PartyLedgerPage } from '../pages/reports/PartyLedgerPage';
import { VehicleOwnerLedgerPage } from '../pages/reports/VehicleOwnerLedgerPage';
import { OutstandingReportPage } from '../pages/reports/OutstandingReportPage';
import { PendingPodReportPage } from '../pages/reports/PendingPodReportPage';
import { FinancialSummaryPage } from '../pages/reports/FinancialSummaryPage';
import { ProfitSummaryPage } from '../pages/reports/ProfitSummaryPage';

// Settings Pages
import { SettingsHubPage } from '../pages/settings/SettingsHubPage';
import { UsersListPage } from '../pages/settings/users/UsersListPage';
import { UserDetailsPage } from '../pages/settings/users/UserDetailsPage';
import { UserFormPage } from '../pages/settings/users/UserFormPage';
import { FinancialYearsPage } from '../pages/settings/financial-years/FinancialYearsPage';
import { NumberSequencesPage } from '../pages/settings/number-sequences/NumberSequencesPage';
import { SystemSettingsPage } from '../pages/settings/system/SystemSettingsPage';


export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      {
        path: '',
        element: <LoginPage />
      }
    ]
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />
      },
      // Master Data - Parties
      { path: 'master-data/parties', element: <PartiesListPage /> },
      { path: 'master-data/parties/new', element: <PartyCreatePage /> },
      { path: 'master-data/parties/:id', element: <PartyEditPage /> },
      
      // Master Data - Vehicle Directory
      { path: 'master-data/vehicle-directory', element: <VehicleDirectoryListPage /> },
      { path: 'master-data/vehicle-directory/:id', element: <VehicleDetailsPage /> },
      
      // Master Data - Own Fleet
      { path: 'master-data/own-fleet', element: <OwnFleetListPage /> },
      { path: 'master-data/own-fleet/new', element: <OwnVehicleCreatePage /> },
      { path: 'master-data/own-fleet/:id/edit', element: <OwnVehicleEditPage /> },
      { path: 'master-data/own-fleet/:id', element: <OwnVehicleDetailsPage /> },
      
      // Trips
      { path: 'trips', element: <TripsListPage /> },
      { path: 'trips/new', element: <TripCreatePage /> },
      { path: 'trips/:id', element: <TripDetailsPage /> },
      { path: 'trips/:id/edit', element: <TripEditPage /> },

      // Billing
      { path: 'billing', element: <BillingPage /> },
      { path: 'bills', element: <BillsListPage /> },
      { path: 'bills/:id', element: <BillDetailsPage /> },

      // Payments
      { path: 'payments/new', element: <PaymentsPage /> },
      { path: 'payments', element: <PaymentsListPage /> },
      { path: 'payments/:id', element: <PaymentDetailsPage /> },

      // Reports
      { path: 'reports', element: <ReportsPage /> },
      { path: 'reports/monthly-trip-register', element: <MonthlyTripRegisterPage /> },
      { path: 'reports/party-ledger', element: <PartyLedgerPage /> },
      { path: 'reports/vehicle-owner-ledger', element: <VehicleOwnerLedgerPage /> },
      { path: 'reports/outstanding', element: <OutstandingReportPage /> },
      { path: 'reports/pending-pod', element: <PendingPodReportPage /> },
      { path: 'reports/financial-summary', element: <FinancialSummaryPage /> },
      { path: 'reports/profit-summary', element: <ProfitSummaryPage /> },

      // Settings (Administration)
      { path: 'settings', element: <SettingsHubPage /> },
      { path: 'settings/users', element: <UsersListPage /> },
      { path: 'settings/users/new', element: <UserFormPage /> },
      { path: 'settings/users/:id', element: <UserDetailsPage /> },
      { path: 'settings/users/:id/edit', element: <UserFormPage /> },
      { path: 'settings/financial-years', element: <FinancialYearsPage /> },
      { path: 'settings/number-sequences', element: <NumberSequencesPage /> },
      { path: 'settings/system', element: <SystemSettingsPage /> },

      // Submissions
      { path: 'submissions/create', element: <SubmissionsPage /> },
      { path: 'submissions', element: <SubmissionsListPage /> },
      { path: 'submissions/:id', element: <SubmissionDetailsPage /> },
    ]
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
]);

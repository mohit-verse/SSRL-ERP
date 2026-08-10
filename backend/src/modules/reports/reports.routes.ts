import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { monthlyReportSchema, ledgerReportSchema, exportReportSchema } from './reports.validation';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER));

router.get(
  '/monthly-trip-register',
  validateRequest(monthlyReportSchema),
  ReportsController.getMonthlyTripRegister,
);
router.get('/party-ledger', validateRequest(ledgerReportSchema), ReportsController.getPartyLedger);
router.get(
  '/vehicle-owner-ledger',
  validateRequest(ledgerReportSchema),
  ReportsController.getVehicleOwnerLedger,
);
router.get('/outstanding', ReportsController.getOutstandingReport);
router.get('/pending-pod', ReportsController.getPendingPODReport);
router.get(
  '/financial-summary',
  validateRequest(monthlyReportSchema),
  ReportsController.getFinancialSummary,
);
router.get(
  '/profit-summary',
  validateRequest(monthlyReportSchema),
  ReportsController.getProfitSummary,
);

// API-042, API-043 Generic export
router.post('/export', validateRequest(exportReportSchema), ReportsController.exportReport);
// Generating generic report (JSON)
router.post('/generate', validateRequest(exportReportSchema), ReportsController.exportReport);

export default router;

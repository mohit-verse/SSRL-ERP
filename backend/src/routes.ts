import { Router } from 'express';
import usersRoutes from './modules/users/users.routes';
import settingsRoutes from './modules/settings/settings.routes';
import financialYearsRoutes from './modules/financial-years/financial-years.routes';
import numberSequencesRoutes from './modules/number-sequences/number-sequences.routes';
import uploadsRoutes from './modules/uploads/uploads.routes';
import partiesRoutes from './modules/parties/parties.routes';
import vehicleDirectoryRoutes from './modules/vehicle-directory/vehicle-directory.routes';
import ownFleetRoutes from './modules/own-fleet/own-fleet.routes';
import tripsRoutes from './modules/trips/trips.routes';
import billingRoutes from './modules/billing/billing.routes';
import submissionsRoutes from './modules/submissions/submissions.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import reportsRoutes from './modules/reports/reports.routes';

const router = Router();

router.use('/users', usersRoutes);
router.use('/settings', settingsRoutes);
router.use('/financial-years', financialYearsRoutes);
router.use('/number-sequences', numberSequencesRoutes);
router.use('/uploads', uploadsRoutes);
router.use('/parties', partiesRoutes);
router.use('/vehicle-directory', vehicleDirectoryRoutes);
router.use('/own-fleet', ownFleetRoutes);
router.use('/trips', tripsRoutes);
router.use('/bills', billingRoutes);
router.use('/submissions', submissionsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportsRoutes);

export default router;

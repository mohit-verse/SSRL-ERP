import { Router } from 'express';
import { BillingController } from './billing.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { idempotency } from '../../middleware/idempotency.middleware';
import { getEligibleTripsSchema, generateBillSchema, cancelBillSchema } from './billing.validation';
import { UserRole } from '@prisma/client';

const router = Router();

// According to requirements: SUPER_ADMIN, ADMIN, USER can access billing
router.use(authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER));

router.get(
  '/eligible-trips',
  validateRequest(getEligibleTripsSchema),
  BillingController.getEligibleTrips,
);
router.post(
  '/generate',
  idempotency,
  validateRequest(generateBillSchema),
  BillingController.generateBill,
);
router.get('/', BillingController.list);
router.get('/:id', BillingController.get);
router.post('/:id/cancel', validateRequest(cancelBillSchema), BillingController.cancel);

export default router;

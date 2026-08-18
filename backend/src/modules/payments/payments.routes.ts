import { Router } from 'express';
import { PaymentsController } from './payments.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { idempotency } from '../../middleware/idempotency.middleware';
import { recordPaymentSchema, cancelPaymentSchema } from './payments.validation';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER, UserRole.CA));

router.post(
  '/',
  idempotency,
  validateRequest(recordPaymentSchema),
  PaymentsController.recordPayment,
);
router.get('/', PaymentsController.list);
router.get('/outstanding/:partyId', PaymentsController.getOutstanding);
router.get('/:id', PaymentsController.get);
router.post(
  '/:id/cancel',
  idempotency,
  validateRequest(cancelPaymentSchema),
  PaymentsController.cancel,
);

export default router;

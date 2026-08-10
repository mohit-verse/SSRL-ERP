import { Router } from 'express';
import { SubmissionsController } from './submissions.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { idempotency } from '../../middleware/idempotency.middleware';
import {
  getEligibleBillsSchema,
  createSubmissionSchema,
  reissueSubmissionSchema,
} from './submissions.validation';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER));

router.get(
  '/eligible-bills',
  validateRequest(getEligibleBillsSchema),
  SubmissionsController.getEligibleBills,
);
router.post(
  '/',
  idempotency,
  validateRequest(createSubmissionSchema),
  SubmissionsController.create,
);
router.get('/', SubmissionsController.list);
router.get('/:id', SubmissionsController.get);
router.post(
  '/:id/reissue',
  idempotency,
  validateRequest(reissueSubmissionSchema),
  SubmissionsController.reissue,
);

export default router;

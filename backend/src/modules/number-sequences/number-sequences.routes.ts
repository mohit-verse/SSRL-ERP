import { Router } from 'express';
import { NumberSequencesController } from './number-sequences.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { previewNumberSchema, resetSequencesSchema } from './number-sequences.validation';
import { UserRole } from '@prisma/client';

const router = Router();

// Only SUPER_ADMIN can manage sequences
router.use(authenticate, authorize(UserRole.SUPER_ADMIN));

router.get('/current', NumberSequencesController.getCurrentSequences);
router.get(
  '/preview/:sequenceKey',
  validateRequest(previewNumberSchema),
  NumberSequencesController.previewNextNumber,
);
router.post(
  '/reset',
  validateRequest(resetSequencesSchema),
  NumberSequencesController.resetSequences,
);

export default router;

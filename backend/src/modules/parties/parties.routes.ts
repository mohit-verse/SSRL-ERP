import { Router } from 'express';
import { PartiesController } from './parties.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { createPartySchema, updatePartySchema } from './parties.validation';
import { UserRole } from '@prisma/client';

const router = Router();

// Only Super Admin & Admin can manage parties
router.use(authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CA));

router.post('/', validateRequest(createPartySchema), PartiesController.create);
router.get('/', PartiesController.list);
router.get('/:id', PartiesController.get);
router.put('/:id', validateRequest(updatePartySchema), PartiesController.update);

router.post('/:id/activate', PartiesController.activate);
router.post('/:id/deactivate', PartiesController.deactivate);

export default router;

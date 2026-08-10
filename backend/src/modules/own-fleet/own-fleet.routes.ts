import { Router } from 'express';
import { OwnFleetController } from './own-fleet.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { createOwnVehicleSchema, updateOwnVehicleSchema } from './own-fleet.validation';
import { UserRole } from '@prisma/client';

const router = Router();

// Only Super Admin & Admin can manage master data
router.use(authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN));

router.post('/', validateRequest(createOwnVehicleSchema), OwnFleetController.create);
router.get('/', OwnFleetController.list);
router.get('/:id', OwnFleetController.get);
router.put('/:id', validateRequest(updateOwnVehicleSchema), OwnFleetController.update);

export default router;

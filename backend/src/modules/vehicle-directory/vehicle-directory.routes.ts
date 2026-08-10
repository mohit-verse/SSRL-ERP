import { Router } from 'express';
import { VehicleDirectoryController } from './vehicle-directory.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { updateVehicleDirectorySchema } from './vehicle-directory.validation';
import { UserRole } from '@prisma/client';

const router = Router();

// Only Super Admin & Admin can manage master data
router.use(authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN));

router.get('/', VehicleDirectoryController.list);
router.get('/:id', VehicleDirectoryController.get);
router.put(
  '/:id',
  validateRequest(updateVehicleDirectorySchema),
  VehicleDirectoryController.update,
);
router.get('/:id/history', VehicleDirectoryController.getHistory);

export default router;

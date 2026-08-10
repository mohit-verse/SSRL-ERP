import { Router } from 'express';
import { SettingsController } from './settings.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { createSettingSchema, updateSettingSchema } from './settings.validation';
import { UserRole } from '@prisma/client';

const router = Router();

// Only SUPER_ADMIN can manage settings
router.use(authenticate, authorize(UserRole.SUPER_ADMIN));

router.get('/', SettingsController.list);
router.get('/:key', SettingsController.get);
router.post('/', validateRequest(createSettingSchema), SettingsController.create);
router.put('/:key', validateRequest(updateSettingSchema), SettingsController.update);

export default router;

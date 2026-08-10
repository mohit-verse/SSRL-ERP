import { Router } from 'express';
import { UsersController } from './users.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { createUserSchema, updateUserSchema, resetPasswordSchema } from './users.validation';
import { UserRole } from '@prisma/client';

const router = Router();

// Only SUPER_ADMIN can manage users
router.use(authenticate, authorize(UserRole.SUPER_ADMIN));

router.post('/', validateRequest(createUserSchema), UsersController.create);
router.get('/', UsersController.list);
router.get('/:id', UsersController.get);
router.put('/:id', validateRequest(updateUserSchema), UsersController.update);

router.post('/:id/activate', UsersController.activate);
router.post('/:id/deactivate', UsersController.deactivate);
router.post(
  '/:id/reset-password',
  validateRequest(resetPasswordSchema),
  UsersController.resetPassword,
);

export default router;

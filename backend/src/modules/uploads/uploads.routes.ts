import { Router } from 'express';
import { UploadsController } from './uploads.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { createUploadSessionSchema } from './uploads.validation';
import { UserRole } from '@prisma/client';

const router = Router();

// Secure session requires authentication and authorization
router.use(authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER, UserRole.CA));

router.post(
  '/session',
  validateRequest(createUploadSessionSchema),
  UploadsController.createSession,
);

export default router;

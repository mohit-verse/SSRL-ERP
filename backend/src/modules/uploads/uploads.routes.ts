import { Router } from 'express';
import { UploadsController } from './uploads.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { createUploadSessionSchema } from './uploads.validation';

const router = Router();

// Secure session requires authentication
router.use(authenticate);

router.post(
  '/session',
  validateRequest(createUploadSessionSchema),
  UploadsController.createSession,
);

export default router;

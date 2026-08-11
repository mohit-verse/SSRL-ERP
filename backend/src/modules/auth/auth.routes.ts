import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { loginSchema } from './auth.validation';

const router = Router();

router.post('/login', validateRequest(loginSchema), AuthController.login);
router.get('/me', authenticate, AuthController.me);
router.post('/logout', authenticate, AuthController.logout);

export default router;

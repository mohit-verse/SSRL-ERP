import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER, UserRole.CA));
router.get('/', DashboardController.getDashboard);

export default router;

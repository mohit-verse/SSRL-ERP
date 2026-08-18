import { Router } from 'express';
import { TripsController } from './trips.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { createTripSchema, updateTripSchema, createExpenseSchema } from './trips.validation';
import { UserRole } from '@prisma/client';

const router = Router();

// According to API.md: SUPER_ADMIN, ADMIN, USER can access trips
router.use(authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER, UserRole.CA));

router.post('/', validateRequest(createTripSchema), TripsController.create);
router.get('/', TripsController.list);
router.get('/:id', TripsController.get);
router.put('/:id', validateRequest(updateTripSchema), TripsController.update);
router.delete('/:id', TripsController.softDelete);
router.post('/:id/restore', TripsController.restore);

router.post('/:id/expenses', validateRequest(createExpenseSchema), TripsController.addExpense);

export default router;

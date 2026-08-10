import { Router } from 'express';
import { FinancialYearsController } from './financial-years.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { createFinancialYearSchema, updateFinancialYearSchema } from './financial-years.validation';
import { UserRole } from '@prisma/client';

const router = Router();

// Only SUPER_ADMIN can manage financial years
router.use(authenticate, authorize(UserRole.SUPER_ADMIN));

router.post('/', validateRequest(createFinancialYearSchema), FinancialYearsController.create);
router.get('/', FinancialYearsController.list);
router.get('/:id', FinancialYearsController.get);
router.put('/:id', validateRequest(updateFinancialYearSchema), FinancialYearsController.update);

router.post('/:id/activate', FinancialYearsController.activate);

export default router;

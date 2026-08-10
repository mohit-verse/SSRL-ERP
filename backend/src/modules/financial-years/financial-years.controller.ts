import { Request, Response, NextFunction } from 'express';
import { FinancialYearsService } from './financial-years.service';
import * as responseHelper from '../../utils/response';

export class FinancialYearsController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const fy = await FinancialYearsService.createFinancialYear(req.body);
      return responseHelper.created(res, fy, 'Financial Year created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const fys = await FinancialYearsService.listFinancialYears();
      return responseHelper.success(res, fys, 'Financial Years retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const fy = await FinancialYearsService.getFinancialYear(req.params.id);
      return responseHelper.success(res, fy, 'Financial Year retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const fy = await FinancialYearsService.updateFinancialYear(req.params.id, req.body);
      return responseHelper.success(res, fy, 'Financial Year updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async activate(req: Request, res: Response, next: NextFunction) {
    try {
      await FinancialYearsService.activateFinancialYear(req.params.id);
      return responseHelper.success(res, null, 'Financial Year activated successfully');
    } catch (error) {
      next(error);
    }
  }
}

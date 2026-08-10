import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import * as responseHelper from '../../utils/response';

export class DashboardController {
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await DashboardService.getDashboardData();
      return responseHelper.success(res, data, 'Dashboard data retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

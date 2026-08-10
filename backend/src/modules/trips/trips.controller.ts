import { Request, Response, NextFunction } from 'express';
import { TripsService } from './trips.service';
import * as responseHelper from '../../utils/response';
import { getPaginationOptions, buildPaginatedResult } from '../../utils/pagination';

export class TripsController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const trip = await TripsService.createTrip(req.body, req.user!.userId);
      return responseHelper.created(res, trip, 'Trip created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { skip, take } = getPaginationOptions(page, limit);
      const query = (req.query.q as string) || '';

      const { data, total } = await TripsService.listTrips(query, skip, take);
      const result = buildPaginatedResult(data, total, page, limit);

      return responseHelper.success(res, result, 'Trips retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const trip = await TripsService.getTrip(req.params.id);
      return responseHelper.success(res, trip, 'Trip retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const trip = await TripsService.updateTrip(req.params.id, req.body, req.user!.userId);
      return responseHelper.success(res, trip, 'Trip updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async addExpense(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await TripsService.addExpense(req.params.id, req.body, req.user!.userId);
      return responseHelper.success(res, result, 'Expense added successfully');
    } catch (error) {
      next(error);
    }
  }

  static async softDelete(req: Request, res: Response, next: NextFunction) {
    try {
      await TripsService.softDelete(req.params.id);
      return responseHelper.success(res, null, 'Trip deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async restore(req: Request, res: Response, next: NextFunction) {
    try {
      await TripsService.restore(req.params.id);
      return responseHelper.success(res, null, 'Trip restored successfully');
    } catch (error) {
      next(error);
    }
  }
}

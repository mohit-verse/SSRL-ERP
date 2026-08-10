import { Request, Response, NextFunction } from 'express';
import { VehicleDirectoryService } from './vehicle-directory.service';
import * as responseHelper from '../../utils/response';
import { getPaginationOptions, buildPaginatedResult } from '../../utils/pagination';

export class VehicleDirectoryController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { skip, take } = getPaginationOptions(page, limit);
      const query = (req.query.q as string) || '';

      const { data, total } = await VehicleDirectoryService.listVehicles(query, skip, take);
      const result = buildPaginatedResult(data, total, page, limit);

      return responseHelper.success(res, result, 'Vehicles retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicle = await VehicleDirectoryService.getVehicle(req.params.id);
      return responseHelper.success(res, vehicle, 'Vehicle retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicle = await VehicleDirectoryService.updateOwner(req.params.id, req.body);
      return responseHelper.success(res, vehicle, 'Vehicle owner updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const history = await VehicleDirectoryService.getVehicleHistory(req.params.id);
      return responseHelper.success(res, history, 'Vehicle history retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

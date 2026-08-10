import { Request, Response, NextFunction } from 'express';
import { OwnFleetService } from './own-fleet.service';
import * as responseHelper from '../../utils/response';
import { getPaginationOptions, buildPaginatedResult } from '../../utils/pagination';
import { VehicleStatus } from '@prisma/client';

export class OwnFleetController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicle = await OwnFleetService.createVehicle(req.body);
      return responseHelper.created(res, vehicle, 'Vehicle created successfully');
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
      const status = req.query.status as VehicleStatus | undefined;

      const { data, total } = await OwnFleetService.listVehicles(query, skip, take, status);
      const result = buildPaginatedResult(data, total, page, limit);

      return responseHelper.success(res, result, 'Vehicles retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicle = await OwnFleetService.getVehicle(req.params.id);
      return responseHelper.success(res, vehicle, 'Vehicle retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicle = await OwnFleetService.updateVehicle(req.params.id, req.body);
      return responseHelper.success(res, vehicle, 'Vehicle updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

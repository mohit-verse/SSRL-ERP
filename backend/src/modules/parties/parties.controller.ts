import { Request, Response, NextFunction } from 'express';
import { PartiesService } from './parties.service';
import * as responseHelper from '../../utils/response';
import { getPaginationOptions, buildPaginatedResult } from '../../utils/pagination';

export class PartiesController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const party = await PartiesService.createParty(req.body);
      return responseHelper.created(res, party, 'Party created successfully');
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

      let isActive: boolean | undefined;
      if (req.query.is_active === 'true') isActive = true;
      if (req.query.is_active === 'false') isActive = false;

      const { data, total } = await PartiesService.listParties(query, skip, take, isActive);
      const result = buildPaginatedResult(data, total, page, limit);

      return responseHelper.success(res, result, 'Parties retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const party = await PartiesService.getParty(req.params.id);
      return responseHelper.success(res, party, 'Party retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const party = await PartiesService.updateParty(req.params.id, req.body);
      return responseHelper.success(res, party, 'Party updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async activate(req: Request, res: Response, next: NextFunction) {
    try {
      await PartiesService.updateStatus(req.params.id, true);
      return responseHelper.success(res, null, 'Party activated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      await PartiesService.updateStatus(req.params.id, false);
      return responseHelper.success(res, null, 'Party deactivated successfully');
    } catch (error) {
      next(error);
    }
  }
}

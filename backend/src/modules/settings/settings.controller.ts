import { Request, Response, NextFunction } from 'express';
import { SettingsService } from './settings.service';
import * as responseHelper from '../../utils/response';

export class SettingsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.listSettings();
      // Optionally group by category
      const grouped = settings.reduce(
        (acc, curr) => {
          if (!acc[curr.category]) acc[curr.category] = [];
          acc[curr.category].push(curr);
          return acc;
        },
        {} as Record<string, typeof settings>,
      );

      return responseHelper.success(res, grouped, 'Settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const setting = await SettingsService.getSetting(req.params.key);
      return responseHelper.success(res, setting, 'Setting retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const setting = await SettingsService.createSetting(req.body, userId);
      return responseHelper.created(res, setting, 'Setting created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const setting = await SettingsService.updateSetting(req.params.key, req.body, userId);
      return responseHelper.success(res, setting, 'Setting updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

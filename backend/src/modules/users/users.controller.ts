import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import * as responseHelper from '../../utils/response';
import { UserStatus } from '@prisma/client';

export class UsersController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UsersService.createUser(req.body);
      return responseHelper.created(res, user, 'User created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await UsersService.listUsers();
      return responseHelper.success(res, users, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UsersService.getUser(req.params.id);
      return responseHelper.success(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UsersService.updateUser(req.params.id, req.body);
      return responseHelper.success(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async activate(req: Request, res: Response, next: NextFunction) {
    try {
      await UsersService.updateStatus(req.params.id, UserStatus.ACTIVE);
      return responseHelper.success(res, null, 'User activated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      await UsersService.updateStatus(req.params.id, UserStatus.INACTIVE);
      return responseHelper.success(res, null, 'User deactivated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await UsersService.resetPassword(req.params.id, req.body.new_password);
      return responseHelper.success(res, null, 'Password reset successfully');
    } catch (error) {
      next(error);
    }
  }
}

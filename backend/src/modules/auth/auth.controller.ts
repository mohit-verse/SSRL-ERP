import { Request, Response, NextFunction } from 'express';
import { UsersRepository } from '../users/users.repository';
import { verifyPassword, generateToken } from '../../utils/auth';
import * as responseHelper from '../../utils/response';
import { AuthenticationError } from '../../utils/errors';
import { UserStatus } from '@prisma/client';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const user = await UsersRepository.findByUsername(username);

      if (!user) {
        throw new AuthenticationError('Invalid username or password');
      }

      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) {
        throw new AuthenticationError('Invalid username or password');
      }

      if (user.status !== UserStatus.ACTIVE) {
        throw new AuthenticationError('User account is inactive');
      }

      const token = generateToken({
        userId: user.id,
        role: user.role
      });

      return responseHelper.success(res, {
        accessToken: token,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          role: user.role,
          status: user.status
        }
      }, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const user = await UsersRepository.findById(req.user.userId);
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      if (user.status !== UserStatus.ACTIVE) {
        throw new AuthenticationError('User account is inactive');
      }

      return responseHelper.success(res, {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        status: user.status
      }, 'User profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      return responseHelper.success(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/auth';
import { AuthenticationError, AuthorizationError } from '../utils/errors';

// Extend Express Request to include user
declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenPayload;
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('Authentication required'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    next(new AuthenticationError('Invalid or expired token'));
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    const isCA = req.user.role === 'CA';
    const isAllowedRole = allowedRoles.includes(req.user.role);

    if (!isAllowedRole) {
      return next(new AuthorizationError('Insufficient permissions'));
    }

    if (isCA) {
      const isReadOperation = ['GET', 'OPTIONS'].includes(req.method);
      // specific non-mutation POST operations that the CA can access
      const isAllowedPost = req.method === 'POST' && (req.baseUrl.includes('/reports/') || req.baseUrl.includes('/auth/'));

      if (!isReadOperation && !isAllowedPost) {
        return next(new AuthorizationError('CA users are not allowed to perform mutations'));
      }
    }

    next();
  };
};

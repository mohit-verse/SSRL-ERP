import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config/env';
import * as responseHelper from '../utils/response';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const globalErrorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error processing request ${req.method} ${req.path}`, err);

  if (err instanceof ValidationError) {
    return responseHelper.validationError(res, err.errors, err.message);
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: [],
    });
  }

  // Handle expected ORM errors here if necessary, or just internal error
  const message =
    config.env === 'development'
      ? err instanceof Error
        ? err.message
        : 'Unknown error'
      : 'Internal Server Error';
  return responseHelper.internalError(res, message);
};

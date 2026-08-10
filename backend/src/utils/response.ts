import { Response } from 'express';

export const success = (
  res: Response,
  data: unknown = {},
  message: string = 'Operation completed successfully.',
  statusCode: number = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const created = (
  res: Response,
  data: unknown = {},
  message: string = 'Resource created successfully.',
) => {
  return success(res, data, message, 201);
};

export const validationError = (
  res: Response,
  errors: unknown[] = [],
  message: string = 'Validation failed.',
) => {
  return res.status(400).json({
    success: false,
    message,
    errors,
  });
};

export const unauthorized = (res: Response, message: string = 'Unauthorized') => {
  return res.status(401).json({
    success: false,
    message,
    errors: [],
  });
};

export const forbidden = (res: Response, message: string = 'Forbidden') => {
  return res.status(403).json({
    success: false,
    message,
    errors: [],
  });
};

export const notFound = (res: Response, message: string = 'Not Found') => {
  return res.status(404).json({
    success: false,
    message,
    errors: [],
  });
};

export const conflict = (res: Response, message: string = 'Conflict') => {
  return res.status(409).json({
    success: false,
    message,
    errors: [],
  });
};

export const businessError = (res: Response, message: string = 'Business Rule Violation') => {
  return res.status(422).json({
    success: false,
    message,
    errors: [],
  });
};

export const internalError = (res: Response, message: string = 'Internal Server Error') => {
  return res.status(500).json({
    success: false,
    message,
    errors: [],
  });
};

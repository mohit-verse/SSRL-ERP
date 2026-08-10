import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import { BusinessError } from '../utils/errors';

export const idempotency = async (req: Request, res: Response, next: NextFunction) => {
  const idempotencyKey = req.header('Idempotency-Key');
  if (!idempotencyKey) {
    return next(new BusinessError('Idempotency-Key header is required for this operation'));
  }

  try {
    const existingKey = await prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey },
    });

    if (existingKey) {
      if (existingKey.response_body && existingKey.response_status) {
        return res.status(existingKey.response_status).json(existingKey.response_body);
      }
      throw new BusinessError(
        'Concurrent request with same Idempotency-Key is currently processing',
      );
    }

    // Create idempotency record
    await prisma.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        request_path: req.originalUrl,
      },
    });

    // Intercept res.json to save the response body
    const originalJson = res.json.bind(res);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res.json = (body: any) => {
      prisma.idempotencyKey
        .update({
          where: { key: idempotencyKey },
          data: {
            response_body: body,
            response_status: res.statusCode,
          },
        })
        .catch((err) => console.error('Failed to update idempotency key:', err));

      return originalJson(body);
    };

    next();
  } catch (error) {
    next(error);
  }
};

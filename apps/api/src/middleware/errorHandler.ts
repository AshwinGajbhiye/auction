import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors';
import { logger } from '../shared/logger';
import { config } from '../config';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(config.env !== 'production' && err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Prisma unique constraint violation
  if ((err as any)?.code === 'P2002') {
    res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: 'A record with these details already exists.' },
    });
    return;
  }

  logger.error('Unhandled error', { err, path: req.path, method: req.method });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
    },
  });
}

import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../shared/errors';
import { UserRole } from '@campusloop/shared';

/** Require a valid session */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.session?.userId) {
    throw new UnauthorizedError();
  }
  next();
}

/** Require a specific role (or higher) */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.session?.userId) throw new UnauthorizedError();
    if (!roles.includes(req.session.userRole as UserRole)) {
      throw new ForbiddenError();
    }
    next();
  };
}

/** Require email verification */
export function requireVerified(req: Request, _res: Response, next: NextFunction): void {
  if (!req.session?.userId) throw new UnauthorizedError();
  if (!req.session.emailVerified) {
    throw new ForbiddenError('Please verify your email address before continuing.');
  }
  next();
}

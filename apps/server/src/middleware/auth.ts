import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './errorHandler';
import { UserRole } from '@online-chess/shared';

export interface AuthJwtPayload {
  userId: string;
  username: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthJwtPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'Vui lòng đăng nhập để tiếp tục (Unauthorized)');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthJwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    throw new AppError(401, 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ');
  }
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthJwtPayload;
    req.user = decoded;
  } catch {
    // ignore invalid token for optional auth
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, 'Yêu cầu xác thực người dùng');
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'Bạn không có quyền thực hiện hành động này (Forbidden)');
    }

    next();
  };
}

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError || err?.name === 'ZodError' || Array.isArray(err?.issues)) {
    const issues = err.issues || err.errors || [];
    res.status(400).json({
      success: false,
      message: 'Dữ liệu đầu vào không hợp lệ (Validation Error)',
      errors: issues.map((e: any) => ({
        path: Array.isArray(e.path) ? e.path.join('.') : String(e.path),
        message: e.message,
      })),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
    return;
  }

  logger.error(err, 'Unhandled Server Error');

  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Đã xảy ra lỗi máy chủ nội bộ'
        : err.message,
  });
}

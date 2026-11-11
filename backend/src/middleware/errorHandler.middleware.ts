import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  logger.error(`[${req.method}] ${req.url} -> Error: ${message}`, {
    stack: err.stack,
    details: err.details,
    body: req.body,
    ip: req.ip,
  });

  ApiResponse.error({
    res,
    statusCode,
    code,
    message,
    details: process.env.NODE_ENV === 'development' ? err.details || err.stack : undefined,
  });
};

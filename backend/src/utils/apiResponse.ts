import { Response } from 'express';

export interface ApiResponseOptions<T> {
  res: Response;
  statusCode?: number;
  message?: string;
  data?: T;
  meta?: Record<string, any>;
}

export interface ApiErrorOptions {
  res: Response;
  statusCode?: number;
  message: string;
  code?: string;
  details?: any;
}

export class ApiResponse {
  static success<T>({
    res,
    statusCode = 200,
    message = 'Success',
    data,
    meta,
  }: ApiResponseOptions<T>) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      ...(meta && { meta }),
    });
  }

  static error({
    res,
    statusCode = 500,
    message = 'Internal Server Error',
    code = 'INTERNAL_ERROR',
    details,
  }: ApiErrorOptions) {
    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    });
  }
}

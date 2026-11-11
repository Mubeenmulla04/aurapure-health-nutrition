import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const isTest = process.env.NODE_ENV === 'test';

export const globalRateLimiter = isTest
  ? (_req: any, _res: any, next: any) => next()
  : rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX_REQUESTS,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP. Please try again after 15 minutes.',
        },
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

export const authRateLimiter = isTest
  ? (_req: any, _res: any, next: any) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: {
        success: false,
        error: {
          code: 'AUTH_RATE_LIMIT_EXCEEDED',
          message: 'Too many authentication attempts. Please try again in 15 minutes.',
        },
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

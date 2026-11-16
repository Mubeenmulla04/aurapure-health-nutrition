import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const isTest = env.NODE_ENV === 'test';
const isDev = env.NODE_ENV === 'development';

export const globalRateLimiter = isTest
  ? (_req: any, _res: any, next: any) => next()
  : rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: isDev ? 1000 : env.RATE_LIMIT_MAX_REQUESTS,
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
      max: isDev ? 200 : 10,
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

export const otpSendRateLimiter = isTest
  ? (_req: any, _res: any, next: any) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: isDev ? 200 : 5,
      message: {
        success: false,
        error: {
          code: 'OTP_RATE_LIMIT_EXCEEDED',
          message: 'Too many OTP requests from this network. Please wait 15 minutes before requesting again.',
        },
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

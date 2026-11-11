import { Request, Response, NextFunction } from 'express';
import { TokenUtils, TokenPayload } from '../utils/tokens.js';
import { ApiResponse } from '../utils/apiResponse.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ApiResponse.error({
        res,
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Authentication token missing or invalid',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = TokenUtils.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error: any) {
    ApiResponse.error({
      res,
      statusCode: 401,
      code: 'TOKEN_EXPIRED_OR_INVALID',
      message: 'Your session has expired. Please log in again.',
    });
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = TokenUtils.verifyAccessToken(token);
      req.user = payload;
    }
  } catch (error) {
    // Intentionally ignored: request continues as guest
  }
  next();
};

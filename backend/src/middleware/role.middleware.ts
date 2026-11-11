import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse.js';

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ApiResponse.error({
        res,
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      ApiResponse.error({
        res,
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'You do not have permission to perform this action',
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin']);

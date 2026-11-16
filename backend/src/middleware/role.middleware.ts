import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse.js';
import { Role } from '../models/role.model.js';

export const STAFF_ROLES = [
  'super_admin',
  'admin',
  'order_manager',
  'product_manager',
  'inventory_manager',
  'support_manager',
  'marketing_manager',
];

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

export const requireStaff = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    ApiResponse.error({
      res,
      statusCode: 401,
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
    return;
  }

  if (!STAFF_ROLES.includes(req.user.role)) {
    ApiResponse.error({
      res,
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'Staff access required',
    });
    return;
  }

  next();
};

export const requireAdmin = requireRole(['super_admin', 'admin']);
export const requireSuperAdmin = requireRole(['super_admin']);

/**
 * Granular permission middleware
 * Allows super_admin and admin automatically, or checks Role permissions array.
 */
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      ApiResponse.error({
        res,
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    if (req.user.role === 'super_admin' || req.user.role === 'admin') {
      return next();
    }

    try {
      const roleDoc = await Role.findOne({ name: req.user.role });
      if (roleDoc && (roleDoc.permissions.includes('*') || roleDoc.permissions.includes(permission))) {
        return next();
      }

      ApiResponse.error({
        res,
        statusCode: 403,
        code: 'FORBIDDEN',
        message: `Missing required permission: ${permission}`,
      });
    } catch (error) {
      ApiResponse.error({
        res,
        statusCode: 500,
        code: 'PERMISSION_CHECK_FAILED',
        message: 'Failed to verify user permissions',
      });
    }
  };
};

import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class AdminController {
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.getDashboardOverview();
      ApiResponse.success({ res, data });
    } catch (error) {
      next(error);
    }
  }

  static async listOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, search, page, limit } = req.query;
      const data = await AdminService.listOrders({
        status: status as string,
        search: search as string,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 15,
      });
      ApiResponse.success({ res, data });
    } catch (error) {
      next(error);
    }
  }

  static async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const order = await AdminService.updateOrderStatus(req.params.id as string, status, req.user!.userId);
      ApiResponse.success({ res, message: 'Order status updated.', data: { order } });
    } catch (error) {
      next(error);
    }
  }

  static async listInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const inventory = await AdminService.listInventory();
      ApiResponse.success({ res, data: { inventory } });
    } catch (error) {
      next(error);
    }
  }

  static async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { changeQty, reason } = req.body;
      const inventory = await AdminService.adjustStock(
        req.params.id as string,
        Number(changeQty),
        reason || 'Manual Admin Adjustment',
        req.user!.userId
      );
      ApiResponse.success({ res, message: 'Stock adjusted.', data: { inventory } });
    } catch (error) {
      next(error);
    }
  }

  static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await AdminService.createProduct(req.body, req.user!.userId);
      ApiResponse.success({ res, statusCode: 201, message: 'Product created successfully.', data: { product } });
    } catch (error) {
      next(error);
    }
  }
}

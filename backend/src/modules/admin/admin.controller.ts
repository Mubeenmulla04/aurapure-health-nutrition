import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class AdminController {
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const range = (req.query.range as string) || '7d';
      const data = await AdminService.getDashboardOverview(range);
      ApiResponse.success({ res, data });
    } catch (error) {
      next(error);
    }
  }

  static async exportSalesCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const range = (req.query.range as string) || '30d';
      const csv = await AdminService.exportSalesReport(range);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="aurapure-sales-report-${range}.csv"`);
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}

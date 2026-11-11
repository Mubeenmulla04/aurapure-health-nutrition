import { Request, Response, NextFunction } from 'express';
import { CategoryService } from './category.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class CategoryController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await CategoryService.listAll();
      ApiResponse.success({ res, data: { categories } });
    } catch (error) {
      next(error);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CategoryService.getBySlug(req.params.slug as string);
      ApiResponse.success({ res, data: { category } });
    } catch (error) {
      next(error);
    }
  }
}

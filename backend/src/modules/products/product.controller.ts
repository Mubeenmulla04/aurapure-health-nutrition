import { Request, Response, NextFunction } from 'express';
import { ProductService } from './product.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class ProductController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, minPrice, maxPrice, flavor, sort, page, limit } = req.query;

      const result = await ProductService.listProducts({
        categorySlug: category as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        flavor: flavor as string,
        sort: sort as any,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      ApiResponse.success({
        res,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getFeatured(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await ProductService.getFeaturedProducts();
      ApiResponse.success({
        res,
        data: { products },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ProductService.getProductBySlug(req.params.slug as string);
      ApiResponse.success({
        res,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

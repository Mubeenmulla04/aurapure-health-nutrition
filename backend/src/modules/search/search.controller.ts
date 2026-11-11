import { Request, Response, NextFunction } from 'express';
import { Product } from '../../models/product.model.js';
import { ProductVariant } from '../../models/productVariant.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class SearchController {
  static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const q = (req.query.q as string || '').trim();
      if (!q || q.length < 2) {
        ApiResponse.success({ res, data: { products: [], query: q } });
        return;
      }

      // Regex search across title, subtitle, and ingredients
      const regex = new RegExp(q, 'i');
      const products = await Product.find({
        isActive: true,
        $or: [{ title: regex }, { subtitle: regex }, { ingredients: regex }],
      })
        .populate('categoryId', 'name slug')
        .limit(10);

      const enriched = await Promise.all(
        products.map(async (prod) => {
          const variants = await ProductVariant.find({ productId: prod._id, isActive: true });
          return {
            ...prod.toObject(),
            variants,
          };
        })
      );

      ApiResponse.success({
        res,
        data: {
          products: enriched,
          query: q,
          total: enriched.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

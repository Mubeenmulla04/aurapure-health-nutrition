import { Request, Response, NextFunction } from 'express';
import { WishlistService } from './wishlist.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class WishlistController {
  static async getWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      const wishlist = await WishlistService.getWishlist(req.user!.userId);
      ApiResponse.success({ res, data: { wishlist } });
    } catch (error) {
      next(error);
    }
  }

  static async toggle(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, variantId } = req.body;
      const result = await WishlistService.toggleItem(req.user!.userId, productId, variantId);
      ApiResponse.success({
        res,
        message: result.action === 'added' ? 'Added to wishlist' : 'Removed from wishlist',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { CartService } from './cart.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class CartController {
  private static getParams(req: Request) {
    const userId = req.user?.userId;
    const guestSessionId = (req.headers['x-guest-session-id'] as string) || req.cookies?.guestSessionId;
    return { userId, guestSessionId };
  }

  static async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, guestSessionId } = CartController.getParams(req);
      const cart = await CartService.getOrCreateCart(userId, guestSessionId);
      ApiResponse.success({ res, data: { cart } });
    } catch (error) {
      next(error);
    }
  }

  static async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { variantId, quantity = 1 } = req.body;
      const params = CartController.getParams(req);
      const cart = await CartService.addItem(params, variantId, Number(quantity));
      ApiResponse.success({ res, message: 'Item added to cart.', data: { cart } });
    } catch (error) {
      next(error);
    }
  }

  static async updateQuantity(req: Request, res: Response, next: NextFunction) {
    try {
      const variantId = req.params.variantId as string;
      const { quantity } = req.body;
      const params = CartController.getParams(req);
      const cart = await CartService.updateQuantity(params, variantId, Number(quantity));
      ApiResponse.success({ res, message: 'Cart updated.', data: { cart } });
    } catch (error) {
      next(error);
    }
  }

  static async removeItem(req: Request, res: Response, next: NextFunction) {
    try {
      const variantId = req.params.variantId as string;
      const params = CartController.getParams(req);
      const cart = await CartService.removeItem(params, variantId);
      ApiResponse.success({ res, message: 'Item removed from cart.', data: { cart } });
    } catch (error) {
      next(error);
    }
  }

  static async applyCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.body;
      const params = CartController.getParams(req);
      const cart = await CartService.applyCoupon(params, code);
      ApiResponse.success({ res, message: 'Coupon applied successfully.', data: { cart } });
    } catch (error) {
      next(error);
    }
  }

  static async removeCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const params = CartController.getParams(req);
      const cart = await CartService.removeCoupon(params);
      ApiResponse.success({ res, message: 'Coupon removed.', data: { cart } });
    } catch (error) {
      next(error);
    }
  }
}

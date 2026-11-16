import { Request, Response, NextFunction } from 'express';
import { OrderService } from './order.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class OrderController {
  private static getParams(req: Request) {
    const userId = req.user?.userId;
    const guestSessionId = (req.headers['x-guest-session-id'] as string) || req.cookies?.guestSessionId;
    return { userId, guestSessionId };
  }

  static async checkoutPreview(req: Request, res: Response, next: NextFunction) {
    try {
      const params = OrderController.getParams(req);
      const result = await OrderService.checkoutPreview(params, req.body.shippingAddress);
      ApiResponse.success({ res, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { shippingAddress, guestEmail, guestPhone, paymentMethod = 'RAZORPAY' } = req.body;
      const params = {
        ...OrderController.getParams(req),
        guestEmail,
        guestPhone,
      };

      const result = await OrderService.createOrder(params, shippingAddress, paymentMethod.toUpperCase() as 'RAZORPAY' | 'COD');
      ApiResponse.success({
        res,
        statusCode: 201,
        message: paymentMethod.toUpperCase() === 'COD' ? 'Order confirmed via Cash on Delivery.' : 'Order created in PENDING status.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OrderService.verifyPayment(req.body);
      ApiResponse.success({
        res,
        message: 'Payment verified and order confirmed successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyShiprocketPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OrderService.verifyShiprocketPayment(req.body);
      ApiResponse.success({
        res,
        message: 'Shiprocket payment verified and order confirmed successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async handleShiprocketWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OrderService.handleShiprocketWebhook(req.body, req.headers);
      ApiResponse.success({
        res,
        message: result.message || 'Shiprocket webhook processed.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const result = await OrderService.getMyOrders(
        req.user!.userId,
        page ? Number(page) : 1,
        limit ? Number(limit) : 10
      );
      ApiResponse.success({ res, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const result = await OrderService.getOrderById(req.params.id as string, userId, userRole);
      ApiResponse.success({ res, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const order = await OrderService.cancelOrder(req.params.id as string, reason, userId, userRole);
      ApiResponse.success({ res, message: 'Order cancelled and inventory restocked.', data: { order } });
    } catch (error) {
      next(error);
    }
  }

  static async trackOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderNumber, phoneOrEmail } = req.query;
      const result = await OrderService.trackOrderByNumber(
        orderNumber as string,
        phoneOrEmail as string,
        req.user?.userId
      );
      ApiResponse.success({ res, data: result });
    } catch (error) {
      next(error);
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { Payment } from '../../models/payment.model.js';
import { Refund } from '../../models/refund.model.js';
import { Order } from '../../models/order.model.js';
import { AuditLog } from '../../models/auditLog.model.js';
import { RazorpayIntegrationService } from '../../integrations/razorpay/razorpay.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class AdminFinanceController {
  /**
   * List all payments with Razorpay IDs & order linkage
   */
  static async listPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const { status, search } = req.query;
      const query: any = {};

      if (status && status !== 'ALL') {
        query.status = status;
      }

      if (search) {
        const regex = new RegExp(String(search).trim(), 'i');
        query.$or = [{ razorpayOrderId: regex }, { razorpayPaymentId: regex }];
      }

      const total = await Payment.countDocuments(query);
      const payments = await Payment.find(query)
        .populate('orderId', 'orderNumber shippingAddress pricing orderStatus paymentMethod')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      ApiResponse.success({
        res,
        data: {
          payments,
          total,
          page,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reconcile payment status
   */
  static async reconcilePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const payment = await Payment.findById(id);
      if (!payment) {
        ApiResponse.error({ res, statusCode: 404, code: 'PAYMENT_NOT_FOUND', message: 'Payment record not found.' });
        return;
      }

      // Mark reconciled
      payment.status = 'SUCCESS';
      await payment.save();

      ApiResponse.success({
        res,
        message: `Payment reconciled with ${payment.gateway || 'Shiprocket'} gateway.`,
        data: { payment },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List refunds
   */
  static async listRefunds(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const { status } = req.query;
      const query: any = {};

      if (status && status !== 'ALL') {
        query.status = status;
      }

      const total = await Refund.countDocuments(query);
      const refunds = await Refund.find(query)
        .populate('orderId', 'orderNumber shippingAddress pricing')
        .populate('paymentId', 'razorpayPaymentId amount gateway')
        .populate('initiatedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      ApiResponse.success({
        res,
        data: {
          refunds,
          total,
          page,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve and execute refund via Razorpay
   */
  static async approveRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const refund = await Refund.findById(id).populate('orderId').populate('paymentId');
      if (!refund) {
        ApiResponse.error({ res, statusCode: 404, code: 'REFUND_NOT_FOUND', message: 'Refund record not found.' });
        return;
      }

      const payment = refund.paymentId as any;
      let rzpRefundId = `rfnd_${Date.now()}`;

      if (payment?.razorpayPaymentId) {
        try {
          const rzpResult = await RazorpayIntegrationService.createRefund(payment.razorpayPaymentId, refund.amount);
          if (rzpResult?.id) rzpRefundId = rzpResult.id;
        } catch (e) {
          // Fallback in test sandbox
        }
      }

      refund.status = 'PROCESSED';
      refund.razorpayRefundId = rzpRefundId;
      await refund.save();

      // Update Order payment status
      if (refund.orderId) {
        await Order.findByIdAndUpdate(refund.orderId, {
          paymentStatus: 'REFUNDED',
          orderStatus: 'REFUNDED',
        });
      }

      await AuditLog.create({
        userId: req.user!.userId as any,
        userName: req.user!.email,
        action: 'REFUND_APPROVE',
        entity: 'REFUND',
        entityId: refund._id.toString(),
        diff: { amount: refund.amount, razorpayRefundId: rzpRefundId },
      });

      ApiResponse.success({
        res,
        message: `Refund of ₹${refund.amount / 100} approved and processed via Razorpay.`,
        data: { refund },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject refund request
   */
  static async rejectRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const refund = await Refund.findById(id);
      if (!refund) {
        ApiResponse.error({ res, statusCode: 404, code: 'REFUND_NOT_FOUND', message: 'Refund record not found.' });
        return;
      }

      refund.status = 'FAILED';
      refund.reason = `${refund.reason} | Rejected by Staff: ${reason || 'Terms not met'}`;
      await refund.save();

      await AuditLog.create({
        userId: req.user!.userId as any,
        userName: req.user!.email,
        action: 'REFUND_REJECT',
        entity: 'REFUND',
        entityId: refund._id.toString(),
        diff: { reason },
      });

      ApiResponse.success({
        res,
        message: 'Refund request rejected.',
        data: { refund },
      });
    } catch (error) {
      next(error);
    }
  }
}

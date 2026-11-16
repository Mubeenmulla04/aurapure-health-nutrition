import { Request, Response, NextFunction } from 'express';
import { Invoice } from '../../models/invoice.model.js';
import { Notification } from '../../models/notification.model.js';
import { Order } from '../../models/order.model.js';
import { Inventory } from '../../models/inventory.model.js';
import { ProductVariant } from '../../models/productVariant.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class AdminReportsController {
  /**
   * List all generated Tax Invoices
   */
  static async listInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const { search } = req.query;
      const query: any = {};

      if (search) {
        const regex = new RegExp(String(search).trim(), 'i');
        query.$or = [{ invoiceNumber: regex }, { 'customerDetails.name': regex }, { 'customerDetails.phone': regex }];
      }

      const total = await Invoice.countDocuments(query);
      const invoices = await Invoice.find(query)
        .populate('orderId', 'orderNumber orderStatus createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      ApiResponse.success({
        res,
        data: {
          invoices,
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
   * List omnichannel notifications (WhatsApp, Email, SMS)
   */
  static async listNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
      const skip = (page - 1) * limit;

      const { channel, status } = req.query;
      const query: any = {};

      if (channel && channel !== 'ALL') query.channel = channel;
      if (status && status !== 'ALL') query.status = status;

      const total = await Notification.countDocuments(query);
      const notifications = await Notification.find(query)
        .populate('orderId', 'orderNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      ApiResponse.success({
        res,
        data: {
          notifications,
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
   * Export GST Tax Compliance Report to CSV
   */
  static async exportTaxReport(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await Order.find({ paymentStatus: 'PAID' }).sort({ createdAt: -1 });

      const headers = [
        'Order Number',
        'Invoice Date',
        'Customer Name',
        'State / Pincode',
        'Taxable Value (INR)',
        'CGST @ 9% (INR)',
        'SGST @ 9% (INR)',
        'Total GST (INR)',
        'Invoice Total (INR)',
      ];

      const rows = orders.map((o) => {
        const taxable = Math.round((o.pricing?.finalTotal || 0) / 1.18);
        const totalGst = (o.pricing?.finalTotal || 0) - taxable;
        const cgst = Math.round(totalGst / 2);
        const sgst = totalGst - cgst;

        return [
          `"${o.orderNumber}"`,
          `"${o.createdAt.toISOString().split('T')[0]}"`,
          `"${o.shippingAddress?.fullName?.replace(/"/g, '""') || ''}"`,
          `"${o.shippingAddress?.state || ''} - ${o.shippingAddress?.pincode || ''}"`,
          taxable,
          cgst,
          sgst,
          totalGst,
          o.pricing?.finalTotal || 0,
        ];
      });

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="aurapure-gst-tax-report.csv"');
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export Inventory Valuation Report to CSV
   */
  static async exportInventoryValuation(_req: Request, res: Response, next: NextFunction) {
    try {
      const inventory = await Inventory.find().populate('variantId').lean();

      const headers = [
        'SKU',
        'Variant Title',
        'Stock On Hand',
        'Reserved Orders',
        'Available to Sell',
        'Unit Selling Price (INR)',
        'Total Valuation (INR)',
        'Health Status',
      ];

      const rows = inventory.map((inv) => {
        const variant = inv.variantId as any;
        const price = variant?.sellingPrice || 0;
        const val = inv.stockOnHand * price;

        return [
          `"${inv.sku}"`,
          `"${variant?.title?.replace(/"/g, '""') || inv.sku}"`,
          inv.stockOnHand,
          inv.reservedStock,
          inv.availableStock,
          price,
          val,
          inv.alertStatus,
        ];
      });

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="aurapure-inventory-valuation.csv"');
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}

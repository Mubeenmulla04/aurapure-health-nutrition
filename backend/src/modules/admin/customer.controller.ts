import { Request, Response, NextFunction } from 'express';
import { User } from '../../models/user.model.js';
import { Order } from '../../models/order.model.js';
import { Address } from '../../models/address.model.js';
import { AuditLog } from '../../models/auditLog.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class AdminCustomerController {
  /**
   * List customers with aggregated lifetime metrics (order count, total spend, last purchase)
   */
  static async listCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 15));
      const skip = (page - 1) * limit;

      const { search } = req.query;
      const query: any = { role: 'customer' };

      if (search) {
        const regex = new RegExp(String(search).trim(), 'i');
        query.$or = [{ name: regex }, { email: regex }, { phone: regex }, { mobileNumber: regex }];
      }

      const total = await User.countDocuments(query);
      const customers = await User.find(query)
        .select('-passwordHash -refreshTokenHash -passwordResetToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Aggregate orders per customer
      const enrichedCustomers = await Promise.all(
        customers.map(async (cust) => {
          const orders = await Order.find({
            $or: [{ userId: cust._id }, { guestEmail: cust.email }],
          }).lean();

          const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID');
          const totalSpend = paidOrders.reduce((acc, curr) => acc + (curr.pricing?.finalTotal || 0), 0);
          const lastOrder = orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

          return {
            ...cust,
            ordersCount: orders.length,
            paidOrdersCount: paidOrders.length,
            totalSpend,
            lastOrderDate: lastOrder ? lastOrder.createdAt : null,
          };
        })
      );

      ApiResponse.success({
        res,
        data: {
          customers: enrichedCustomers,
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
   * Single customer profile with addresses and order history
   */
  static async getCustomerById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const customer = await User.findById(id).select('-passwordHash -refreshTokenHash -passwordResetToken').lean();
      if (!customer) {
        ApiResponse.error({ res, statusCode: 404, code: 'CUSTOMER_NOT_FOUND', message: 'Customer account not found.' });
        return;
      }

      const [addresses, orders] = await Promise.all([
        Address.find({ userId: customer._id }).lean(),
        Order.find({
          $or: [{ userId: customer._id }, { guestEmail: customer.email }],
        })
          .sort({ createdAt: -1 })
          .lean(),
      ]);

      const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID');
      const totalSpend = paidOrders.reduce((acc, curr) => acc + (curr.pricing?.finalTotal || 0), 0);

      ApiResponse.success({
        res,
        data: {
          customer: {
            ...customer,
            addresses,
            orders,
            ordersCount: orders.length,
            totalSpend,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle customer active status (block / unblock account)
   */
  static async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const customer = await User.findById(id);
      if (!customer || customer.role !== 'customer') {
        ApiResponse.error({ res, statusCode: 404, code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found.' });
        return;
      }

      customer.isActive = typeof isActive === 'boolean' ? isActive : !customer.isActive;
      await customer.save();

      await AuditLog.create({
        userId: req.user!.userId as any,
        userName: req.user!.email,
        action: customer.isActive ? 'CUSTOMER_UNBLOCK' : 'CUSTOMER_BLOCK',
        entity: 'USER',
        entityId: customer._id.toString(),
        diff: { isActive: customer.isActive },
      });

      ApiResponse.success({
        res,
        message: `Customer account ${customer.isActive ? 'unblocked' : 'blocked'}.`,
        data: { customer },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export Customer Directory to CSV
   */
  static async exportCustomersCsv(_req: Request, res: Response, next: NextFunction) {
    try {
      const customers = await User.find({ role: 'customer' }).sort({ createdAt: -1 }).lean();

      const headers = ['Customer ID', 'Full Name', 'Email', 'Phone', 'Active Status', 'Registration Date'];
      const rows = customers.map((c) => [
        `"${c._id}"`,
        `"${c.name?.replace(/"/g, '""') || ''}"`,
        `"${c.email || ''}"`,
        `"${c.phone || ''}"`,
        c.isActive ? 'Active' : 'Blocked',
        `"${c.createdAt ? new Date(c.createdAt).toISOString() : ''}"`,
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="aurapure-customers-directory.csv"');
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}

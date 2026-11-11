import { Order } from '../../models/order.model.js';
import { User } from '../../models/user.model.js';
import { Product } from '../../models/product.model.js';
import { ProductVariant } from '../../models/productVariant.model.js';
import { Inventory } from '../../models/inventory.model.js';
import { AuditLog } from '../../models/auditLog.model.js';
import { Shipment } from '../../models/shipment.model.js';
import { ShiprocketIntegrationService } from '../../integrations/shiprocket/shiprocket.service.js';
import { WhatsAppIntegrationService } from '../../integrations/whatsapp/whatsapp.service.js';

export class AdminService {
  /**
   * Executive KPI Metrics Overview
   */
  static async getDashboardOverview() {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: { $in: ['PENDING', 'CONFIRMED', 'PROCESSING'] } });
    const deliveredOrders = await Order.countDocuments({ orderStatus: 'DELIVERED' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalProducts = await Product.countDocuments();
    const lowStockAlerts = await Inventory.countDocuments({ alertStatus: { $in: ['LOW_STOCK', 'OUT_OF_STOCK'] } });

    // Aggregate total revenue from completed/paid orders
    const revenueAgg = await Order.aggregate([
      { $match: { paymentStatus: 'PAID' } },
      { $group: { _id: null, totalRevenue: { $sum: '$pricing.finalTotal' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    // Average Order Value (AOV)
    const aov = totalOrders > 0 ? Math.round(totalRevenue / (deliveredOrders || 1)) : 0;

    // 7-day revenue trend
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyRevenueAgg = await Order.aggregate([
      { $match: { paymentStatus: 'PAID', createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$pricing.finalTotal' },
          ordersCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Low stock items summary
    const lowStockItems = await Inventory.find({ alertStatus: { $in: ['LOW_STOCK', 'OUT_OF_STOCK'] } })
      .populate('variantId')
      .limit(5);

    // Recent 5 orders
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);

    return {
      kpi: {
        totalRevenue,
        totalOrders,
        pendingOrders,
        deliveredOrders,
        totalCustomers,
        totalProducts,
        lowStockAlerts,
        averageOrderValue: aov,
      },
      revenueChart: dailyRevenueAgg.map((item) => ({
        date: item._id,
        revenue: item.revenue,
        orders: item.ordersCount,
      })),
      lowStockItems,
      recentOrders,
    };
  }

  /**
   * Order Management (Admin)
   */
  static async listOrders(filters: { status?: string; search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, Math.max(1, filters.limit || 15));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (filters.status && filters.status !== 'ALL') {
      query.orderStatus = filters.status;
    }
    if (filters.search) {
      const reg = new RegExp(filters.search.trim(), 'i');
      query.$or = [{ orderNumber: reg }, { 'shippingAddress.fullName': reg }, { 'shippingAddress.phone': reg }];
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);

    return {
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update Order Status & Trigger Notifications
   */
  static async updateOrderStatus(orderId: string, status: string, adminUserId: string) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw { statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found.' };
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = status as any;
    if (status === 'DELIVERED') {
      order.paymentStatus = 'PAID';
    }
    await order.save();

    // Audit log
    await AuditLog.create({
      userId: adminUserId as any,
      action: 'ORDER_STATUS_UPDATE',
      entity: 'ORDER',
      entityId: order._id.toString(),
      diff: { before: { status: previousStatus }, after: { status } },
    });

    // Check if shipment needs updating or WhatsApp triggered
    if (status === 'SHIPPED') {
      const shipment = await Shipment.findOne({ orderId: order._id });
      if (shipment) {
        WhatsAppIntegrationService.sendShippingUpdate(
          order,
          shipment.courierName || 'Shiprocket Air',
          shipment.awbCode || 'IN-TRANSIT',
          shipment.trackingUrl || 'https://aurapure.in/track-order'
        ).catch(() => {});
      }
    }

    return order;
  }

  /**
   * Inventory Master
   */
  static async listInventory() {
    const inventory = await Inventory.find()
      .populate({
        path: 'variantId',
        populate: { path: 'productId', select: 'title slug' },
      })
      .sort({ availableStock: 1 });

    return inventory;
  }

  static async adjustStock(inventoryId: string, changeQty: number, reason: string, adminUserId: string) {
    const inv = await Inventory.findById(inventoryId);
    if (!inv) {
      throw { statusCode: 404, code: 'INVENTORY_NOT_FOUND', message: 'Inventory record not found.' };
    }

    const prevStock = inv.stockOnHand;
    inv.stockOnHand = Math.max(0, inv.stockOnHand + changeQty);
    await inv.save();

    await AuditLog.create({
      userId: adminUserId as any,
      action: 'INVENTORY_ADJUST',
      entity: 'INVENTORY',
      entityId: inv._id.toString(),
      diff: { before: { stockOnHand: prevStock }, after: { stockOnHand: inv.stockOnHand, reason } },
    });

    return inv;
  }

  /**
   * Product Management (Admin)
   */
  static async createProduct(data: any, adminUserId: string) {
    const product = await Product.create(data.product);

    if (data.variants && Array.isArray(data.variants)) {
      for (const v of data.variants) {
        const variant = await ProductVariant.create({
          ...v,
          productId: product._id,
        });

        await Inventory.create({
          variantId: variant._id,
          sku: variant.sku,
          stockOnHand: v.initialStock || 50,
          reservedStock: 0,
          availableStock: v.initialStock || 50,
          lowStockThreshold: 10,
        });
      }
    }

    await AuditLog.create({
      userId: adminUserId as any,
      action: 'PRODUCT_CREATE',
      entity: 'PRODUCT',
      entityId: product._id.toString(),
    });

    return product;
  }
}

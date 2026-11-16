import { Order } from '../../models/order.model.js';
import { User } from '../../models/user.model.js';
import { Product } from '../../models/product.model.js';
import { ProductVariant } from '../../models/productVariant.model.js';
import { Inventory } from '../../models/inventory.model.js';
import { Refund } from '../../models/refund.model.js';
import { AuditLog } from '../../models/auditLog.model.js';
import { Shipment } from '../../models/shipment.model.js';
import { ShiprocketIntegrationService } from '../../integrations/shiprocket/shiprocket.service.js';
import { WhatsAppIntegrationService } from '../../integrations/whatsapp/whatsapp.service.js';

export class AdminService {
  /**
   * Executive KPI Metrics Overview with Real-Time Aggregations
   */
  static async getDashboardOverview(range = '7d') {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. KPI Counts
    const [
      totalOrders,
      todayOrders,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      totalCustomers,
      totalProducts,
      lowStockProducts,
      refundRequests,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ orderStatus: { $in: ['PENDING', 'CONFIRMED', 'PROCESSING'] } }),
      Order.countDocuments({ orderStatus: 'DELIVERED' }),
      Order.countDocuments({ orderStatus: 'CANCELLED' }),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments(),
      Inventory.countDocuments({ alertStatus: { $in: ['LOW_STOCK', 'OUT_OF_STOCK'] } }),
      Refund.countDocuments({ status: 'PENDING' }),
    ]);

    // 2. Revenue Aggregations
    const [totalRevenueAgg, todayRevenueAgg] = await Promise.all([
      Order.aggregate([
        { $match: { paymentStatus: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$pricing.finalTotal' }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'PAID', createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$pricing.finalTotal' } } },
      ]),
    ]);

    const totalRevenue = totalRevenueAgg[0]?.total || 0;
    const paidOrdersCount = totalRevenueAgg[0]?.count || 0;
    const todayRevenue = todayRevenueAgg[0]?.total || 0;
    const averageOrderValue = paidOrdersCount > 0 ? Math.round(totalRevenue / paidOrdersCount) : 0;

    // 3. Date Range Timeline
    let dateFilter: Date;
    let formatString: string;
    if (range === '30d') {
      dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      formatString = '%Y-%m-%d';
    } else if (range === '1y') {
      dateFilter = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      formatString = '%Y-%m';
    } else {
      // Default 7 days
      dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      formatString = '%Y-%m-%d';
    }

    const revenueTimelineAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: dateFilter } } },
      {
        $group: {
          _id: { $dateToString: { format: formatString, date: '$createdAt' } },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, '$pricing.finalTotal', 0],
            },
          },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 4. Order Status Distribution
    const orderStatusAgg = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    // 5. Payment Method Distribution
    const paymentMethodAgg = await Order.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$pricing.finalTotal' },
        },
      },
    ]);

    // 6. Top Selling Products
    const topProductsAgg = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.title',
          image: { $first: '$items.image' },
          unitsSold: { $sum: '$items.quantity' },
          totalSales: { $sum: '$items.total' },
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 5 },
    ]);

    // 7. Low Stock Inventory Items
    const lowStockItems = await Inventory.find({ alertStatus: { $in: ['LOW_STOCK', 'OUT_OF_STOCK'] } })
      .populate({
        path: 'variantId',
        populate: { path: 'productId', select: 'title slug images' },
      })
      .limit(6);

    // 8. Recent Orders
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(6);

    return {
      kpi: {
        totalRevenue,
        todayRevenue,
        totalOrders,
        todayOrders,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        totalCustomers,
        totalProducts,
        lowStockProducts,
        refundRequests,
        averageOrderValue,
      },
      revenueChart: revenueTimelineAgg.map((item) => ({
        date: item._id,
        revenue: item.revenue,
        orders: item.orders,
      })),
      orderStatusDistribution: orderStatusAgg.map((item) => ({
        status: item._id,
        count: item.count,
      })),
      paymentMethodDistribution: paymentMethodAgg.map((item) => ({
        method: item._id || 'ONLINE',
        count: item.count,
        totalAmount: item.totalAmount,
      })),
      topProducts: topProductsAgg.map((p) => ({
        title: p._id,
        image: p.image,
        unitsSold: p.unitsSold,
        totalSales: p.totalSales,
      })),
      lowStockItems,
      recentOrders,
    };
  }

  /**
   * Export Sales & Financial Summary to CSV
   */
  static async exportSalesReport(range = '30d') {
    let dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (range === '7d') dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (range === '1y') dateFilter = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    const orders = await Order.find({ createdAt: { $gte: dateFilter } }).sort({ createdAt: -1 });

    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Phone',
      'Payment Status',
      'Payment Method',
      'Subtotal (INR)',
      'Discount (INR)',
      'GST Tax (INR)',
      'Shipping Fee (INR)',
      'Final Total (INR)',
      'Order Status',
    ];

    const rows = orders.map((o) => [
      `"${o.orderNumber}"`,
      `"${o.createdAt.toISOString()}"`,
      `"${o.shippingAddress?.fullName?.replace(/"/g, '""') || ''}"`,
      `"${o.shippingAddress?.phone || ''}"`,
      `"${o.paymentStatus}"`,
      `"${o.paymentMethod}"`,
      o.pricing?.subtotal || 0,
      o.pricing?.couponDiscount || 0,
      o.pricing?.taxGst || 0,
      o.pricing?.shippingFee || 0,
      o.pricing?.finalTotal || 0,
      `"${o.orderStatus}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return csvContent;
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

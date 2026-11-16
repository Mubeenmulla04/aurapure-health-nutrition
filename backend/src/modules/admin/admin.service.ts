import { Order } from '../../models/order.model.js';
import { User } from '../../models/user.model.js';
import { Product } from '../../models/product.model.js';
import { Inventory } from '../../models/inventory.model.js';
import { Refund } from '../../models/refund.model.js';

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
}

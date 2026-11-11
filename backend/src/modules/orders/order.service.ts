import mongoose from 'mongoose';
import { Order, IOrder, IAddressSnapshot } from '../../models/order.model.js';
import { Payment } from '../../models/payment.model.js';
import { Invoice } from '../../models/invoice.model.js';
import { Shipment } from '../../models/shipment.model.js';
import { Inventory } from '../../models/inventory.model.js';
import { InventoryTransaction } from '../../models/inventoryTransaction.model.js';
import { Cart } from '../../models/cart.model.js';
import { CartService } from '../cart/cart.service.js';
import { RazorpayIntegrationService } from '../../integrations/razorpay/razorpay.service.js';
import { InvoicePdfService } from '../../integrations/pdf/pdf.service.js';
import { WhatsAppIntegrationService } from '../../integrations/whatsapp/whatsapp.service.js';
import { ShiprocketIntegrationService } from '../../integrations/shiprocket/shiprocket.service.js';
import { CurrencyUtils } from '../../utils/currency.js';
import { logger } from '../../utils/logger.js';

export class OrderService {
  /**
   * Preview checkout totals before payment
   */
  static async checkoutPreview(params: { userId?: string; guestSessionId?: string }, address: IAddressSnapshot) {
    const cart = await CartService.getOrCreateCart(params.userId, params.guestSessionId);

    if (cart.items.length === 0) {
      throw { statusCode: 400, code: 'EMPTY_CART', message: 'Your cart is empty.' };
    }

    // Verify stock availability for each item
    for (const item of cart.items) {
      const inv = await Inventory.findOne({ variantId: item.variantId });
      if (!inv || inv.availableStock < item.quantity) {
        throw {
          statusCode: 400,
          code: 'INSUFFICIENT_STOCK',
          message: `Item "${item.productTitle} (${item.flavor})" has only ${inv?.availableStock || 0} units left in stock.`,
        };
      }
    }

    // Check Shiprocket PIN code delivery
    const serviceability = await ShiprocketIntegrationService.checkPincodeServiceability(address.pincode);

    return {
      cart,
      serviceability,
      shippingAddress: address,
    };
  }

  /**
   * Create Pending Order & Razorpay Order
   */
  static async createOrder(
    params: { userId?: string; guestSessionId?: string; guestEmail?: string; guestPhone?: string },
    shippingAddress: IAddressSnapshot
  ) {
    const cartTotals = await CartService.getOrCreateCart(params.userId, params.guestSessionId);

    if (cartTotals.items.length === 0) {
      throw { statusCode: 400, code: 'EMPTY_CART', message: 'Your cart is empty.' };
    }

    // 1. Atomic Stock Reservation Check
    for (const item of cartTotals.items) {
      const updated = await Inventory.findOneAndUpdate(
        { variantId: item.variantId, availableStock: { $gte: item.quantity } },
        {
          $inc: { reservedStock: item.quantity, availableStock: -item.quantity },
        },
        { new: true }
      );

      if (!updated) {
        throw {
          statusCode: 400,
          code: 'INSUFFICIENT_STOCK',
          message: `Sorry, "${item.productTitle} (${item.flavor})" just sold out. Please review your cart.`,
        };
      }

      // Log transaction
      await InventoryTransaction.create({
        inventoryId: updated._id,
        variantId: item.variantId,
        changeQuantity: item.quantity,
        previousQuantity: updated.availableStock + item.quantity,
        newQuantity: updated.availableStock,
        type: 'ORDER_HOLD',
        reason: 'Reserved during checkout',
      });
    }

    // 2. Generate Unique Order Number e.g. "AP-2026-1042"
    const count = await Order.countDocuments();
    const orderNumber = `AP-2026-${String(count + 1001).padStart(5, '0')}`;

    // 3. Create Pending Order Document
    const order = await Order.create({
      orderNumber,
      userId: params.userId,
      guestEmail: params.guestEmail,
      guestPhone: params.guestPhone || shippingAddress.phone,
      items: cartTotals.items,
      shippingAddress,
      pricing: {
        subtotal: cartTotals.subtotal,
        couponCode: cartTotals.coupon?.code,
        couponDiscount: cartTotals.couponDiscount,
        shippingFee: cartTotals.shippingFee,
        taxGst: cartTotals.taxGst,
        finalTotal: cartTotals.finalTotal,
      },
      orderStatus: 'PENDING',
      paymentStatus: 'UNPAID',
      paymentMethod: 'RAZORPAY',
    });

    // 4. Initialize Razorpay Gateway Order
    const razorpayOrder = await RazorpayIntegrationService.createOrder(
      cartTotals.finalTotal,
      order.orderNumber,
      {
        orderId: order._id.toString(),
        customerPhone: shippingAddress.phone,
      }
    );

    // 5. Create Payment Record
    await Payment.create({
      orderId: order._id,
      gateway: 'RAZORPAY',
      razorpayOrderId: razorpayOrder.id,
      amount: CurrencyUtils.toPaise(cartTotals.finalTotal),
      currency: 'INR',
      status: 'INITIATED',
    });

    // 6. Clear user cart
    if (params.userId) {
      await Cart.findOneAndUpdate({ userId: params.userId }, { $set: { items: [], couponCode: null } });
    } else if (params.guestSessionId) {
      await Cart.findOneAndUpdate({ guestSessionId: params.guestSessionId }, { $set: { items: [], couponCode: null } });
    }

    return {
      orderId: order._id,
      orderNumber: order.orderNumber,
      finalTotal: cartTotals.finalTotal,
      currency: 'INR',
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_YourTestKeyIdHere',
      customer: {
        name: shippingAddress.fullName,
        email: params.guestEmail || '',
        phone: shippingAddress.phone,
      },
    };
  }

  /**
   * Verify Razorpay Payment, Commit Stock & Trigger Automation
   */
  static async verifyPayment(data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const payment = await Payment.findOne({ razorpayOrderId: data.razorpayOrderId });
    if (!payment) {
      throw { statusCode: 404, code: 'PAYMENT_RECORD_NOT_FOUND', message: 'Payment record not found.' };
    }

    const order = await Order.findById(payment.orderId);
    if (!order) {
      throw { statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Associated order not found.' };
    }

    // Verify signature
    const isValid = RazorpayIntegrationService.verifySignature(
      data.razorpayOrderId,
      data.razorpayPaymentId,
      data.razorpaySignature
    );

    if (!isValid) {
      payment.status = 'FAILED';
      payment.errorDescription = 'Signature verification failed';
      await payment.save();
      throw { statusCode: 400, code: 'INVALID_PAYMENT_SIGNATURE', message: 'Payment verification failed.' };
    }

    // Update payment record
    payment.status = 'SUCCESS';
    payment.razorpayPaymentId = data.razorpayPaymentId;
    payment.razorpaySignature = data.razorpaySignature;
    await payment.save();

    // Update order status
    order.paymentStatus = 'PAID';
    order.orderStatus = 'CONFIRMED';
    await order.save();

    // Commit Stock: deduct from stockOnHand and reservedStock
    for (const item of order.items) {
      const inv = await Inventory.findOneAndUpdate(
        { variantId: item.variantId },
        {
          $inc: { stockOnHand: -item.quantity, reservedStock: -item.quantity },
        },
        { new: true }
      );

      if (inv) {
        await InventoryTransaction.create({
          inventoryId: inv._id,
          variantId: item.variantId,
          orderId: order._id,
          changeQuantity: -item.quantity,
          previousQuantity: inv.stockOnHand + item.quantity,
          newQuantity: inv.stockOnHand,
          type: 'PURCHASE_COMMIT',
          reason: `Payment verified for ${order.orderNumber}`,
        });
      }
    }

    // Generate Invoice Record & PDF
    const invoiceCount = await Invoice.countDocuments();
    const invoiceNumber = `INV-2026-${String(invoiceCount + 1001).padStart(5, '0')}`;
    const gstBreakup = CurrencyUtils.calculateGST(order.pricing.subtotal - order.pricing.couponDiscount);

    const invoice = await Invoice.create({
      orderId: order._id,
      invoiceNumber,
      invoiceDate: new Date(),
      customerDetails: {
        name: order.shippingAddress.fullName,
        address: `${order.shippingAddress.addressLine1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
        phone: order.shippingAddress.phone,
        email: order.guestEmail,
      },
      subtotal: order.pricing.subtotal,
      discount: order.pricing.couponDiscount,
      taxBreakup: {
        cgst: gstBreakup.cgst,
        sgst: gstBreakup.sgst,
        igst: gstBreakup.igst,
        totalTax: gstBreakup.totalGst,
      },
      shippingFee: order.pricing.shippingFee,
      totalPayable: order.pricing.finalTotal,
      paymentMethod: 'RAZORPAY',
      paymentStatus: 'PAID',
    });

    try {
      const pdfPath = await InvoicePdfService.generateInvoicePdf(order, invoice);
      invoice.pdfPath = pdfPath;
      invoice.pdfUrl = `/api/v1/invoices/${order._id}/download`;
      await invoice.save();
    } catch (pdfErr) {
      logger.error('Invoice PDF generation failed:', pdfErr);
    }

    // Trigger WhatsApp & Email Automation asynchronously
    WhatsAppIntegrationService.sendOrderConfirmation(order, invoice.pdfUrl).catch((err) =>
      logger.error('Async WhatsApp notification error:', err)
    );

    // Automatically initialize Shiprocket Order
    ShiprocketIntegrationService.createShipment(order)
      .then(async (shipmentData) => {
        await Shipment.create({
          orderId: order._id,
          ...shipmentData,
          currentStatus: 'PICKUP_SCHEDULED',
        });
        logger.info(`Shipment automatically registered for order: ${order.orderNumber}`);
      })
      .catch((err) => logger.error('Async shipment creation error:', err));

    return {
      success: true,
      orderNumber: order.orderNumber,
      orderId: order._id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceUrl: invoice.pdfUrl,
    };
  }

  /**
   * Cancel Order and Restock
   */
  static async cancelOrder(orderId: string, reason: string = 'Customer cancellation') {
    const order = await Order.findById(orderId);
    if (!order) {
      throw { statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found.' };
    }

    if (['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.orderStatus)) {
      throw {
        statusCode: 400,
        code: 'CANNOT_CANCEL_ORDER',
        message: `Order cannot be cancelled in status ${order.orderStatus}.`,
      };
    }

    // Restock items
    for (const item of order.items) {
      const inv = await Inventory.findOneAndUpdate(
        { variantId: item.variantId },
        {
          $inc: {
            stockOnHand: order.paymentStatus === 'PAID' ? item.quantity : 0,
            reservedStock: order.paymentStatus === 'UNPAID' ? -item.quantity : 0,
            availableStock: item.quantity,
          },
        },
        { new: true }
      );

      if (inv) {
        await InventoryTransaction.create({
          inventoryId: inv._id,
          variantId: item.variantId,
          orderId: order._id,
          changeQuantity: item.quantity,
          previousQuantity: inv.availableStock - item.quantity,
          newQuantity: inv.availableStock,
          type: 'ORDER_CANCELLED_RESTOCK',
          reason,
        });
      }
    }

    order.orderStatus = 'CANCELLED';
    order.cancellationReason = reason;
    await order.save();

    return order;
  }

  static async getMyOrders(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const total = await Order.countDocuments({ userId });
    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit);

    const enrichedOrders = await Promise.all(
      orders.map(async (o) => {
        const shipment = await Shipment.findOne({ orderId: o._id });
        const invoice = await Invoice.findOne({ orderId: o._id });
        return {
          ...o.toObject(),
          shipment,
          invoiceUrl: invoice?.pdfUrl,
        };
      })
    );

    return {
      orders: enrichedOrders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getOrderById(orderId: string) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw { statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found.' };
    }

    const shipment = await Shipment.findOne({ orderId: order._id });
    const invoice = await Invoice.findOne({ orderId: order._id });

    return {
      order,
      shipment,
      invoice,
    };
  }

  static async trackOrderByNumber(orderNumber: string, phoneOrEmail: string) {
    const cleanSearch = phoneOrEmail.trim().toLowerCase();
    const order = await Order.findOne({
      orderNumber: orderNumber.trim().toUpperCase(),
      $or: [
        { guestEmail: cleanSearch },
        { guestPhone: new RegExp(cleanSearch.replace(/\D/g, '')) },
        { 'shippingAddress.phone': new RegExp(cleanSearch.replace(/\D/g, '')) },
      ],
    });

    if (!order) {
      throw { statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'No matching order found with the provided details.' };
    }

    const shipment = await Shipment.findOne({ orderId: order._id });
    return { order, shipment };
  }
}

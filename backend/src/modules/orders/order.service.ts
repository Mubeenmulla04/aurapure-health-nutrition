import mongoose from 'mongoose';
import { User } from '../../models/user.model.js';
import { Order, IOrder, IAddressSnapshot, OrderStatusType } from '../../models/order.model.js';
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
import { ShiprocketPaymentService } from '../../integrations/shiprocket/shiprocketPayment.service.js';
import { OrderNotificationDispatcher } from './orderNotification.service.js';
import { CurrencyUtils } from '../../utils/currency.js';
import { env } from '../../config/env.js';
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
   * Create Pending Order & Shiprocket/Razorpay Payment, or Confirm Cash on Delivery (COD) Order
   */
  static async createOrder(
    params: { userId?: string; guestSessionId?: string; guestEmail?: string; guestPhone?: string },
    shippingAddress: IAddressSnapshot,
    paymentMethod: 'SHIPROCKET' | 'RAZORPAY' | 'COD' = 'SHIPROCKET'
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
    const isCod = paymentMethod === 'COD';

    // 3. Map Cart Items to Order Item Snapshots
    const orderItems = cartTotals.items.map((item: any) => ({
      productId: item.productId,
      variantId: item.variantId,
      title: item.title || item.productTitle,
      flavor: item.flavor || '',
      packSize: item.packSize || '',
      sku: item.sku || '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      mrp: item.mrp || item.unitPrice,
      total: item.total || item.unitPrice * item.quantity,
      image: item.image || '',
    }));

    // Fetch user email if authenticated
    let customerEmail = params.guestEmail || '';
    if (!customerEmail && params.userId) {
      const u = await User.findById(params.userId);
      if (u?.email) customerEmail = u.email;
    }

    // 4. Create Order Document with Immutable Customer & Delivery Snapshots
    const order = await Order.create({
      orderNumber,
      userId: params.userId,
      guestEmail: customerEmail,
      guestPhone: params.guestPhone || shippingAddress.phone,
      customerSnapshot: {
        fullName: shippingAddress.fullName,
        email: customerEmail,
        phone: shippingAddress.phone || params.guestPhone || '',
        userId: params.userId as any,
      },
      items: orderItems,
      shippingAddress,
      pricing: {
        subtotal: cartTotals.subtotal,
        couponCode: cartTotals.coupon?.code,
        couponDiscount: cartTotals.couponDiscount,
        shippingFee: cartTotals.shippingFee,
        taxGst: cartTotals.taxGst,
        finalTotal: cartTotals.finalTotal,
      },
      orderStatus: isCod ? 'CONFIRMED' : 'PENDING',
      fulfillmentStage: 'NEW_ORDER',
      paymentStatus: 'UNPAID',
      paymentMethod: isCod ? 'COD' : (paymentMethod === 'RAZORPAY' ? 'RAZORPAY' : 'SHIPROCKET'),
      orderTimeline: isCod
        ? [
            {
              status: 'PLACED',
              timestamp: new Date(),
              note: 'Order placed via Cash on Delivery',
              source: 'CUSTOMER',
              authorName: shippingAddress.fullName,
            },
            {
              status: 'CONFIRMED',
              timestamp: new Date(),
              note: 'Order automatically confirmed for Cash on Delivery',
              source: 'SYSTEM',
              authorName: 'AuraPure Automated System',
            },
          ]
        : [
            {
              status: 'PLACED',
              timestamp: new Date(),
              note: 'Order placed, awaiting payment confirmation',
              source: 'CUSTOMER',
              authorName: shippingAddress.fullName,
            },
          ],
    });

    // 4. Handle COD vs Online Payment Flow
    if (isCod) {
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
            reason: `Order confirmed via Cash on Delivery: ${order.orderNumber}`,
          });
        }
      }

      // Generate Tax Invoice Record & PDF
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
        paymentMethod: 'COD',
        paymentStatus: 'UNPAID',
      });

      try {
        const pdfPath = await InvoicePdfService.generateInvoicePdf(order, invoice);
        invoice.pdfPath = pdfPath;
        invoice.pdfUrl = `/api/v1/invoices/${order._id}/download`;
        await invoice.save();
      } catch (pdfErr) {
        logger.error('Invoice PDF generation failed for COD order:', pdfErr);
      }

      // Dispatch Multi-Channel confirmation asynchronously
      OrderNotificationDispatcher.dispatchAll(order, 'CONFIRMED');
      WhatsAppIntegrationService.sendOrderConfirmation(order, invoice.pdfUrl).catch((err) =>
        logger.error('Async WhatsApp notification error for COD order:', err)
      );

      // Initialize local Shipment record in NEW_ORDER state (Awaiting Admin verification & acceptance)
      await Shipment.create({
        orderId: order._id,
        currentStatus: 'PENDING',
        fulfillmentStage: 'NEW_ORDER',
      });
      logger.info(`New COD Order #${order.orderNumber} initialized in NEW_ORDER state awaiting admin fulfillment.`);

      // Clear user cart
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
        paymentMethod: 'COD',
        isCod: true,
        customer: {
          name: shippingAddress.fullName,
          email: params.guestEmail || '',
          phone: shippingAddress.phone,
        },
      };
    }

    // 5. Handle Shiprocket Online Payment Gateway
    if (paymentMethod === 'SHIPROCKET') {
      const srPayment = await ShiprocketPaymentService.createPaymentOrder(
        order,
        cartTotals.finalTotal,
        {
          name: shippingAddress.fullName,
          email: params.guestEmail || '',
          phone: shippingAddress.phone,
        }
      );

      // Create Payment Record
      await Payment.create({
        orderId: order._id,
        gateway: 'SHIPROCKET',
        gatewayOrderId: srPayment.shiprocketOrderId,
        shiprocketOrderId: srPayment.shiprocketOrderId,
        shiprocketToken: srPayment.token,
        amount: CurrencyUtils.toPaise(cartTotals.finalTotal),
        currency: 'INR',
        status: 'INITIATED',
      });

      // Clear user cart
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
        paymentMethod: 'SHIPROCKET',
        isCod: false,
        shiprocketOrderId: srPayment.shiprocketOrderId,
        shiprocketToken: srPayment.token,
        checkoutUrl: srPayment.checkoutUrl,
        customer: {
          name: shippingAddress.fullName,
          email: params.guestEmail || '',
          phone: shippingAddress.phone,
        },
      };
    }

    // 6. Fallback Razorpay Gateway Order for Online Payment
    const razorpayOrder = await RazorpayIntegrationService.createOrder(
      cartTotals.finalTotal,
      order.orderNumber,
      {
        orderId: order._id.toString(),
        customerPhone: shippingAddress.phone,
      }
    );

    // Create Payment Record
    await Payment.create({
      orderId: order._id,
      gateway: 'RAZORPAY',
      gatewayOrderId: razorpayOrder.id,
      razorpayOrderId: razorpayOrder.id,
      amount: CurrencyUtils.toPaise(cartTotals.finalTotal),
      currency: 'INR',
      status: 'INITIATED',
    });

    // Clear user cart
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
      paymentMethod: 'RAZORPAY',
      isCod: false,
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
   * Verify Shiprocket Payment, Commit Stock & Trigger Automation
   */
  static async verifyShiprocketPayment(data: {
    orderId?: string;
    shiprocketOrderId: string;
    shiprocketPaymentId: string;
    signature?: string;
    paymentMethod?: string;
  }) {
    const payment = await Payment.findOne({
      $or: [
        { shiprocketOrderId: data.shiprocketOrderId },
        { gatewayOrderId: data.shiprocketOrderId },
        ...(data.orderId ? [{ orderId: data.orderId }] : []),
      ],
    });

    if (!payment) {
      throw { statusCode: 404, code: 'PAYMENT_RECORD_NOT_FOUND', message: 'Payment record not found for Shiprocket order.' };
    }

    const order = await Order.findById(payment.orderId);
    if (!order) {
      throw { statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Associated order not found.' };
    }

    const isValid = ShiprocketPaymentService.verifyPayment(
      data.shiprocketOrderId,
      data.shiprocketPaymentId,
      data.signature
    );

    if (!isValid) {
      payment.status = 'FAILED';
      payment.errorDescription = 'Shiprocket verification failed';
      await payment.save();
      throw { statusCode: 400, code: 'INVALID_PAYMENT_SIGNATURE', message: 'Payment verification failed.' };
    }

    // Update payment record
    payment.status = 'SUCCESS';
    payment.shiprocketPaymentId = data.shiprocketPaymentId;
    payment.gatewayPaymentId = data.shiprocketPaymentId;
    payment.gatewaySignature = data.signature;
    payment.method = data.paymentMethod || 'SHIPROCKET_UPI';
    await payment.save();

    // Update order status
    order.paymentStatus = 'PAID';
    order.orderStatus = 'CONFIRMED';
    order.orderTimeline.push({
      status: 'CONFIRMED',
      timestamp: new Date(),
      note: `Payment verified via Shiprocket (${data.shiprocketPaymentId})`,
    });
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
      paymentMethod: 'SHIPROCKET',
      paymentStatus: 'PAID',
    });

    try {
      const pdfPath = await InvoicePdfService.generateInvoicePdf(order, invoice);
      invoice.pdfPath = pdfPath;
      invoice.pdfUrl = `/api/v1/invoices/${order._id}/download`;
      await invoice.save();
    } catch (pdfErr) {
      logger.error('Invoice PDF generation failed for Shiprocket order:', pdfErr);
    }

    // Trigger Multi-Channel Automation asynchronously
    OrderNotificationDispatcher.dispatchAll(order, 'CONFIRMED');
    WhatsAppIntegrationService.sendOrderConfirmation(order, invoice.pdfUrl).catch((err) =>
      logger.error('Async WhatsApp notification error for Shiprocket order:', err)
    );

    // Update order fulfillmentStage and initialize Shipment record
    order.fulfillmentStage = 'NEW_ORDER';
    await order.save();
    await Shipment.findOneAndUpdate(
      { orderId: order._id },
      { $set: { currentStatus: 'CONFIRMED', fulfillmentStage: 'NEW_ORDER' } },
      { upsert: true }
    );
    logger.info(`Prepaid Shiprocket Order #${order.orderNumber} placed in NEW_ORDER state awaiting admin fulfillment.`);

    return {
      success: true,
      orderNumber: order.orderNumber,
      orderId: order._id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceUrl: invoice.pdfUrl,
    };
  }

  /**
   * Verify Payment (supports both Shiprocket and Razorpay)
   */
  static async verifyPayment(data: {
    orderId?: string;
    shiprocketOrderId?: string;
    shiprocketPaymentId?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    signature?: string;
    paymentMethod?: string;
  }) {
    // If Shiprocket Order ID is supplied, route to Shiprocket verifier
    if (data.shiprocketOrderId || (!data.razorpayOrderId && data.orderId)) {
      return OrderService.verifyShiprocketPayment({
        orderId: data.orderId,
        shiprocketOrderId: data.shiprocketOrderId || '',
        shiprocketPaymentId: data.shiprocketPaymentId || data.razorpayPaymentId || `pay_sr_${Date.now()}`,
        signature: data.signature || data.razorpaySignature,
        paymentMethod: data.paymentMethod || 'SHIPROCKET_PAY',
      });
    }
    if (!data.razorpayOrderId || !data.razorpayPaymentId || !data.razorpaySignature) {
      throw { statusCode: 400, code: 'INVALID_PAYMENT_DATA', message: 'Missing payment signature or order ID.' };
    }

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
    order.orderTimeline.push({
      status: 'CONFIRMED',
      timestamp: new Date(),
      note: `Payment verified via Razorpay (${data.razorpayPaymentId})`,
    });
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

    // Trigger Multi-Channel Automation asynchronously
    OrderNotificationDispatcher.dispatchAll(order, 'CONFIRMED');
    WhatsAppIntegrationService.sendOrderConfirmation(order, invoice.pdfUrl).catch((err) =>
      logger.error('Async WhatsApp notification error for Razorpay order:', err)
    );

    // Update order fulfillmentStage and initialize Shipment record
    order.fulfillmentStage = 'NEW_ORDER';
    await order.save();
    await Shipment.findOneAndUpdate(
      { orderId: order._id },
      { $set: { currentStatus: 'CONFIRMED', fulfillmentStage: 'NEW_ORDER' } },
      { upsert: true }
    );
    logger.info(`Prepaid Shiprocket Order #${order.orderNumber} placed in NEW_ORDER state awaiting admin fulfillment.`);

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
  static async cancelOrder(
    orderId: string,
    reason: string = 'Customer cancellation',
    userId?: string,
    userRole?: string
  ) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw { statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found.' };
    }

    // Access control verification: customer can only cancel their own order
    if (userId && userRole !== 'admin' && userRole !== 'super_admin' && userRole !== 'support_manager') {
      if (order.userId && order.userId.toString() !== userId.toString()) {
        throw {
          statusCode: 403,
          code: 'FORBIDDEN',
          message: 'You are not authorized to cancel this order.',
        };
      }
    }

    if (['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].includes(order.orderStatus)) {
      throw {
        statusCode: 400,
        code: 'CANNOT_CANCEL_ORDER',
        message: `Order cannot be cancelled in status ${order.orderStatus}.`,
      };
    }

    // Restock items
    for (const item of order.items) {
      const isCommitted = order.paymentStatus === 'PAID' || order.paymentMethod === 'COD';
      const inv = await Inventory.findOne({ variantId: item.variantId });
      if (inv) {
        const prevAvailable = inv.availableStock;
        if (isCommitted) {
          inv.stockOnHand += item.quantity;
          inv.availableStock += item.quantity;
        } else {
          inv.reservedStock = Math.max(0, inv.reservedStock - item.quantity);
          inv.availableStock += item.quantity;
        }
        await inv.save();

        await InventoryTransaction.create({
          inventoryId: inv._id,
          variantId: item.variantId,
          orderId: order._id,
          changeQuantity: item.quantity,
          previousQuantity: prevAvailable,
          newQuantity: inv.availableStock,
          type: 'ORDER_CANCELLED_RESTOCK',
          reason,
        });
      }
    }

    order.orderStatus = 'CANCELLED';
    order.cancellationReason = reason;
    order.orderTimeline.push({
      status: 'CANCELLED',
      timestamp: new Date(),
      note: `Order cancelled. Reason: ${reason}`,
    });
    await order.save();

    // Cancel associated shipment if exists
    const shipment = await Shipment.findOne({ orderId: order._id });
    if (shipment) {
      shipment.currentStatus = 'CANCELLED';
      shipment.fulfillmentStage = 'CANCELLED';
      await shipment.save();
      if (shipment.shiprocketOrderId) {
        ShiprocketIntegrationService.cancelOrder([shipment.shiprocketOrderId]).catch((err) => {
          logger.warn(`Shiprocket order cancellation failed for ${shipment.shiprocketOrderId}:`, err);
        });
      }
    }

    // Notify customer
    OrderNotificationDispatcher.dispatchAll(order, 'CANCELLED');

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

  static async getOrderById(orderId: string, userId?: string, userRole?: string) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw { statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found.' };
    }

    // Backend Order Ownership Security Validation
    if (order.userId) {
      if (!userId) {
        throw {
          statusCode: 401,
          code: 'UNAUTHORIZED',
          message: 'Please sign in to view this order.',
        };
      }
      if (userRole !== 'admin' && userRole !== 'super_admin' && userRole !== 'support_manager') {
        if (order.userId.toString() !== userId.toString()) {
          throw {
            statusCode: 403,
            code: 'FORBIDDEN',
            message: 'You are not authorized to view this order.',
          };
        }
      }
    }

    const shipment = await Shipment.findOne({ orderId: order._id });
    const invoice = await Invoice.findOne({ orderId: order._id });

    // If shipment has AWB, check for real Shiprocket tracking updates
    if (shipment?.awbCode) {
      try {
        const liveTracking = await ShiprocketIntegrationService.getTrackingByAwb(shipment.awbCode);
        if (liveTracking?.shipment_track_activities && liveTracking.shipment_track_activities.length > 0) {
          shipment.trackingHistory = liveTracking.shipment_track_activities.map((act: any) => ({
            status: act['current_status'] || act.activity || 'IN_TRANSIT',
            activity: act.activity || '',
            location: act.location || '',
            timestamp: new Date(act.date),
          }));
          if (liveTracking.current_status) {
            shipment.currentStatus = liveTracking.current_status;
          }
          await shipment.save();
        }
      } catch {
        // Fallback to persisted checkpoints
      }
    }

    return {
      order,
      shipment,
      invoice,
    };
  }

  static async trackOrderByNumber(orderNumber: string, phoneOrEmail: string, userId?: string) {
    const cleanSearch = phoneOrEmail ? phoneOrEmail.trim().toLowerCase() : '';
    const order = await Order.findOne({
      orderNumber: orderNumber.trim().toUpperCase(),
      $or: [
        { guestEmail: cleanSearch },
        { guestPhone: new RegExp(cleanSearch.replace(/\D/g, '')) },
        { 'shippingAddress.phone': new RegExp(cleanSearch.replace(/\D/g, '')) },
        ...(userId ? [{ userId }] : []),
      ],
    });

    if (!order) {
      throw { statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'No matching order found with the provided details.' };
    }

    // Backend ownership verification if order belongs to a customer
    if (order.userId && userId && order.userId.toString() !== userId.toString()) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'You are not authorized to view tracking for this order.' };
    }

    const shipment = await Shipment.findOne({ orderId: order._id });
    return { order, shipment };
  }

  /**
   * Handle incoming Shiprocket tracking webhook and sync order & shipment state
   */
  static async handleShiprocketWebhook(payload: any, headers?: any) {
    logger.info(`Received Shiprocket webhook payload: ${JSON.stringify(payload)}`);

    // Verify webhook authentication token if configured
    const webhookToken =
      headers?.['x-shiprocket-token'] ||
      headers?.['x-api-key'] ||
      payload?.token ||
      headers?.authorization?.replace('Bearer ', '');

    if (env.SHIPROCKET_WEBHOOK_SECRET && webhookToken) {
      if (webhookToken !== env.SHIPROCKET_WEBHOOK_SECRET) {
        logger.warn('Shiprocket webhook token mismatch rejected.');
        throw { statusCode: 401, code: 'UNAUTHORIZED_WEBHOOK', message: 'Invalid webhook security token.' };
      }
    }

    // Extract identifier fields from Shiprocket carrier payload
    const awb = (payload.awb || payload.awb_code || '').toString().trim();
    const courierName = (payload.courier_name || payload.courier || '').toString().trim();
    const rawStatus = (payload.current_status || payload.shipment_status || payload.status || '').toString().trim();
    const channelOrderId = (payload.channel_order_id || payload.order_id || '').toString().trim();
    const srOrderId = payload.sr_order_id || payload.shiprocket_order_id;
    const srShipmentId = payload.shipment_id;
    const location = (payload.location || payload.city || payload.scans?.[0]?.location || '').toString().trim();
    const activity = (payload.activity || payload.scans?.[0]?.activity || payload.current_status || '').toString().trim();
    const scanDate = payload.date || payload.scans?.[0]?.date || payload.current_timestamp || new Date();
    const etd = payload.etd || payload.estimated_delivery_date;

    // Map Shiprocket/Carrier raw status to our OrderStatusType
    const normalized = rawStatus.toUpperCase().replace(/[-_]/g, ' ');
    let mappedStatus: OrderStatusType | null = null;

    if (['PICKED UP', 'PICKUP COMPLETED', 'DISPATCHED', 'SHIPPED'].includes(normalized)) {
      mappedStatus = 'SHIPPED';
    } else if (['IN TRANSIT', 'REACHED AT HUB', 'REACHED AT DESTINATION', 'TRANSIT', 'OUT FOR PICKUP'].includes(normalized)) {
      mappedStatus = 'IN_TRANSIT';
    } else if (['OUT FOR DELIVERY'].includes(normalized)) {
      mappedStatus = 'OUT_FOR_DELIVERY';
    } else if (['DELIVERED'].includes(normalized)) {
      mappedStatus = 'DELIVERED';
    } else if (['UNDELIVERED', 'FAILED DELIVERY', 'DELIVERY FAILED', 'UNABLE TO CONTACT', 'NDR'].includes(normalized)) {
      mappedStatus = 'DELIVERY_FAILED';
    } else if (['RTO INITIATED', 'RTO DELIVERED', 'RETURNED', 'RTO OFD', 'RTO IN TRANSIT'].includes(normalized)) {
      mappedStatus = 'RETURNED';
    } else if (['DELAYED', 'SHIPMENT DELAYED', 'HELD AT HUB'].includes(normalized)) {
      mappedStatus = 'SHIPMENT_DELAYED';
    }

    // Locate the matching order and shipment
    let order = null;
    let shipment = null;

    if (channelOrderId) {
      order = await Order.findOne({ orderNumber: channelOrderId });
    }

    if (!order && awb) {
      order = await Order.findOne({ 'shipmentDetails.awbNumber': awb });
      if (!order) {
        shipment = await Shipment.findOne({ awbCode: awb });
        if (shipment?.orderId) {
          order = await Order.findById(shipment.orderId);
        }
      }
    }

    if (!order && (srOrderId || srShipmentId)) {
      shipment = await Shipment.findOne({
        $or: [
          ...(srOrderId ? [{ shiprocketOrderId: String(srOrderId) }] : []),
          ...(srShipmentId ? [{ shiprocketShipmentId: String(srShipmentId) }] : []),
        ],
      });
      if (shipment?.orderId) {
        order = await Order.findById(shipment.orderId);
      }
    }

    if (!order) {
      logger.warn(`No order found matching Shiprocket webhook: channelOrderId=${channelOrderId}, awb=${awb}, srOrderId=${srOrderId}`);
      return {
        success: false,
        code: 'ORDER_NOT_FOUND',
        message: 'No matching order found for this webhook event. Acknowledged to prevent retry loops.',
      };
    }

    // If order is in a terminal state (CANCELLED or REFUNDED), do not regress
    const terminalStatuses: OrderStatusType[] = ['CANCELLED', 'REFUNDED'];
    if (terminalStatuses.includes(order.orderStatus)) {
      logger.info(`Order ${order.orderNumber} is in terminal state '${order.orderStatus}'. Webhook status update ignored.`);
      return {
        success: true,
        message: `Order is already ${order.orderStatus}. Tracking scan ignored.`,
        currentStatus: order.orderStatus,
      };
    }

    // Check idempotency: If the latest timeline item already has identical status & close timestamp
    const latestTimeline = order.orderTimeline?.[order.orderTimeline.length - 1];
    const isDuplicate =
      latestTimeline &&
      latestTimeline.status === mappedStatus &&
      latestTimeline.source === 'SHIPROCKET_WEBHOOK' &&
      Math.abs(new Date(latestTimeline.timestamp).getTime() - new Date(scanDate).getTime()) < 30000;

    if (isDuplicate) {
      logger.info(`Duplicate Shiprocket scan event for order ${order.orderNumber}. Skipping duplicate entry.`);
      return {
        success: true,
        message: 'Duplicate event acknowledged without state modification.',
        orderNumber: order.orderNumber,
        status: order.orderStatus,
      };
    }

    // Update Order details
    if (mappedStatus) {
      order.orderStatus = mappedStatus;
    }

    order.shipmentDetails = {
      courierName: courierName || order.shipmentDetails?.courierName || 'Shiprocket Partner',
      awbNumber: awb || order.shipmentDetails?.awbNumber,
      trackingUrl: order.shipmentDetails?.trackingUrl || (awb ? `https://shiprocket.co/tracking/${awb}` : undefined),
      dispatchedAt: mappedStatus === 'SHIPPED' && !order.shipmentDetails?.dispatchedAt ? new Date(scanDate) : order.shipmentDetails?.dispatchedAt,
      deliveredAt: mappedStatus === 'DELIVERED' && !order.shipmentDetails?.deliveredAt ? new Date(scanDate) : order.shipmentDetails?.deliveredAt,
    };

    // Append to timeline
    order.orderTimeline = order.orderTimeline || [];
    order.orderTimeline.push({
      status: mappedStatus || order.orderStatus,
      timestamp: new Date(scanDate),
      note: activity || `Shiprocket carrier update: ${rawStatus}`,
      source: 'SHIPROCKET_WEBHOOK',
      location: location || '',
      authorName: courierName || 'Shiprocket Carrier',
    });

    // If DELIVERED, automatically mark COD payment as PAID
    if (mappedStatus === 'DELIVERED') {
      order.paymentStatus = 'PAID';
    }

    // If RETURNED, automatically restock inventory
    if (mappedStatus === 'RETURNED') {
      for (const item of order.items) {
        const inv = await Inventory.findOne({ variantId: item.variantId });
        if (inv) {
          inv.stockOnHand = inv.stockOnHand + item.quantity;
          inv.availableStock = inv.availableStock + item.quantity;
          inv.alertStatus = inv.availableStock <= inv.lowStockThreshold ? 'LOW_STOCK' : 'IN_STOCK';
          await inv.save();

          await InventoryTransaction.create({
            inventoryId: inv._id,
            variantId: item.variantId,
            orderId: order._id,
            changeQuantity: item.quantity,
            previousQuantity: inv.stockOnHand - item.quantity,
            newQuantity: inv.stockOnHand,
            type: 'ORDER_RETURNED_RESTOCK',
            reason: `Shiprocket Webhook: Order ${order.orderNumber} carrier returned. Stock replenished.`,
          });
        }
      }
    }

    await order.save();

    // Synchronize Shipment model record
    await Shipment.findOneAndUpdate(
      { orderId: order._id },
      {
        $set: {
          ...(mappedStatus ? { currentStatus: mappedStatus } : {}),
          ...(awb ? { awbCode: awb } : {}),
          ...(courierName ? { courierName } : {}),
          ...(etd ? { estimatedDeliveryDate: new Date(etd) } : {}),
          ...(mappedStatus === 'DELIVERED' ? { actualDeliveryDate: new Date(scanDate) } : {}),
        },
        $push: {
          trackingHistory: {
            status: mappedStatus || rawStatus || 'UPDATE',
            activity: activity || `Carrier status: ${rawStatus}`,
            location: location || '',
            timestamp: new Date(scanDate),
          },
        },
      },
      { upsert: true }
    );

    // Trigger Multi-Channel Customer Notifications asynchronously
    try {
      OrderNotificationDispatcher.dispatchAll(order, mappedStatus || order.orderStatus, {
        courierName: order.shipmentDetails?.courierName,
        awbNumber: order.shipmentDetails?.awbNumber,
        trackingUrl: order.shipmentDetails?.trackingUrl,
        location,
      });
    } catch (notifErr: any) {
      logger.warn('Non-blocking notification error after webhook update:', notifErr.message);
    }

    return {
      success: true,
      message: 'Shiprocket tracking webhook processed successfully.',
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
    };
  }
}

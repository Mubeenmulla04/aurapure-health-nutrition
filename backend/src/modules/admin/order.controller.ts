import { Request, Response, NextFunction } from 'express';
import { Order } from '../../models/order.model.js';
import { Invoice } from '../../models/invoice.model.js';
import { Shipment } from '../../models/shipment.model.js';
import { Payment } from '../../models/payment.model.js';
import { Inventory } from '../../models/inventory.model.js';
import { InventoryTransaction } from '../../models/inventoryTransaction.model.js';
import { AuditLog } from '../../models/auditLog.model.js';
import { InvoicePdfService } from '../../integrations/pdf/pdf.service.js';
import { WhatsAppIntegrationService } from '../../integrations/whatsapp/whatsapp.service.js';
import { ShiprocketIntegrationService } from '../../integrations/shiprocket/shiprocket.service.js';
import { OrderNotificationDispatcher } from '../orders/orderNotification.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { logger } from '../../utils/logger.js';
import fs from 'fs';

// Valid status transitions across full lifecycle
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PACKED', 'CANCELLED'],
  PACKED: ['READY_TO_SHIP', 'SHIPPED', 'CANCELLED'],
  READY_TO_SHIP: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'SHIPMENT_DELAYED', 'DELIVERY_FAILED', 'DELIVERED', 'CANCELLED'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'SHIPMENT_DELAYED', 'DELIVERY_FAILED', 'DELIVERED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'DELIVERY_FAILED'],
  DELIVERY_FAILED: ['OUT_FOR_DELIVERY', 'RETURNED'],
  SHIPMENT_DELAYED: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERY_FAILED'],
  DELIVERED: ['RETURN_REQUESTED'],
  RETURN_REQUESTED: ['RETURNED', 'DELIVERED'],
  RETURNED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

export class AdminOrderController {
  /**
   * List orders with search, operational category / status filters, and pagination
   */
  static async listOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 15));
      const skip = (page - 1) * limit;

      const { status, category, paymentStatus, search } = req.query;
      const query: any = {};

      // Operational Category Filters (Simplified 7-Tab Workflow)
      if (category && category !== 'ALL') {
        switch (category) {
          case 'NEW_ORDERS':
            query.$or = [
              { fulfillmentStage: 'NEW_ORDER' },
              { 'shipmentDetails.awbNumber': { $exists: false }, orderStatus: { $in: ['PENDING', 'CONFIRMED'] } },
            ];
            break;
          case 'ACCEPTED':
            query.$or = [
              { fulfillmentStage: { $in: ['ACCEPTED', 'LABEL_READY'] } },
              { 'shipmentDetails.awbNumber': { $exists: true }, orderStatus: { $in: ['CONFIRMED', 'PROCESSING'] } },
            ];
            break;
          case 'READY_FOR_PICKUP':
            query.$or = [
              { fulfillmentStage: 'READY_FOR_PICKUP' },
              { orderStatus: { $in: ['PACKED', 'READY_TO_SHIP'] } },
            ];
            break;
          case 'SHIPPED':
            query.orderStatus = { $in: ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] };
            break;
          case 'DELIVERED':
            query.orderStatus = 'DELIVERED';
            break;
          case 'EXCEPTIONS':
            query.orderStatus = { $in: ['DELIVERY_FAILED', 'SHIPMENT_DELAYED'] };
            break;
          case 'CANCELLED':
            query.orderStatus = { $in: ['CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED'] };
            break;
        }
      } else if (status && status !== 'ALL') {
        query.orderStatus = status;
      }

      if (paymentStatus && paymentStatus !== 'ALL') {
        query.paymentStatus = paymentStatus;
      }

      if (search) {
        const regex = new RegExp(String(search).trim(), 'i');
        query.$or = [
          { orderNumber: regex },
          { 'shippingAddress.fullName': regex },
          { 'shippingAddress.phone': regex },
          { guestEmail: regex },
        ];
      }

      const [
        total,
        orders,
        newOrdersCount,
        acceptedCount,
        readyForPickupCount,
        shippedCount,
        deliveredCount,
        exceptionsCount,
        cancelledCount,
      ] = await Promise.all([
        Order.countDocuments(query),
        Order.find(query)
          .populate('userId', 'name email phone')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Order.countDocuments({
          $or: [
            { fulfillmentStage: 'NEW_ORDER' },
            { 'shipmentDetails.awbNumber': { $exists: false }, orderStatus: { $in: ['PENDING', 'CONFIRMED'] } },
          ],
        }),
        Order.countDocuments({
          $or: [
            { fulfillmentStage: { $in: ['ACCEPTED', 'LABEL_READY'] } },
            { 'shipmentDetails.awbNumber': { $exists: true }, orderStatus: { $in: ['CONFIRMED', 'PROCESSING'] } },
          ],
        }),
        Order.countDocuments({
          $or: [
            { fulfillmentStage: 'READY_FOR_PICKUP' },
            { orderStatus: { $in: ['PACKED', 'READY_TO_SHIP'] } },
          ],
        }),
        Order.countDocuments({ orderStatus: { $in: ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } }),
        Order.countDocuments({ orderStatus: 'DELIVERED' }),
        Order.countDocuments({ orderStatus: { $in: ['DELIVERY_FAILED', 'SHIPMENT_DELAYED'] } }),
        Order.countDocuments({ orderStatus: { $in: ['CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED'] } }),
      ]);

      ApiResponse.success({
        res,
        data: {
          orders,
          total,
          page,
          totalPages: Math.ceil(total / limit),
          counts: {
            all: total,
            newOrders: newOrdersCount,
            accepted: acceptedCount,
            readyForPickup: readyForPickupCount,
            shipped: shippedCount,
            delivered: deliveredCount,
            exceptions: exceptionsCount,
            cancelled: cancelledCount,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single order details with customer, items, invoice, and shipment
   */
  static async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await Order.findById(id).populate('userId', 'name email phone');
      if (!order) {
        ApiResponse.error({ res, statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found.' });
        return;
      }

      const [invoice, shipment, payment] = await Promise.all([
        Invoice.findOne({ orderId: order._id }),
        Shipment.findOne({ orderId: order._id }),
        Payment.findOne({ orderId: order._id }),
      ]);

      ApiResponse.success({
        res,
        data: {
          order,
          invoice,
          shipment,
          payment,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update order status with state machine enforcement and inventory release on cancellation
   */
  static async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, note, location, manualTracking } = req.body;

      const order = await Order.findById(id);
      if (!order) {
        ApiResponse.error({ res, statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found.' });
        return;
      }

      const currentStatus = order.orderStatus;

      // Check transition validity
      const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
      if (!allowed.includes(status) && status !== currentStatus) {
        ApiResponse.error({
          res,
          statusCode: 400,
          code: 'INVALID_STATUS_TRANSITION',
          message: `Cannot transition order status from '${currentStatus}' to '${status}'. Allowed transitions: ${allowed.join(
            ', '
          )}`,
        });
        return;
      }

      order.orderStatus = status;

      // If manual tracking is provided
      if (manualTracking && manualTracking.awbNumber) {
        order.shipmentDetails = {
          courierName: manualTracking.courierName || 'Standard Express',
          awbNumber: manualTracking.awbNumber,
          trackingUrl: manualTracking.trackingUrl || `https://shiprocket.co/tracking/${manualTracking.awbNumber}`,
          dispatchedAt: manualTracking.dispatchedAt ? new Date(manualTracking.dispatchedAt) : new Date(),
        };

        // Also update or initialize Shipment record
        await Shipment.findOneAndUpdate(
          { orderId: order._id },
          {
            $set: {
              awbCode: manualTracking.awbNumber,
              courierName: manualTracking.courierName || 'Standard Express',
              trackingUrl: manualTracking.trackingUrl || `https://shiprocket.co/tracking/${manualTracking.awbNumber}`,
              currentStatus: status,
            },
            $push: {
              trackingHistory: {
                status,
                activity: `Shipment assigned to ${manualTracking.courierName || 'courier'} (AWB: ${manualTracking.awbNumber})`,
                location: location || 'Warehouse Dispatch Hub',
                timestamp: new Date(),
              },
            },
          },
          { upsert: true, new: true }
        );
      }

      // If moving to DELIVERED, ensure paymentStatus is marked PAID (especially for COD)
      if (status === 'DELIVERED') {
        order.paymentStatus = 'PAID';
        if (order.shipmentDetails) {
          order.shipmentDetails.deliveredAt = new Date();
        }
        await Shipment.findOneAndUpdate(
          { orderId: order._id },
          {
            $set: {
              currentStatus: 'DELIVERED',
              actualDeliveryDate: new Date(),
            },
            $push: {
              trackingHistory: {
                status: 'DELIVERED',
                activity: 'Order successfully delivered to customer doorstep',
                location: location || order.shippingAddress.city,
                timestamp: new Date(),
              },
            },
          }
        );
      }

      // If CANCELLED or RETURNED, release reserved/purchased stock
      if (status === 'CANCELLED' || status === 'RETURNED') {
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
              type: status === 'CANCELLED' ? 'ORDER_CANCELLED_RESTOCK' : 'ORDER_RETURNED_RESTOCK',
              reason: `Order ${order.orderNumber} ${status}: Stock returned to available warehouse inventory`,
              performedBy: req.user!.userId as any,
            });
          }
        }
      }

      // Append timeline with rich context
      order.orderTimeline = order.orderTimeline || [];
      order.orderTimeline.push({
        status,
        timestamp: new Date(),
        note: note || `Order status transitioned to ${status} by staff.`,
        source: 'ADMIN',
        location: location || 'Warehouse Dispatch Hub',
        updatedBy: req.user!.userId as any,
        authorName: req.user!.email || 'Admin',
      });

      await order.save();

      // Audit Log
      await AuditLog.create({
        userId: req.user!.userId as any,
        userName: req.user!.email || 'Admin',
        action: 'ORDER_STATUS_UPDATE',
        entity: 'ORDER',
        entityId: order._id.toString(),
        diff: {
          before: { status: currentStatus },
          after: { status, note, manualTracking },
        },
      });

      // Non-blocking Multi-Channel Customer Notifications (WhatsApp, SMS, Email)
      try {
        OrderNotificationDispatcher.dispatchAll(order, status, {
          courierName: order.shipmentDetails?.courierName,
          awbNumber: order.shipmentDetails?.awbNumber,
          trackingUrl: order.shipmentDetails?.trackingUrl,
          location: location || 'Warehouse Hub',
        });
      } catch (notifErr: any) {
        logger.warn(`Notification dispatch failed non-blockingly: ${notifErr.message}`);
      }

      ApiResponse.success({
        res,
        message: `Order #${order.orderNumber} status transitioned to '${status}'.`,
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel order with customer reason and inventory restock
   */
  static async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const order = await Order.findById(id);
      if (!order) {
        ApiResponse.error({ res, statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found.' });
        return;
      }

      if (order.orderStatus === 'CANCELLED') {
        ApiResponse.error({ res, statusCode: 400, code: 'ALREADY_CANCELLED', message: 'Order is already cancelled.' });
        return;
      }

      order.orderStatus = 'CANCELLED';
      order.cancellationReason = reason || 'Cancelled by Store Administrator';

      // Restock inventory
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
            type: 'ORDER_CANCELLED_RESTOCK',
            reason: `Restocked on order cancellation: ${order.cancellationReason}`,
            performedBy: req.user!.userId as any,
          });
        }
      }

      order.orderTimeline = order.orderTimeline || [];
      order.orderTimeline.push({
        status: 'CANCELLED',
        timestamp: new Date(),
        note: `Order cancelled. Reason: ${order.cancellationReason}`,
        updatedBy: req.user!.userId as any,
        authorName: req.user!.email,
      });

      await order.save();

      await AuditLog.create({
        userId: req.user!.userId as any,
        userName: req.user!.email,
        action: 'ORDER_CANCEL',
        entity: 'ORDER',
        entityId: order._id.toString(),
        diff: { reason: order.cancellationReason },
      });

      ApiResponse.success({
        res,
        message: `Order #${order.orderNumber} cancelled and items returned to available stock.`,
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add internal staff timeline note
   */
  static async addTimelineNote(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { note } = req.body;

      if (!note) {
        ApiResponse.error({ res, statusCode: 400, code: 'NOTE_REQUIRED', message: 'Note text is required.' });
        return;
      }

      const order = await Order.findById(id);
      if (!order) {
        ApiResponse.error({ res, statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found.' });
        return;
      }

      order.orderTimeline = order.orderTimeline || [];
      order.orderTimeline.push({
        status: order.orderStatus,
        timestamp: new Date(),
        note: note.trim(),
        updatedBy: req.user!.userId as any,
        authorName: req.user!.email,
      });

      await order.save();

      ApiResponse.success({
        res,
        message: 'Internal note added to order timeline.',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download generated PDF Tax Invoice
   */
  static async downloadInvoicePdf(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await Order.findById(id);
      if (!order) {
        ApiResponse.error({ res, statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found.' });
        return;
      }

      let invoice = await Invoice.findOne({ orderId: order._id });
      if (!invoice) {
        const invNumber = `AP-INV-${order.orderNumber.replace('ORD-', '')}`;
        const taxTotal = order.pricing.taxGst || Math.round(order.pricing.finalTotal * (18 / 118));
        invoice = await Invoice.create({
          orderId: order._id,
          invoiceNumber: invNumber,
          invoiceDate: order.createdAt || new Date(),
          businessDetails: {
            name: 'AuraPure Nutrition Private Limited',
            address: '108 Bio-Valley Tech Park, Whitefield, Bengaluru, KA 560066',
            gstin: '29ABCDE1234F1Z5',
            pan: 'ABCDE1234F',
            email: 'support@aurapure.in',
            phone: '+91 80 4920 1800',
          },
          customerDetails: {
            name: order.shippingAddress.fullName,
            address: `${order.shippingAddress.addressLine1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
            phone: order.shippingAddress.phone,
            email: order.guestEmail,
          },
          subtotal: order.pricing.subtotal,
          discount: order.pricing.couponDiscount,
          taxBreakup: {
            cgst: Math.round(taxTotal / 2),
            sgst: Math.round(taxTotal / 2),
            igst: 0,
            totalTax: taxTotal,
          },
          shippingFee: order.pricing.shippingFee,
          totalPayable: order.pricing.finalTotal,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          isSentEmail: false,
          isSentWhatsApp: false,
        });
      }

      const filePath = await InvoicePdfService.generateInvoicePdf(order, invoice);

      if (fs.existsSync(filePath)) {
        res.download(filePath, `${invoice.invoiceNumber}.pdf`);
      } else {
        ApiResponse.error({ res, statusCode: 500, code: 'PDF_FAILED', message: 'Failed to locate invoice file.' });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available couriers and rates for an order
   */
  static async getAvailableCouriers(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await Order.findById(id);
      if (!order) {
        ApiResponse.error({ res, statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found.' });
        return;
      }

      const metrics = ShiprocketIntegrationService.calculatePackageMetrics(order.items);
      const couriers = await ShiprocketIntegrationService.getAvailableCouriers({
        deliveryPincode: order.shippingAddress.pincode,
        weight: metrics.weight,
        cod: order.paymentMethod === 'COD',
      });

      ApiResponse.success({
        res,
        data: {
          metrics,
          couriers,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Stage 2: Accept Order & Create Shiprocket Shipment (Assign AWB & Generate Label)
   */
  static async acceptOrderAndCreateShipment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { courierCompanyId } = req.body;

      const order = await Order.findById(id);
      if (!order) {
        ApiResponse.error({ res, statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found.' });
        return;
      }

      if (order.orderStatus === 'CANCELLED' || order.orderStatus === 'REFUNDED') {
        ApiResponse.error({
          res,
          statusCode: 400,
          code: 'ORDER_TERMINAL',
          message: `Cannot fulfill order in ${order.orderStatus} state.`,
        });
        return;
      }

      // Check if shipment is already generated to prevent duplicate bookings
      const existingShipment = await Shipment.findOne({ orderId: order._id });
      if (existingShipment?.awbCode && order.shipmentDetails?.awbNumber) {
        ApiResponse.success({
          res,
          message: `Shipment already exists for Order #${order.orderNumber} (AWB: ${existingShipment.awbCode}). No duplicate created.`,
          data: { order, shipment: existingShipment, labelUrl: existingShipment.labelUrl },
        });
        return;
      }

      // Check stock availability
      for (const item of order.items) {
        const inv = await Inventory.findOne({ variantId: item.variantId });
        if (inv && inv.stockOnHand < item.quantity) {
          ApiResponse.error({
            res,
            statusCode: 400,
            code: 'INSUFFICIENT_STOCK',
            message: `Insufficient stock on hand for "${item.title}". Available: ${inv.stockOnHand}, Required: ${item.quantity}`,
          });
          return;
        }
      }

      // Execute Shiprocket booking (Adhoc Order + AWB + Label)
      const srResult = await ShiprocketIntegrationService.acceptAndCreateShipment(order, courierCompanyId);

      // Advance Order State to PROCESSING / LABEL_READY
      order.orderStatus = 'PROCESSING';
      order.fulfillmentStage = 'LABEL_READY';
      order.shipmentDetails = {
        courierName: srResult.courierName,
        courierCompanyId: srResult.courierCompanyId,
        awbNumber: srResult.awbCode,
        trackingUrl: srResult.trackingUrl,
        labelUrl: srResult.labelUrl,
        shiprocketOrderId: srResult.shiprocketOrderId,
        shiprocketShipmentId: srResult.shiprocketShipmentId,
        packageWeight: srResult.metrics.weight,
      };

      order.orderTimeline = order.orderTimeline || [];
      order.orderTimeline.push({
        status: 'PROCESSING',
        timestamp: new Date(),
        note: `Order accepted by staff. Shipment registered via ${srResult.courierName} (AWB: ${srResult.awbCode}). Shipping label generated.`,
        source: 'ADMIN',
        location: 'Bengaluru Fulfillment Hub',
        updatedBy: req.user!.userId as any,
        authorName: req.user!.email || 'Store Admin',
      });

      await order.save();

      // Upsert Shipment record
      const shipment = await Shipment.findOneAndUpdate(
        { orderId: order._id },
        {
          $set: {
            shiprocketOrderId: srResult.shiprocketOrderId,
            shiprocketShipmentId: srResult.shiprocketShipmentId,
            awbCode: srResult.awbCode,
            courierCompanyId: srResult.courierCompanyId,
            courierName: srResult.courierName,
            trackingUrl: srResult.trackingUrl,
            labelUrl: srResult.labelUrl,
            packageWeight: srResult.metrics.weight,
            dimensions: {
              length: srResult.metrics.length,
              breadth: srResult.metrics.breadth,
              height: srResult.metrics.height,
            },
            currentStatus: 'PROCESSING',
            fulfillmentStage: 'LABEL_READY',
            estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          },
          $push: {
            trackingHistory: {
              status: 'PROCESSING',
              activity: `Shipment registered with ${srResult.courierName} (AWB: ${srResult.awbCode})`,
              location: 'Bengaluru Fulfillment Hub',
              timestamp: new Date(),
            },
          },
        },
        { upsert: true, new: true }
      );

      // Dispatch non-blocking notification
      try {
        OrderNotificationDispatcher.dispatchAll(order, 'PROCESSING', {
          courierName: srResult.courierName,
          awbNumber: srResult.awbCode,
          trackingUrl: srResult.trackingUrl,
          location: 'Bengaluru Hub',
        });
      } catch (err: any) {
        logger.warn(`Non-blocking notification error: ${err.message}`);
      }

      await AuditLog.create({
        userId: req.user!.userId as any,
        userName: req.user!.email || 'Admin',
        action: 'ORDER_ACCEPT_SHIPMENT',
        entity: 'ORDER',
        entityId: order._id.toString(),
        diff: {
          awb: srResult.awbCode,
          courier: srResult.courierName,
          shipmentId: srResult.shiprocketShipmentId,
        },
      });

      ApiResponse.success({
        res,
        statusCode: 200,
        message: `Order #${order.orderNumber} accepted! AWB ${srResult.awbCode} generated with ${srResult.courierName}.`,
        data: {
          order,
          shipment,
          labelUrl: srResult.labelUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Stage 3: Download official Shipping Label
   */
  static async downloadShippingLabel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await Order.findById(id);
      if (!order) {
        ApiResponse.error({ res, statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found.' });
        return;
      }

      let shipment = await Shipment.findOne({ orderId: order._id });
      let labelUrl = shipment?.labelUrl || order.shipmentDetails?.labelUrl;

      if (!labelUrl && shipment?.shiprocketShipmentId) {
        const labelResult = await ShiprocketIntegrationService.generateLabel(shipment.shiprocketShipmentId);
        labelUrl = labelResult.labelUrl;
        if (labelUrl) {
          shipment.labelUrl = labelUrl;
          await shipment.save();
          if (order.shipmentDetails) {
            order.shipmentDetails.labelUrl = labelUrl;
            await order.save();
          }
        }
      }

      if (!labelUrl) {
        ApiResponse.error({
          res,
          statusCode: 404,
          code: 'LABEL_NOT_READY',
          message: 'Shipping label has not been generated for this order yet. Please click Accept Order first.',
        });
        return;
      }

      ApiResponse.success({
        res,
        data: {
          labelUrl,
          orderNumber: order.orderNumber,
          awbNumber: shipment?.awbCode || order.shipmentDetails?.awbNumber,
          courierName: shipment?.courierName || order.shipmentDetails?.courierName,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Stage 4: Mark Packed and Schedule Courier Pickup
   */
  static async schedulePickup(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { pickupDate } = req.body;

      const order = await Order.findById(id);
      if (!order) {
        ApiResponse.error({ res, statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found.' });
        return;
      }

      const shipment = await Shipment.findOne({ orderId: order._id });
      if (!shipment || !shipment.shiprocketShipmentId) {
        ApiResponse.error({
          res,
          statusCode: 400,
          code: 'SHIPMENT_NOT_INITIALIZED',
          message: 'Shipment has not been accepted or initialized in Shiprocket yet.',
        });
        return;
      }

      // If pickup is already scheduled, return existing token
      if (shipment.pickupTokenNumber && order.fulfillmentStage === 'READY_FOR_PICKUP') {
        ApiResponse.success({
          res,
          message: `Pickup already scheduled for Order #${order.orderNumber} (Token: ${shipment.pickupTokenNumber}).`,
          data: {
            order,
            shipment,
            pickupTokenNumber: shipment.pickupTokenNumber,
            pickupScheduledDate: shipment.pickupScheduledDate,
          },
        });
        return;
      }

      // Schedule pickup via Shiprocket API
      const pickupResult = await ShiprocketIntegrationService.schedulePickup(
        shipment.shiprocketShipmentId,
        pickupDate
      );

      // Advance internal status to READY_TO_SHIP (Awaiting courier handover)
      order.orderStatus = 'READY_TO_SHIP';
      order.fulfillmentStage = 'READY_FOR_PICKUP';
      if (order.shipmentDetails) {
        order.shipmentDetails.pickupTokenNumber = pickupResult.pickupTokenNumber;
      }

      order.orderTimeline = order.orderTimeline || [];
      order.orderTimeline.push({
        status: 'READY_TO_SHIP',
        timestamp: new Date(),
        note: `Parcel packed, label attached, and pickup scheduled with ${shipment.courierName || 'courier'} (Pickup Token: ${pickupResult.pickupTokenNumber}).`,
        source: 'ADMIN',
        location: 'Outbound Dispatch Dock',
        updatedBy: req.user!.userId as any,
        authorName: req.user!.email || 'Store Admin',
      });

      await order.save();

      // Update Shipment record
      shipment.currentStatus = 'READY_TO_SHIP';
      shipment.fulfillmentStage = 'READY_FOR_PICKUP';
      shipment.pickupTokenNumber = pickupResult.pickupTokenNumber;
      shipment.pickupScheduledDate = pickupResult.pickupScheduledDate;
      shipment.trackingHistory.push({
        status: 'READY_TO_SHIP',
        activity: `Pickup scheduled with ${shipment.courierName} (Token: ${pickupResult.pickupTokenNumber})`,
        location: 'Outbound Dispatch Dock',
        timestamp: new Date(),
      });
      await shipment.save();

      // Dispatch non-blocking notification
      try {
        OrderNotificationDispatcher.dispatchAll(order, 'READY_TO_SHIP', {
          courierName: shipment.courierName,
          awbNumber: shipment.awbCode,
          trackingUrl: shipment.trackingUrl,
          location: 'Outbound Dock',
        });
      } catch (err: any) {
        logger.warn(`Non-blocking notification error: ${err.message}`);
      }

      await AuditLog.create({
        userId: req.user!.userId as any,
        userName: req.user!.email || 'Admin',
        action: 'ORDER_SCHEDULE_PICKUP',
        entity: 'ORDER',
        entityId: order._id.toString(),
        diff: {
          token: pickupResult.pickupTokenNumber,
          date: pickupResult.pickupScheduledDate,
        },
      });

      ApiResponse.success({
        res,
        message: `Pickup scheduled successfully! Token: ${pickupResult.pickupTokenNumber}. Parcel is ready for courier collection.`,
        data: {
          order,
          shipment,
          pickupTokenNumber: pickupResult.pickupTokenNumber,
          pickupScheduledDate: pickupResult.pickupScheduledDate,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download Handover Manifest
   */
  static async downloadManifest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const shipment = await Shipment.findOne({ orderId: id });
      if (!shipment || !shipment.shiprocketShipmentId) {
        ApiResponse.error({
          res,
          statusCode: 400,
          code: 'SHIPMENT_NOT_FOUND',
          message: 'Shipment has not been registered yet.',
        });
        return;
      }

      const manifestResult = await ShiprocketIntegrationService.generateManifest(shipment.shiprocketShipmentId);
      shipment.manifestUrl = manifestResult.manifestUrl;
      await shipment.save();

      ApiResponse.success({
        res,
        data: {
          manifestUrl: manifestResult.manifestUrl,
          orderId: id,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

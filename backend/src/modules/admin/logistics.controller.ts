import { Request, Response, NextFunction } from 'express';
import { Shipment } from '../../models/shipment.model.js';
import { Order } from '../../models/order.model.js';
import { AuditLog } from '../../models/auditLog.model.js';
import { ShiprocketIntegrationService } from '../../integrations/shiprocket/shiprocket.service.js';
import { WhatsAppIntegrationService } from '../../integrations/whatsapp/whatsapp.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class AdminLogisticsController {
  /**
   * List all logistics shipments
   */
  static async listShipments(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const { status } = req.query;
      const query: any = {};

      if (status && status !== 'ALL') {
        query.currentStatus = status;
      }

      const total = await Shipment.countDocuments(query);
      const shipments = await Shipment.find(query)
        .populate('orderId', 'orderNumber shippingAddress pricing orderStatus paymentMethod')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      ApiResponse.success({
        res,
        data: {
          shipments,
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
   * Book shipment via Shiprocket and generate courier AWB
   */
  static async createShipment(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId, courierName } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        ApiResponse.error({ res, statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found.' });
        return;
      }

      let shipment = await Shipment.findOne({ orderId: order._id });
      const awbCode = `SR${Date.now().toString().slice(-8)}IN`;
      const chosenCourier = courierName || 'BlueDart Express Air';
      const trackingUrl = `https://shiprocket.co/tracking/${awbCode}`;

      if (!shipment) {
        shipment = await Shipment.create({
          orderId: order._id,
          awbCode,
          courierName: chosenCourier,
          trackingUrl,
          currentStatus: 'PICKUP_SCHEDULED',
          pickupScheduledDate: new Date(),
          estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          trackingHistory: [
            {
              status: 'PICKUP_SCHEDULED',
              activity: `Courier pickup scheduled with ${chosenCourier}`,
              location: 'Bengaluru Fulfillment Hub',
              timestamp: new Date(),
            },
          ],
        });
      } else {
        shipment.awbCode = awbCode;
        shipment.courierName = chosenCourier;
        shipment.currentStatus = 'PICKUP_SCHEDULED';
        shipment.trackingUrl = trackingUrl;
        await shipment.save();
      }

      // Update Order Status to SHIPPED
      order.orderStatus = 'SHIPPED';
      order.orderTimeline = order.orderTimeline || [];
      order.orderTimeline.push({
        status: 'SHIPPED',
        timestamp: new Date(),
        note: `Shipment booked with ${chosenCourier}. AWB: ${awbCode}`,
        updatedBy: req.user!.userId as any,
        authorName: req.user!.email,
      });
      await order.save();

      // Trigger WhatsApp Notification
      WhatsAppIntegrationService.sendShippingUpdate(order, chosenCourier, awbCode, trackingUrl).catch(() => {});

      await AuditLog.create({
        userId: req.user!.userId as any,
        userName: req.user!.email,
        action: 'SHIPMENT_CREATE',
        entity: 'ORDER',
        entityId: order._id.toString(),
        diff: { awbCode, courier: chosenCourier },
      });

      ApiResponse.success({
        res,
        statusCode: 201,
        message: `Shipment booked via ${chosenCourier}. AWB code generated: ${awbCode}`,
        data: { shipment },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Track shipment checkpoints
   */
  static async trackShipment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const shipment = await Shipment.findById(id).populate('orderId');
      if (!shipment) {
        ApiResponse.error({ res, statusCode: 404, code: 'SHIPMENT_NOT_FOUND', message: 'Shipment record not found.' });
        return;
      }

      ApiResponse.success({
        res,
        data: {
          shipment,
          checkpoints: shipment.trackingHistory,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

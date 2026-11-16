import axios from 'axios';
import { env } from '../../config/env.js';
import { Notification } from '../../models/notification.model.js';
import { logger } from '../../utils/logger.js';

export interface WhatsAppTemplatePayload {
  toPhone: string; // E.164 formatted Indian phone e.g. "919876543210"
  templateName: string;
  parameters: { type: 'text'; text: string }[];
  orderId?: string;
  userId?: string;
}

export class WhatsAppIntegrationService {
  /**
   * Dispatches WhatsApp Cloud API Template Message
   */
  static async sendTemplate(payload: WhatsAppTemplatePayload) {
    const cleanPhone = payload.toPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

    // Create audit notification record
    const notif = await Notification.create({
      userId: payload.userId,
      orderId: payload.orderId,
      channel: 'WHATSAPP',
      templateName: payload.templateName,
      recipient: formattedPhone,
      status: 'QUEUED',
      payload: payload.parameters,
      attempts: 1,
    });

    if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
      logger.warn(`WhatsApp credentials not configured. Mocking WhatsApp message to ${formattedPhone}`);
      notif.status = 'SENT';
      notif.sentAt = new Date();
      notif.externalMessageId = `mock_wamid_${Date.now()}`;
      await notif.save();
      return { success: true, mocked: true, messageId: notif.externalMessageId };
    }

    try {
      const url = `https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
      const body = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: payload.templateName,
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: payload.parameters,
            },
          ],
        },
      };

      const response = await axios.post(url, body, {
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      const messageId = response.data?.messages?.[0]?.id;
      notif.status = 'SENT';
      notif.sentAt = new Date();
      notif.externalMessageId = messageId;
      await notif.save();

      logger.info(`WhatsApp template "${payload.templateName}" sent to ${formattedPhone}. Message ID: ${messageId}`);
      return { success: true, messageId };
    } catch (error: any) {
      const errMsg = error.response?.data?.error?.message || error.message;
      logger.error(`Failed to send WhatsApp message to ${formattedPhone}: ${errMsg}`);
      notif.status = 'FAILED';
      notif.lastError = errMsg;
      await notif.save();
      return { success: false, error: errMsg };
    }
  }

  /**
   * Helper: Send Order Confirmation
   */
  static async sendOrderConfirmation(order: any, invoiceUrl?: string) {
    return this.sendTemplate({
      toPhone: order.shippingAddress.phone,
      templateName: 'order_confirmation',
      parameters: [
        { type: 'text', text: order.shippingAddress.fullName },
        { type: 'text', text: order.orderNumber },
        { type: 'text', text: `₹${order.pricing.finalTotal}` },
        { type: 'text', text: invoiceUrl || `${env.CLIENT_URL}/account/orders` },
      ],
      orderId: order._id.toString(),
      userId: order.userId?.toString(),
    });
  }

  /**
   * Helper: Send Shipping & Tracking Update
   */
  static async sendShippingUpdate(order: any, courierName: string, awbCode: string, trackingUrl: string) {
    return this.sendTemplate({
      toPhone: order.shippingAddress.phone,
      templateName: 'shipping_confirmation',
      parameters: [
        { type: 'text', text: order.shippingAddress.fullName },
        { type: 'text', text: order.orderNumber },
        { type: 'text', text: courierName },
        { type: 'text', text: awbCode },
        { type: 'text', text: trackingUrl },
      ],
      orderId: order._id.toString(),
      userId: order.userId?.toString(),
    });
  }

  /**
   * Helper: Send Generic Order Status Update
   */
  static async sendOrderStatusNotification(
    order: any,
    newStatus: string,
    trackingInfo?: { courierName?: string; awbNumber?: string; trackingUrl?: string; location?: string }
  ) {
    const trackingLink = trackingInfo?.trackingUrl || `${env.CLIENT_URL}/account/orders`;
    const courier = trackingInfo?.courierName || 'Courier Partner';
    const awb = trackingInfo?.awbNumber || 'In Transit';

    if (newStatus === 'SHIPPED') {
      return this.sendShippingUpdate(order, courier, awb, trackingLink);
    }

    return this.sendTemplate({
      toPhone: order.shippingAddress.phone,
      templateName: `order_${newStatus.toLowerCase()}`,
      parameters: [
        { type: 'text', text: order.shippingAddress.fullName || 'Customer' },
        { type: 'text', text: order.orderNumber },
        { type: 'text', text: newStatus.replace(/_/g, ' ') },
        { type: 'text', text: courier },
        { type: 'text', text: awb },
        { type: 'text', text: trackingLink },
      ],
      orderId: order._id.toString(),
      userId: order.userId?.toString(),
    });
  }
}

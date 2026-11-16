import { WhatsAppIntegrationService } from '../../integrations/whatsapp/whatsapp.service.js';
import { SmsIntegrationService } from '../../integrations/sms/sms.service.js';
import { EmailIntegrationService } from '../../integrations/email/email.service.js';
import { logger } from '../../utils/logger.js';

export interface ITrackingNotificationContext {
  courierName?: string;
  awbNumber?: string;
  trackingUrl?: string;
  location?: string;
  estimatedDeliveryDate?: Date;
}

export class OrderNotificationDispatcher {
  /**
   * Dispatches WhatsApp, SMS, and Email notifications concurrently and non-blockingly.
   */
  static dispatchAll(
    order: any,
    newStatus: string,
    trackingInfo?: ITrackingNotificationContext
  ): void {
    Promise.allSettled([
      // 1. WhatsApp Notification
      WhatsAppIntegrationService.sendOrderStatusNotification(order, newStatus, trackingInfo).catch((err) => {
        logger.warn(`WhatsApp dispatch warning for ${order.orderNumber}: ${err.message}`);
      }),

      // 2. SMS Notification
      order.shippingAddress?.phone
        ? SmsIntegrationService.sendOrderStatusSms(
            order.shippingAddress.phone,
            order.orderNumber,
            newStatus,
            trackingInfo
          ).catch((err) => {
            logger.warn(`SMS dispatch warning for ${order.orderNumber}: ${err.message}`);
          })
        : Promise.resolve(),

      // 3. Email Notification
      EmailIntegrationService.sendOrderStatusEmail(order, newStatus, trackingInfo).catch((err) => {
        logger.warn(`Email dispatch warning for ${order.orderNumber}: ${err.message}`);
      }),
    ]).then((results) => {
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      logger.info(
        `Dispatched multi-channel notifications for Order ${order.orderNumber} (${newStatus}): ${succeeded}/${results.length} channels processed.`
      );
    });
  }
}

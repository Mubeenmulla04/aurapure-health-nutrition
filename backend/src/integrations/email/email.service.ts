import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { Notification } from '../../models/notification.model.js';

export class EmailIntegrationService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter(): nodemailer.Transporter | null {
    if (this.transporter) return this.transporter;

    if (!env.SMTP_USER || !env.SMTP_PASS) {
      return null;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
      return this.transporter;
    } catch (err: any) {
      logger.error('Failed to create Nodemailer transporter:', err.message);
      return null;
    }
  }

  static async sendOrderStatusEmail(
    order: any,
    newStatus: string,
    trackingInfo?: { courierName?: string; awbNumber?: string; trackingUrl?: string; location?: string }
  ) {
    const recipientEmail = order.shippingAddress?.email || order.guestEmail || order.userId?.email;
    if (!recipientEmail) {
      logger.warn(`No recipient email found for order ${order.orderNumber}`);
      return { success: false, reason: 'NO_EMAIL' };
    }

    const humanStatus = newStatus.replace(/_/g, ' ');
    const trackingUrl = trackingInfo?.trackingUrl || `${env.CLIENT_URL}/account/orders`;
    const courier = trackingInfo?.courierName || 'Courier Partner';
    const awb = trackingInfo?.awbNumber;

    const subject = `AuraPure Update: Order #${order.orderNumber} is now ${humanStatus}`;
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="color: #059669; margin: 0; font-size: 24px;">AuraPure Health & Nutrition</h2>
          <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">Order Status Update</p>
        </div>
        <p style="font-size: 16px; color: #1e293b;">Hello <strong>${order.shippingAddress?.fullName || 'Customer'}</strong>,</p>
        <p style="font-size: 15px; color: #334155; line-height: 1.6;">
          Your order <strong>#${order.orderNumber}</strong> has been updated to:
        </p>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <span style="font-size: 18px; font-weight: bold; color: #166534; text-transform: uppercase; letter-spacing: 1px;">
            ${humanStatus}
          </span>
        </div>
        ${awb ? `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Courier:</strong> ${courier}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>AWB Tracking Number:</strong> ${awb}</p>
        </div>
        ` : ''}
        <div style="text-align: center; margin: 32px 0;">
          <a href="${trackingUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: bold; font-size: 15px; border-radius: 8px; display: inline-block;">
            Track Your Order
          </a>
        </div>
        <p style="font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 32px;">
          Thank you for choosing AuraPure Nutrition. If you have questions, reach us at support@aurapure.in.
        </p>
      </div>
    `;

    // Persist Notification audit record
    const notif = await Notification.create({
      userId: order.userId?._id || order.userId,
      orderId: order._id,
      channel: 'EMAIL',
      templateName: `email_order_${newStatus.toLowerCase()}`,
      recipient: recipientEmail,
      status: 'QUEUED',
      payload: { subject, newStatus, trackingInfo },
      attempts: 1,
    });

    const transporter = this.getTransporter();
    if (!transporter) {
      logger.info(`[DEV EMAIL SIMULATOR] Simulated email to ${recipientEmail} for Order #${order.orderNumber} (${humanStatus})`);
      notif.status = 'SENT';
      notif.sentAt = new Date();
      notif.externalMessageId = `mock_mail_${Date.now()}`;
      await notif.save();
      return { success: true, mocked: true };
    }

    try {
      const info = await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: recipientEmail,
        subject,
        html: htmlContent,
      });

      notif.status = 'SENT';
      notif.sentAt = new Date();
      notif.externalMessageId = info.messageId;
      await notif.save();

      logger.info(`Order status email sent to ${recipientEmail}. Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      logger.error(`Failed to send order status email to ${recipientEmail}: ${err.message}`);
      notif.status = 'FAILED';
      notif.lastError = err.message;
      await notif.save();
      return { success: false, error: err.message };
    }
  }
}

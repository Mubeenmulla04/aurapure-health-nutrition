import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { CurrencyUtils } from '../../utils/currency.js';

export class RazorpayIntegrationService {
  private static instance: Razorpay | null = null;

  static getInstance(): Razorpay {
    if (!this.instance) {
      this.instance = new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET,
      });
    }
    return this.instance;
  }

  /**
   * Create Razorpay Order
   * @param amountRupees Amount in INR (will be converted to paise)
   * @param receipt Internal unique order receipt string
   */
  static async createOrder(amountRupees: number, receipt: string, notes: Record<string, string> = {}) {
    try {
      const razorpay = this.getInstance();
      const amountPaise = CurrencyUtils.toPaise(amountRupees);

      const order = await razorpay.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt,
        notes,
        payment_capture: true,
      });

      logger.info(`Razorpay order created: ${order.id} for receipt: ${receipt}`);
      return order;
    } catch (error) {
      logger.error('Failed to create Razorpay order:', error);
      throw {
        statusCode: 502,
        code: 'PAYMENT_GATEWAY_ERROR',
        message: 'Could not initialize payment with payment gateway. Please try again.',
      };
    }
  }

  /**
   * Cryptographically verify Razorpay Payment Signature
   */
  static verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    const generated = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return generated === signature;
  }

  /**
   * Verify Webhook Signature
   */
  static verifyWebhookSignature(bodyString: string, signature: string): boolean {
    const generated = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(bodyString)
      .digest('hex');

    return generated === signature;
  }
}

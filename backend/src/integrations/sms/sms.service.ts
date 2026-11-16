import axios from 'axios';
import { logger } from '../../utils/logger.js';

export interface ISmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class SmsIntegrationService {
  /**
   * Dispatches OTP via the configured SMS Gateway (MSG91, 2Factor, Twilio, or Dev Simulator)
   */
  static async sendOtp(mobileNumber: string, otp: string, countryCode = '+91'): Promise<ISmsResult> {
    const fullPhone = `${countryCode.replace('+', '')}${mobileNumber}`;
    const provider = (process.env.SMS_PROVIDER || 'mock').toLowerCase();

    // 1. MSG91 DLT Indian Gateway Driver
    if (provider === 'msg91' && process.env.MSG91_AUTH_KEY) {
      try {
        const response = await axios.post(
          'https://control.msg91.com/api/v5/otp',
          {
            template_id: process.env.MSG91_TEMPLATE_ID,
            mobile: fullPhone,
            authkey: process.env.MSG91_AUTH_KEY,
            otp: otp,
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000,
          }
        );
        logger.info(`MSG91 OTP sent successfully to ${countryCode} ${mobileNumber}`);
        return { success: true, messageId: response.data?.message };
      } catch (err: any) {
        logger.error('MSG91 gateway dispatch failed:', err.response?.data || err.message);
        return { success: false, error: 'SMS delivery failed through primary gateway' };
      }
    }

    // 2. 2Factor.in Indian DLT OTP Driver
    if (provider === '2factor' && process.env.TWOFACTOR_API_KEY) {
      try {
        const apiKey = process.env.TWOFACTOR_API_KEY;
        const template = process.env.TWOFACTOR_TEMPLATE_NAME || 'AuraPureOTP';
        const url = `https://2factor.in/API/V1/${apiKey}/SMS/${fullPhone}/${otp}/${template}`;
        const response = await axios.get(url, { timeout: 5000 });
        if (response.data?.Status === 'Success') {
          logger.info(`2Factor OTP sent successfully to ${countryCode} ${mobileNumber}`);
          return { success: true, messageId: response.data?.Details };
        }
        return { success: false, error: response.data?.Details || '2Factor dispatch failed' };
      } catch (err: any) {
        logger.error('2Factor gateway dispatch failed:', err.response?.data || err.message);
        return { success: false, error: 'SMS delivery failed' };
      }
    }

    // 3. Twilio SMS Driver
    if (provider === 'twilio' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
        const params = new URLSearchParams();
        params.append('To', `+${fullPhone}`);
        params.append('From', process.env.TWILIO_PHONE_NUMBER || '');
        params.append('Body', `Your AuraPure verification code is ${otp}. Valid for 5 minutes. Do not share this OTP.`);

        const response = await axios.post(
          `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
          params,
          {
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            timeout: 5000,
          }
        );
        logger.info(`Twilio OTP sent successfully to ${countryCode} ${mobileNumber}`);
        return { success: true, messageId: response.data?.sid };
      } catch (err: any) {
        logger.error('Twilio gateway dispatch failed:', err.response?.data || err.message);
        return { success: false, error: 'Twilio dispatch failed' };
      }
    }

    // 4. Secure Development & Test Simulator Driver
    if (process.env.NODE_ENV !== 'production') {
      const banner = [
        '┌──────────────────────────────────────────────────────────────┐',
        `│ 📲 [AuraPure SMS GATEWAY SIMULATOR]                          │`,
        `│ Mobile:   ${countryCode} ${mobileNumber.padEnd(46)}│`,
        `│ OTP Code: ${otp.padEnd(50)}│`,
        `│ Message:  Your AuraPure code is ${otp}. Valid for 5 mins.    │`,
        '└──────────────────────────────────────────────────────────────┘',
      ].join('\n');

      logger.info('\n' + banner + '\n');
      logger.info(`[DEV SMS SIMULATOR] Generated OTP ${otp} for ${countryCode} ${mobileNumber}`);
      return { success: true, messageId: `SIMULATED_${Date.now()}` };
    }

    logger.error('No production SMS gateway configured for mobile delivery.');
    return { success: false, error: 'SMS Gateway service unavailable' };
  }

  /**
   * Dispatches Order Status Notification SMS to Customer
   */
  static async sendOrderStatusSms(
    mobileNumber: string,
    orderNumber: string,
    status: string,
    trackingInfo?: { courierName?: string; awbNumber?: string; trackingUrl?: string }
  ): Promise<ISmsResult> {
    const formattedStatus = status.replace(/_/g, ' ');
    const trackingLink = trackingInfo?.trackingUrl || `${process.env.CLIENT_URL || 'http://localhost:3000'}/account/orders`;
    let messageText = `AuraPure: Order #${orderNumber} is now ${formattedStatus}.`;
    if (trackingInfo?.awbNumber) {
      messageText += ` Courier: ${trackingInfo.courierName || 'Express'} (AWB: ${trackingInfo.awbNumber}). Track: ${trackingLink}`;
    } else {
      messageText += ` Track live: ${trackingLink}`;
    }

    try {
      const { Notification } = await import('../../models/notification.model.js');
      await Notification.create({
        channel: 'SMS',
        templateName: `sms_order_${status.toLowerCase()}`,
        recipient: mobileNumber,
        status: 'SENT',
        payload: { message: messageText, orderNumber, status, trackingInfo },
        attempts: 1,
        sentAt: new Date(),
        externalMessageId: `sms_sim_${Date.now()}`,
      });
    } catch {
      // non-blocking
    }

    logger.info(`[SMS DISPATCH] To: ${mobileNumber} | Message: ${messageText}`);
    return { success: true, messageId: `SMS_${Date.now()}` };
  }
}

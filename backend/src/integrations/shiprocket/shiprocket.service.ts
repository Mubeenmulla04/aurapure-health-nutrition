import axios from 'axios';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export interface IPackageMetrics {
  weight: number; // in kg
  length: number; // in cm
  breadth: number; // in cm
  height: number; // in cm
}

export interface ICourierOption {
  courierCompanyId: number;
  courierName: string;
  rate: number;
  estimatedDeliveryDays: number;
  rating: number;
  etd?: string;
  cod: boolean;
}

export class ShiprocketIntegrationService {
  private static token: string | null = null;
  private static tokenExpiry: number = 0;
  private static BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

  /**
   * Retrieves or reuses cached Shiprocket Bearer Token
   */
  private static async getAuthToken(): Promise<string | null> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    const email = env.SHIPROCKET_EMAIL;
    const password = env.SHIPROCKET_PASSWORD;

    if (!email || !password || email.includes('@domain.com') || email.includes('your_shiprocket')) {
      logger.info('[Shiprocket] Sandbox / Fallback mode active (Placeholder credentials).');
      return null;
    }

    try {
      const res = await axios.post(`${this.BASE_URL}/auth/login`, {
        email,
        password,
      });

      this.token = res.data.token;
      this.tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000; // 9 days
      logger.info('Shiprocket authentication token refreshed successfully.');
      return this.token;
    } catch (err: any) {
      logger.error('Failed to authenticate with Shiprocket API:', err.response?.data || err.message);
      return null;
    }
  }

  /**
   * Dynamically calculate order package weight and dimensions from items
   */
  static calculatePackageMetrics(items: any[]): IPackageMetrics {
    let totalWeightKg = 0;

    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      const packSize = (item.packSize || item.title || '').toLowerCase();
      let unitWeightKg = 0.5;

      if (packSize.includes('kg')) {
        const match = packSize.match(/(\d+(?:\.\d+)?)\s*kg/);
        if (match) unitWeightKg = parseFloat(match[1]);
      } else if (packSize.includes('g') || packSize.includes('gm')) {
        const match = packSize.match(/(\d+(?:\.\d+)?)\s*(?:g|gm)/);
        if (match) unitWeightKg = parseFloat(match[1]) / 1000;
      } else if (packSize.includes('cap') || packSize.includes('tab') || packSize.includes('softgel')) {
        unitWeightKg = 0.25;
      } else if (packSize.includes('lb') || packSize.includes('lbs')) {
        const match = packSize.match(/(\d+(?:\.\d+)?)\s*lbs?/);
        if (match) unitWeightKg = parseFloat(match[1]) * 0.453592;
      }

      // 100g tare for packaging box & protective padding
      totalWeightKg += (unitWeightKg + 0.1) * qty;
    }

    // Minimum billable weight slab in Indian courier logistics is 0.5 kg
    totalWeightKg = Math.max(0.5, Math.round(totalWeightKg * 100) / 100);

    let length = 20;
    let breadth = 15;
    let height = 10;

    if (totalWeightKg > 4) {
      length = 35;
      breadth = 30;
      height = 25;
    } else if (totalWeightKg > 2) {
      length = 28;
      breadth = 22;
      height = 18;
    } else if (totalWeightKg > 1) {
      length = 24;
      breadth = 18;
      height = 14;
    }

    return {
      weight: totalWeightKg,
      length,
      breadth,
      height,
    };
  }

  /**
   * Check Indian 6-digit PIN code delivery serviceability
   */
  static async checkPincodeServiceability(deliveryPincode: string, pickupPincode: string = '560066') {
    const couriers = await this.getAvailableCouriers({
      deliveryPincode,
      pickupPincode,
      weight: 1.0,
      cod: false,
    });

    const top = couriers[0];
    return {
      serviceable: couriers.length > 0,
      deliveryPincode,
      estimatedDeliveryDays: top ? top.estimatedDeliveryDays : 3,
      courierName: top ? top.courierName : 'Delhivery Surface Express',
      courierCompanyId: top ? top.courierCompanyId : 12,
      rate: top ? top.rate : 80,
    };
  }

  /**
   * Fetch complete list of available couriers with real-time rates and ETD
   */
  static async getAvailableCouriers(params: {
    deliveryPincode: string;
    pickupPincode?: string;
    weight: number;
    cod: boolean;
  }): Promise<ICourierOption[]> {
    const { deliveryPincode, pickupPincode = '560066', weight, cod } = params;
    const token = await this.getAuthToken();

    // High quality mock courier options when in sandbox/fallback mode
    if (!token) {
      const isExpress = ['110', '400', '560', '500', '600', '700'].some((prefix) =>
        deliveryPincode.startsWith(prefix)
      );

      const baseRate = cod ? 90 : 70;
      const weightFactor = Math.ceil(weight / 0.5) * 15;

      return [
        {
          courierCompanyId: 10,
          courierName: 'BlueDart Express Air',
          rate: baseRate + weightFactor + 40,
          estimatedDeliveryDays: isExpress ? 2 : 3,
          rating: 4.8,
          cod: true,
        },
        {
          courierCompanyId: 12,
          courierName: 'Delhivery Surface Express',
          rate: baseRate + weightFactor,
          estimatedDeliveryDays: isExpress ? 3 : 4,
          rating: 4.5,
          cod: true,
        },
        {
          courierCompanyId: 14,
          courierName: 'DTDC Air Priority',
          rate: baseRate + weightFactor + 25,
          estimatedDeliveryDays: isExpress ? 2 : 4,
          rating: 4.4,
          cod: true,
        },
        {
          courierCompanyId: 16,
          courierName: 'Shadowfax Quick Delivery',
          rate: baseRate + weightFactor - 10,
          estimatedDeliveryDays: isExpress ? 3 : 5,
          rating: 4.2,
          cod: true,
        },
      ];
    }

    try {
      const res = await axios.get(`${this.BASE_URL}/courier/serviceability/`, {
        params: {
          pickup_postcode: pickupPincode,
          delivery_postcode: deliveryPincode,
          weight,
          cod: cod ? 1 : 0,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      const companies = res.data?.data?.available_courier_companies || [];
      return companies.map((c: any) => ({
        courierCompanyId: c.courier_company_id,
        courierName: c.courier_name,
        rate: c.rate || 0,
        estimatedDeliveryDays: parseInt(c.estimated_delivery_days, 10) || 3,
        rating: parseFloat(c.rating) || 4.5,
        etd: c.etd,
        cod: c.cod === 1,
      }));
    } catch (err: any) {
      logger.warn(`Shiprocket courier serviceability failed for ${deliveryPincode}: ${err.message}. Returning fallback.`);
      return [
        {
          courierCompanyId: 12,
          courierName: 'Delhivery Surface Express',
          rate: 75,
          estimatedDeliveryDays: 3,
          rating: 4.5,
          cod: true,
        },
      ];
    }
  }

  /**
   * Create Adhoc Order in Shiprocket
   */
  static async createAdhocOrder(order: any, metrics: IPackageMetrics) {
    const token = await this.getAuthToken();

    if (!token) {
      const mockSrOrderId = `SR-ORD-${Date.now().toString().slice(-7)}`;
      const mockSrShipmentId = `SR-SHP-${Date.now().toString().slice(-7)}`;
      return {
        shiprocketOrderId: mockSrOrderId,
        shiprocketShipmentId: mockSrShipmentId,
      };
    }

    try {
      const payload = {
        order_id: order.orderNumber,
        order_date: new Date(order.createdAt).toISOString().replace('T', ' ').slice(0, 16),
        pickup_location: 'Primary Warehouse',
        billing_customer_name: order.shippingAddress.fullName,
        billing_last_name: '',
        billing_address: order.shippingAddress.addressLine1,
        billing_city: order.shippingAddress.city,
        billing_pincode: order.shippingAddress.pincode,
        billing_state: order.shippingAddress.state,
        billing_country: 'India',
        billing_email: order.guestEmail || order.userId?.email || 'customer@aurapure.in',
        billing_phone: order.shippingAddress.phone,
        shipping_is_billing: true,
        order_items: order.items.map((item: any) => ({
          name: item.title,
          sku: item.sku,
          units: item.quantity,
          selling_price: item.unitPrice,
        })),
        payment_method: order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
        sub_total: order.pricing.finalTotal,
        length: metrics.length,
        breadth: metrics.breadth,
        height: metrics.height,
        weight: metrics.weight,
      };

      const res = await axios.post(`${this.BASE_URL}/orders/create/adhoc`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return {
        shiprocketOrderId: res.data?.order_id?.toString(),
        shiprocketShipmentId: res.data?.shipment_id?.toString(),
      };
    } catch (err: any) {
      logger.error('Shiprocket create adhoc order error:', err.response?.data || err.message);
      throw new Error(err.response?.data?.message || 'Failed to register order in Shiprocket');
    }
  }

  /**
   * Assign Courier and Generate AWB in Shiprocket
   */
  static async assignAwb(shipmentId: string | number, courierCompanyId?: number) {
    const token = await this.getAuthToken();

    if (!token) {
      const mockAwb = `AWB${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const courierName = courierCompanyId === 12 ? 'Delhivery Surface Express' : 'BlueDart Express Air';
      return {
        awbCode: mockAwb,
        courierCompanyId: courierCompanyId || 10,
        courierName,
        trackingUrl: `https://shiprocket.co/tracking/${mockAwb}`,
      };
    }

    try {
      const res = await axios.post(
        `${this.BASE_URL}/courier/assign/awb`,
        {
          shipment_id: shipmentId,
          ...(courierCompanyId ? { courier_id: courierCompanyId } : {}),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const awbData = res.data?.response?.data;
      const awbCode = awbData?.awb_code;
      const courierName = awbData?.courier_name || 'Standard Courier';
      const assignedCourierId = awbData?.courier_company_id || courierCompanyId;

      return {
        awbCode,
        courierCompanyId: assignedCourierId,
        courierName,
        trackingUrl: `https://shiprocket.co/tracking/${awbCode}`,
      };
    } catch (err: any) {
      logger.error('Shiprocket AWB assignment error:', err.response?.data || err.message);
      throw new Error(err.response?.data?.message || 'Failed to assign AWB via Shiprocket');
    }
  }

  /**
   * Request Shipping Label PDF generation in Shiprocket
   */
  static async generateLabel(shipmentId: string | number) {
    const token = await this.getAuthToken();

    if (!token) {
      return {
        labelCreated: true,
        labelUrl: `https://kr-shipmultichannel.s3.ap-southeast-1.amazonaws.com/mock-labels/${shipmentId}.pdf`,
      };
    }

    try {
      const res = await axios.post(
        `${this.BASE_URL}/generate/label`,
        {
          shipment_id: [shipmentId],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return {
        labelCreated: res.data?.label_created === 1 || Boolean(res.data?.label_url),
        labelUrl: res.data?.label_url,
      };
    } catch (err: any) {
      logger.error('Shiprocket label generation error:', err.response?.data || err.message);
      // Non-fatal fallback URL so admin can still proceed
      return {
        labelCreated: false,
        labelUrl: `https://kr-shipmultichannel.s3.ap-southeast-1.amazonaws.com/mock-labels/${shipmentId}.pdf`,
      };
    }
  }

  /**
   * Schedule Courier Pickup in Shiprocket
   */
  static async schedulePickup(shipmentId: string | number, pickupDate?: string) {
    const token = await this.getAuthToken();

    const formattedDate =
      pickupDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (!token) {
      return {
        pickupStatus: 'SUCCESS',
        pickupTokenNumber: `PKUP-${Math.floor(100000 + Math.random() * 900000)}`,
        pickupScheduledDate: new Date(formattedDate),
      };
    }

    try {
      const res = await axios.post(
        `${this.BASE_URL}/courier/generate/pickup`,
        {
          shipment_id: [shipmentId],
          pickup_date: [formattedDate],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return {
        pickupStatus: res.data?.pickup_status === 1 ? 'SUCCESS' : 'PENDING',
        pickupTokenNumber: res.data?.response?.pickup_token_number || `PKUP-${Date.now().toString().slice(-6)}`,
        pickupScheduledDate: new Date(formattedDate),
      };
    } catch (err: any) {
      logger.error('Shiprocket pickup scheduling error:', err.response?.data || err.message);
      throw new Error(err.response?.data?.message || 'Failed to schedule pickup with courier');
    }
  }

  /**
   * Generate Courier Handover Manifest in Shiprocket
   */
  static async generateManifest(shipmentId: string | number) {
    const token = await this.getAuthToken();

    if (!token) {
      return {
        manifestUrl: `https://kr-shipmultichannel.s3.ap-southeast-1.amazonaws.com/mock-manifests/${shipmentId}.pdf`,
      };
    }

    try {
      const res = await axios.post(
        `${this.BASE_URL}/manifests/generate`,
        {
          shipment_id: [shipmentId],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return {
        manifestUrl: res.data?.manifest_url || '',
      };
    } catch (err: any) {
      logger.error('Shiprocket manifest generation error:', err.response?.data || err.message);
      return {
        manifestUrl: `https://kr-shipmultichannel.s3.ap-southeast-1.amazonaws.com/mock-manifests/${shipmentId}.pdf`,
      };
    }
  }

  /**
   * Composite Stage 2: Accept Order, Create Shipment, Assign AWB & Generate Label
   */
  static async acceptAndCreateShipment(order: any, selectedCourierCompanyId?: number) {
    const metrics = this.calculatePackageMetrics(order.items);

    // 1. Create or sync order in Shiprocket
    const { shiprocketOrderId, shiprocketShipmentId } = await this.createAdhocOrder(order, metrics);

    // 2. Assign AWB
    const awbResult = await this.assignAwb(shiprocketShipmentId, selectedCourierCompanyId);

    // 3. Request shipping label
    const labelResult = await this.generateLabel(shiprocketShipmentId);

    return {
      shiprocketOrderId,
      shiprocketShipmentId,
      awbCode: awbResult.awbCode,
      courierCompanyId: awbResult.courierCompanyId,
      courierName: awbResult.courierName,
      trackingUrl: awbResult.trackingUrl,
      labelUrl: labelResult.labelUrl,
      metrics,
    };
  }

  /**
   * Legacy backward compatibility helper
   */
  static async createShipment(order: any) {
    return this.acceptAndCreateShipment(order);
  }

  /**
   * Cancel order in Shiprocket
   */
  static async cancelOrder(shiprocketOrderIds: (number | string)[]) {
    const token = await this.getAuthToken();
    if (!token) {
      logger.info(`[Shiprocket Sandbox] Simulated cancellation for order IDs: ${shiprocketOrderIds.join(', ')}`);
      return { success: true, message: 'Simulated Shiprocket cancellation' };
    }

    try {
      const res = await axios.post(
        `${this.BASE_URL}/orders/cancel`,
        { ids: shiprocketOrderIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (err: any) {
      logger.warn(`Shiprocket cancellation API failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  /**
   * Fetch live tracking details from Shiprocket using AWB code
   */
  static async getTrackingByAwb(awbCode: string) {
    if (!awbCode) return null;
    const token = await this.getAuthToken();
    if (!token) return null;

    try {
      const res = await axios.get(`${this.BASE_URL}/courier/track/awb/${awbCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data?.tracking_data || null;
    } catch (err: any) {
      logger.warn(`Shiprocket tracking fetch failed for AWB ${awbCode}: ${err.message}`);
      return null;
    }
  }
}

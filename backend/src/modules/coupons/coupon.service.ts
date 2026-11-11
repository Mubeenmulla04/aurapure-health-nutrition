import { Coupon, ICoupon } from '../../models/coupon.model.js';
import { CouponUsage } from '../../models/couponUsage.model.js';

export class CouponService {
  static async validateCoupon(code: string, subtotal: number, userId?: string, guestEmail?: string) {
    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      isActive: true,
    });

    if (!coupon) {
      throw { statusCode: 400, code: 'COUPON_NOT_FOUND', message: 'Invalid coupon code.' };
    }

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      throw { statusCode: 400, code: 'COUPON_EXPIRED', message: 'This coupon has expired.' };
    }

    if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
      throw {
        statusCode: 400,
        code: 'MIN_ORDER_NOT_MET',
        message: `This coupon requires a minimum cart value of ₹${coupon.minOrderValue}.`,
      };
    }

    if (coupon.usageLimitTotal && coupon.timesUsed >= coupon.usageLimitTotal) {
      throw { statusCode: 400, code: 'USAGE_LIMIT_REACHED', message: 'This coupon has reached its maximum total usage limit.' };
    }

    // Check per-user limit
    if (userId || guestEmail) {
      const userUsageQuery: any = { couponId: coupon._id };
      if (userId) userUsageQuery.userId = userId;
      else if (guestEmail) userUsageQuery.guestEmail = guestEmail;

      const userUsages = await CouponUsage.countDocuments(userUsageQuery);
      if (userUsages >= coupon.usageLimitPerUser) {
        throw {
          statusCode: 400,
          code: 'USER_LIMIT_REACHED',
          message: 'You have already redeemed this coupon the maximum allowed times.',
        };
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENT') {
      discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountCap && discountAmount > coupon.maxDiscountCap) {
        discountAmount = coupon.maxDiscountCap;
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, subtotal);
    }

    return {
      coupon,
      code: coupon.code,
      discountAmount,
      description: coupon.description,
    };
  }

  static async listAdmin() {
    return Coupon.find().sort({ createdAt: -1 });
  }

  static async create(data: Partial<ICoupon>) {
    return Coupon.create({
      ...data,
      code: data.code?.toUpperCase().trim(),
    });
  }

  static async update(id: string, data: Partial<ICoupon>) {
    return Coupon.findByIdAndUpdate(id, { $set: data }, { new: true });
  }
}

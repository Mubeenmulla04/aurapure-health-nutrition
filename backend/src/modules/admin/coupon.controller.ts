import { Request, Response, NextFunction } from 'express';
import { Coupon } from '../../models/coupon.model.js';
import { AuditLog } from '../../models/auditLog.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class AdminCouponController {
  /**
   * List all promotional coupons
   */
  static async listCoupons(_req: Request, res: Response, next: NextFunction) {
    try {
      const coupons = await Coupon.find().sort({ createdAt: -1 });
      ApiResponse.success({
        res,
        data: { coupons },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create promotional coupon
   */
  static async createCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        code,
        description,
        discountType,
        discountValue,
        minOrderValue,
        maxDiscountCap,
        startDate,
        endDate,
        usageLimitTotal,
        usageLimitPerUser,
        isActive,
      } = req.body;

      if (!code || !description || !discountType || !discountValue || !endDate) {
        ApiResponse.error({
          res,
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: 'Code, description, discountType, discountValue, and endDate are required.',
        });
        return;
      }

      const formattedCode = code.toUpperCase().trim();
      const existing = await Coupon.findOne({ code: formattedCode });
      if (existing) {
        ApiResponse.error({
          res,
          statusCode: 409,
          code: 'COUPON_EXISTS',
          message: `Coupon code '${formattedCode}' already exists.`,
        });
        return;
      }

      const coupon = await Coupon.create({
        code: formattedCode,
        description: description.trim(),
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: Number(minOrderValue) || 0,
        maxDiscountCap: maxDiscountCap ? Number(maxDiscountCap) : undefined,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: new Date(endDate),
        usageLimitTotal: usageLimitTotal ? Number(usageLimitTotal) : undefined,
        usageLimitPerUser: Number(usageLimitPerUser) || 1,
        timesUsed: 0,
        isActive: isActive !== undefined ? isActive : true,
      });

      await AuditLog.create({
        userId: req.user!.userId as any,
        userName: req.user!.email,
        action: 'COUPON_CREATE',
        entity: 'COUPON',
        entityId: coupon._id.toString(),
        diff: { after: { code: coupon.code, discountType, discountValue } },
      });

      ApiResponse.success({
        res,
        statusCode: 201,
        message: `Coupon '${coupon.code}' created successfully.`,
        data: { coupon },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update existing coupon
   */
  static async updateCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const coupon = await Coupon.findById(id);
      if (!coupon) {
        ApiResponse.error({ res, statusCode: 404, code: 'COUPON_NOT_FOUND', message: 'Coupon not found.' });
        return;
      }

      const before = { code: coupon.code, discountValue: coupon.discountValue, isActive: coupon.isActive };

      if (updates.code) coupon.code = updates.code.toUpperCase().trim();
      if (updates.description) coupon.description = updates.description.trim();
      if (updates.discountType) coupon.discountType = updates.discountType;
      if (updates.discountValue !== undefined) coupon.discountValue = Number(updates.discountValue);
      if (updates.minOrderValue !== undefined) coupon.minOrderValue = Number(updates.minOrderValue);
      if (updates.maxDiscountCap !== undefined) coupon.maxDiscountCap = Number(updates.maxDiscountCap) || undefined;
      if (updates.startDate) coupon.startDate = new Date(updates.startDate);
      if (updates.endDate) coupon.endDate = new Date(updates.endDate);
      if (updates.usageLimitTotal !== undefined) coupon.usageLimitTotal = Number(updates.usageLimitTotal) || undefined;
      if (updates.usageLimitPerUser !== undefined) coupon.usageLimitPerUser = Number(updates.usageLimitPerUser);
      if (typeof updates.isActive === 'boolean') coupon.isActive = updates.isActive;

      await coupon.save();

      await AuditLog.create({
        userId: req.user!.userId as any,
        userName: req.user!.email,
        action: 'COUPON_UPDATE',
        entity: 'COUPON',
        entityId: coupon._id.toString(),
        diff: { before, after: updates },
      });

      ApiResponse.success({
        res,
        message: `Coupon '${coupon.code}' updated successfully.`,
        data: { coupon },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete coupon
   */
  static async deleteCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const coupon = await Coupon.findById(id);
      if (!coupon) {
        ApiResponse.error({ res, statusCode: 404, code: 'COUPON_NOT_FOUND', message: 'Coupon not found.' });
        return;
      }

      await Coupon.findByIdAndDelete(id);

      await AuditLog.create({
        userId: req.user!.userId as any,
        userName: req.user!.email,
        action: 'COUPON_DELETE',
        entity: 'COUPON',
        entityId: id,
        diff: { before: { code: coupon.code } },
      });

      ApiResponse.success({
        res,
        message: `Coupon '${coupon.code}' deleted successfully.`,
      });
    } catch (error) {
      next(error);
    }
  }
}

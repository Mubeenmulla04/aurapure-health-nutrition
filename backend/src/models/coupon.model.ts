import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  description: string;
  discountType: 'PERCENT' | 'FLAT';
  discountValue: number; // Percentage (e.g. 15 for 15%) or Flat Rupees (e.g. 200 for ₹200 off)
  minOrderValue: number; // In Rupees
  maxDiscountCap?: number; // In Rupees (e.g. max ₹500 off)
  startDate: Date;
  endDate: Date;
  usageLimitTotal?: number;
  usageLimitPerUser: number;
  timesUsed: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    discountType: {
      type: String,
      enum: ['PERCENT', 'FLAT'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 1,
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    maxDiscountCap: {
      type: Number,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    usageLimitTotal: {
      type: Number,
    },
    usageLimitPerUser: {
      type: Number,
      default: 1,
    },
    timesUsed: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const Coupon = mongoose.model<ICoupon>('Coupon', CouponSchema);

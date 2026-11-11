import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICouponUsage extends Document {
  couponId: Types.ObjectId;
  userId?: Types.ObjectId;
  guestEmail?: string;
  orderId: Types.ObjectId;
  discountApplied: number;
  usedAt: Date;
}

const CouponUsageSchema = new Schema<ICouponUsage>(
  {
    couponId: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      sparse: true,
    },
    guestEmail: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    discountApplied: {
      type: Number,
      required: true,
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

CouponUsageSchema.index({ couponId: 1, userId: 1 });
CouponUsageSchema.index({ couponId: 1, guestEmail: 1 });

export const CouponUsage = mongoose.model<ICouponUsage>('CouponUsage', CouponUsageSchema);

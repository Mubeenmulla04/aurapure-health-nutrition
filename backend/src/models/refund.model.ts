import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRefund extends Document {
  orderId: Types.ObjectId;
  paymentId: Types.ObjectId;
  razorpayRefundId?: string;
  amount: number; // in paise
  reason: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  initiatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RefundSchema = new Schema<IRefund>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },
    razorpayRefundId: {
      type: String,
      sparse: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    initiatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const Refund = mongoose.model<IRefund>('Refund', RefundSchema);

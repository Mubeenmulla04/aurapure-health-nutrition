import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPayment extends Document {
  orderId: Types.ObjectId;
  gateway: 'SHIPROCKET' | 'RAZORPAY';
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  shiprocketOrderId?: string;
  shiprocketPaymentId?: string;
  shiprocketToken?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number; // in paise
  currency: string; // 'INR'
  status: 'INITIATED' | 'SUCCESS' | 'FAILED' | 'ATTEMPTED';
  method?: string; // 'card', 'upi', 'netbanking'
  errorCode?: string;
  errorDescription?: string;
  webhookEvents: any[];
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    gateway: {
      type: String,
      enum: ['SHIPROCKET', 'RAZORPAY'],
      default: 'SHIPROCKET',
      index: true,
    },
    gatewayOrderId: {
      type: String,
      sparse: true,
      index: true,
    },
    gatewayPaymentId: {
      type: String,
      sparse: true,
      index: true,
    },
    gatewaySignature: {
      type: String,
    },
    shiprocketOrderId: {
      type: String,
      sparse: true,
      index: true,
    },
    shiprocketPaymentId: {
      type: String,
      sparse: true,
      index: true,
    },
    shiprocketToken: {
      type: String,
    },
    razorpayOrderId: {
      type: String,
      sparse: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      sparse: true,
      index: true,
    },
    razorpaySignature: {
      type: String,
    },
    amount: {
      type: Number,
      required: true, // in paise
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['INITIATED', 'SUCCESS', 'FAILED', 'ATTEMPTED'],
      default: 'INITIATED',
      index: true,
    },
    method: String,
    errorCode: String,
    errorDescription: String,
    webhookEvents: {
      type: Schema.Types.Mixed,
      default: [],
    },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);

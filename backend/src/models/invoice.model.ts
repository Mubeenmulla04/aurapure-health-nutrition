import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IInvoice extends Document {
  orderId: Types.ObjectId;
  invoiceNumber: string; // e.g. "INV-2026-0001"
  invoiceDate: Date;
  businessDetails: {
    name: string;
    address: string;
    gstin: string;
    pan: string;
    email: string;
    phone: string;
  };
  customerDetails: {
    name: string;
    address: string;
    phone: string;
    email?: string;
  };
  subtotal: number;
  discount: number;
  taxBreakup: {
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
  };
  shippingFee: number;
  totalPayable: number;
  paymentMethod: string;
  paymentStatus: string;
  pdfPath?: string;
  pdfUrl?: string;
  isSentEmail: boolean;
  isSentWhatsApp: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    businessDetails: {
      name: { type: String, default: 'AuraPure Nutrition Private Limited' },
      address: { type: String, default: '108 Bio-Valley Tech Park, Whitefield, Bengaluru, Karnataka 560066' },
      gstin: { type: String, default: '29ABCDE1234F1Z5' },
      pan: { type: String, default: 'ABCDE1234F' },
      email: { type: String, default: 'support@aurapure.in' },
      phone: { type: String, default: '+91 80 4920 1800' },
    },
    customerDetails: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      phone: { type: String, required: true },
      email: String,
    },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    taxBreakup: {
      cgst: { type: Number, default: 0 },
      sgst: { type: Number, default: 0 },
      igst: { type: Number, default: 0 },
      totalTax: { type: Number, required: true },
    },
    shippingFee: { type: Number, default: 0 },
    totalPayable: { type: Number, required: true },
    paymentMethod: { type: String, default: 'RAZORPAY' },
    paymentStatus: { type: String, default: 'PAID' },
    pdfPath: String,
    pdfUrl: String,
    isSentEmail: { type: Boolean, default: false },
    isSentWhatsApp: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);

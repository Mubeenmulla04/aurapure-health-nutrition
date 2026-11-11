import mongoose, { Document, Schema } from 'mongoose';

export interface IFAQ extends Document {
  question: string;
  answer: string;
  category: 'GENERAL' | 'NUTRITION' | 'SHIPPING' | 'ORDERS' | 'INGREDIENTS';
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FAQSchema = new Schema<IFAQ>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['GENERAL', 'NUTRITION', 'SHIPPING', 'ORDERS', 'INGREDIENTS'],
      default: 'GENERAL',
      index: true,
    },
    sortOrder: {
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

export const FAQ = mongoose.model<IFAQ>('FAQ', FAQSchema);

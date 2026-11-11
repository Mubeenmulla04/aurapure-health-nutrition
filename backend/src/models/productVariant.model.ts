import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IProductVariant extends Document {
  productId: Types.ObjectId;
  sku: string;
  title: string;
  flavor: string;
  packSize: string;
  weightGrams: number;
  mrp: number; // in Rupees
  sellingPrice: number; // in Rupees
  discountPercent: number;
  images: string[];
  barcode?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    flavor: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    packSize: {
      type: String,
      required: true,
      trim: true,
    },
    weightGrams: {
      type: Number,
      required: true,
    },
    mrp: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
      index: true,
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    images: {
      type: [String],
      required: true,
      validate: [(val: string[]) => val.length > 0, 'At least one image is required'],
    },
    barcode: {
      type: String,
      sparse: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

ProductVariantSchema.index({ productId: 1, flavor: 1, packSize: 1 }, { unique: true });

export const ProductVariant = mongoose.model<IProductVariant>('ProductVariant', ProductVariantSchema);

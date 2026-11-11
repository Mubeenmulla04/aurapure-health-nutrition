import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IInventory extends Document {
  variantId: Types.ObjectId;
  sku: string;
  stockOnHand: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
  alertStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>(
  {
    variantId: {
      type: Schema.Types.ObjectId,
      ref: 'ProductVariant',
      required: true,
      unique: true,
      index: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    stockOnHand: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    reservedStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    availableStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    alertStatus: {
      type: String,
      enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'],
      default: 'IN_STOCK',
      index: true,
    },
  },
  { timestamps: true }
);

// Pre-save recalculation of available stock and alert status
InventorySchema.pre('save', function (next) {
  this.availableStock = Math.max(0, this.stockOnHand - this.reservedStock);
  if (this.availableStock === 0) {
    this.alertStatus = 'OUT_OF_STOCK';
  } else if (this.availableStock <= this.lowStockThreshold) {
    this.alertStatus = 'LOW_STOCK';
  } else {
    this.alertStatus = 'IN_STOCK';
  }
  next();
});

export const Inventory = mongoose.model<IInventory>('Inventory', InventorySchema);

import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IInventoryTransaction extends Document {
  inventoryId: Types.ObjectId;
  variantId: Types.ObjectId;
  orderId?: Types.ObjectId;
  changeQuantity: number;
  previousQuantity: number;
  newQuantity: number;
  type: 'ORDER_HOLD' | 'PURCHASE_COMMIT' | 'ORDER_CANCELLED_RESTOCK' | 'MANUAL_RESTOCK' | 'DAMAGED_DISCARD';
  reason?: string;
  performedBy?: Types.ObjectId;
  createdAt: Date;
}

const InventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    inventoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true,
      index: true,
    },
    variantId: {
      type: Schema.Types.ObjectId,
      ref: 'ProductVariant',
      required: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    changeQuantity: {
      type: Number,
      required: true,
    },
    previousQuantity: {
      type: Number,
      required: true,
    },
    newQuantity: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['ORDER_HOLD', 'PURCHASE_COMMIT', 'ORDER_CANCELLED_RESTOCK', 'MANUAL_RESTOCK', 'DAMAGED_DISCARD'],
      required: true,
      index: true,
    },
    reason: String,
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const InventoryTransaction = mongoose.model<IInventoryTransaction>(
  'InventoryTransaction',
  InventoryTransactionSchema
);

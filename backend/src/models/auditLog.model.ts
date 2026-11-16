import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: Types.ObjectId;
  userName?: string;
  action: string; // e.g. 'PRODUCT_UPDATE', 'ORDER_STATUS_CHANGE', 'REFUND_INITIATED', 'INVENTORY_ADJUST'
  entity: 'PRODUCT' | 'ORDER' | 'INVENTORY' | 'COUPON' | 'REFUND' | 'CATEGORY' | 'USER' | 'SETTINGS' | 'STAFF';
  entityId: string;
  diff?: {
    before?: any;
    after?: any;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    userName: String,
    action: {
      type: String,
      required: true,
      index: true,
    },
    entity: {
      type: String,
      enum: ['PRODUCT', 'ORDER', 'INVENTORY', 'COUPON', 'REFUND', 'CATEGORY', 'USER', 'SETTINGS', 'STAFF'],
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    diff: {
      before: Schema.Types.Mixed,
      after: Schema.Types.Mixed,
    },
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

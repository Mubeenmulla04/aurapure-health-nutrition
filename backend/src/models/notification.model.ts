import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotification extends Document {
  userId?: Types.ObjectId;
  orderId?: Types.ObjectId;
  channel: 'WHATSAPP' | 'EMAIL' | 'SMS';
  templateName: string;
  recipient: string; // phone or email
  status: 'QUEUED' | 'SENT' | 'FAILED';
  payload: any;
  attempts: number;
  lastError?: string;
  externalMessageId?: string;
  sentAt?: Date;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      sparse: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
      sparse: true,
    },
    channel: {
      type: String,
      enum: ['WHATSAPP', 'EMAIL', 'SMS'],
      required: true,
      index: true,
    },
    templateName: {
      type: String,
      required: true,
    },
    recipient: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['QUEUED', 'SENT', 'FAILED'],
      default: 'QUEUED',
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastError: String,
    externalMessageId: String,
    sentAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

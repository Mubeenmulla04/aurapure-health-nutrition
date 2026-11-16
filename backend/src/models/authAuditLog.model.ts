import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAuthAuditLog extends Document {
  userId?: Types.ObjectId;
  mobileNumber: string;
  countryCode: string;
  event:
    | 'OTP_REQUESTED'
    | 'OTP_VERIFIED'
    | 'OTP_FAILED'
    | 'OTP_LIMIT_EXCEEDED'
    | 'LOGIN_SUCCESS'
    | 'ACCOUNT_CREATED'
    | 'LOGOUT_SINGLE'
    | 'LOGOUT_ALL'
    | 'MOBILE_CHANGE_REQUESTED'
    | 'MOBILE_CHANGE_COMPLETED'
    | 'SESSION_INACTIVITY_EXPIRED';
  status: 'SUCCESS' | 'FAILURE';
  reason?: string;
  ipAddress: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const AuthAuditLogSchema = new Schema<IAuthAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      sparse: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      index: true,
    },
    countryCode: {
      type: String,
      default: '+91',
    },
    event: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE'],
      required: true,
    },
    reason: {
      type: String,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuthAuditLog = mongoose.model<IAuthAuditLog>('AuthAuditLog', AuthAuditLogSchema);

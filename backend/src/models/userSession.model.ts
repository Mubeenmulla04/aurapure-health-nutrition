import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUserSession extends Document {
  userId: Types.ObjectId;
  refreshTokenHash: string;
  ipAddress: string;
  userAgent?: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  lastActivityAt: Date;
  expiresAt: Date;
  isRevoked: boolean;
  revokedAt?: Date;
  revokedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSessionSchema = new Schema<IUserSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
      default: 'Unknown Device',
    },
    deviceType: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown'],
      default: 'unknown',
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revokedAt: {
      type: Date,
    },
    revokedReason: {
      type: String,
    },
  },
  { timestamps: true }
);

UserSessionSchema.index({ userId: 1, isRevoked: 1 });

export const UserSession = mongoose.model<IUserSession>('UserSession', UserSessionSchema);

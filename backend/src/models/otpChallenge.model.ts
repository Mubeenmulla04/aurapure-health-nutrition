import mongoose, { Document, Schema } from 'mongoose';

export interface IOtpChallenge extends Document {
  mobileNumber: string;
  countryCode: string;
  otpHash: string;
  purpose: 'LOGIN' | 'CHANGE_MOBILE_OLD' | 'CHANGE_MOBILE_NEW';
  attempts: number;
  maxAttempts: number;
  resendCooldownUntil: Date;
  expiresAt: Date;
  ipAddress: string;
  userAgent?: string;
  isConsumed: boolean;
  consumedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OtpChallengeSchema = new Schema<IOtpChallenge>(
  {
    mobileNumber: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    countryCode: {
      type: String,
      required: true,
      default: '+91',
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['LOGIN', 'CHANGE_MOBILE_OLD', 'CHANGE_MOBILE_NEW'],
      default: 'LOGIN',
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    resendCooldownUntil: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL Index automatically deletes expired challenges
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
    },
    isConsumed: {
      type: Boolean,
      default: false,
    },
    consumedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

OtpChallengeSchema.index({ mobileNumber: 1, purpose: 1, isConsumed: 1 });

export const OtpChallenge = mongoose.model<IOtpChallenge>('OtpChallenge', OtpChallengeSchema);

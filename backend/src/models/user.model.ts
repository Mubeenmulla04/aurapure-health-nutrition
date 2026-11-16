import mongoose, { Document, Schema, Types } from 'mongoose';
import { RoleType } from './role.model.js';

export interface IUser extends Document {
  mobileNumber: string;
  countryCode: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  role: RoleType;
  roleId?: Types.ObjectId;
  isActive: boolean;
  isMobileVerified: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  refreshTokenHash?: string;
  lastLoginAt?: Date;
  lastActivityAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    countryCode: {
      type: String,
      required: true,
      default: '+91',
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      default: 'Customer',
    },
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: [
        'super_admin',
        'admin',
        'order_manager',
        'product_manager',
        'inventory_manager',
        'support_manager',
        'marketing_manager',
        'customer',
      ],
      default: 'customer',
      index: true,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isMobileVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    refreshTokenHash: {
      type: String,
      select: false,
    },
    lastLoginAt: {
      type: Date,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index to guarantee uniqueness of mobileNumber + countryCode
UserSchema.index({ mobileNumber: 1, countryCode: 1 }, { unique: true });

// Pre-save hook to keep phone and name synced for seamless compatibility
UserSchema.pre('save', function (next) {
  if (this.mobileNumber && !this.phone) {
    this.phone = this.mobileNumber;
  }
  if (this.fullName && (!this.name || this.name === 'Customer')) {
    this.name = this.fullName;
  } else if (this.name && !this.fullName) {
    this.fullName = this.name;
  }
  next();
});

export const User = mongoose.model<IUser>('User', UserSchema);

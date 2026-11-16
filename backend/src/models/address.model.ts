import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAddress extends Document {
  userId?: Types.ObjectId;
  fullName: string;
  phone: string;
  houseFlatNo?: string;
  apartmentBuilding?: string;
  streetArea?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    houseFlatNo: {
      type: String,
      trim: true,
    },
    apartmentBuilding: {
      type: String,
      trim: true,
    },
    streetArea: {
      type: String,
      trim: true,
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true,
    },
    addressLine2: {
      type: String,
      trim: true,
    },
    landmark: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
    },
    isDefaultShipping: {
      type: Boolean,
      default: false,
    },
    isDefaultBilling: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Address = mongoose.model<IAddress>('Address', AddressSchema);

import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IOrderItemSnapshot {
  productId: Types.ObjectId;
  variantId: Types.ObjectId;
  title: string;
  flavor: string;
  packSize: string;
  sku: string;
  quantity: number;
  unitPrice: number; // In Rupees
  mrp: number; // In Rupees
  total: number; // unitPrice * quantity
  image: string;
}

export interface IAddressSnapshot {
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
  country?: string;
}

export interface ICustomerSnapshot {
  fullName: string;
  email: string;
  phone: string;
  userId?: Types.ObjectId;
}

export interface IPricingSnapshot {
  subtotal: number;
  couponCode?: string;
  couponDiscount: number;
  shippingFee: number;
  taxGst: number;
  finalTotal: number;
}

export type OrderStatusType =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'SHIPMENT_DELAYED'
  | 'DELIVERY_FAILED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface IShipmentDetailsSnapshot {
  courierName?: string;
  courierCompanyId?: number;
  awbNumber?: string;
  trackingUrl?: string;
  labelUrl?: string;
  manifestUrl?: string;
  pickupTokenNumber?: string;
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  packageWeight?: number;
  dispatchedAt?: Date;
  deliveredAt?: Date;
}

export interface IOrderTimelineItem {
  status: string;
  timestamp: Date;
  note: string;
  source?: 'ADMIN' | 'SHIPROCKET_WEBHOOK' | 'SYSTEM' | 'CUSTOMER';
  updatedBy?: Types.ObjectId;
  authorName?: string;
  location?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId?: Types.ObjectId;
  guestEmail?: string;
  guestPhone?: string;
  customerSnapshot?: ICustomerSnapshot;
  items: IOrderItemSnapshot[];
  shippingAddress: IAddressSnapshot;
  billingAddress?: IAddressSnapshot;
  pricing: IPricingSnapshot;
  orderStatus: OrderStatusType;
  fulfillmentStage?:
    | 'NEW_ORDER'
    | 'ACCEPTED'
    | 'LABEL_READY'
    | 'READY_FOR_PICKUP'
    | 'SHIPPED'
    | 'IN_TRANSIT'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'EXCEPTION'
    | 'CANCELLED';
  paymentStatus: 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod: 'SHIPROCKET' | 'RAZORPAY' | 'COD';
  cancellationReason?: string;
  notes?: string;
  shipmentDetails?: IShipmentDetailsSnapshot;
  orderTimeline: IOrderTimelineItem[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSnapshotSchema = new Schema<IOrderItemSnapshot>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    title: { type: String, required: true },
    flavor: { type: String, required: true },
    packSize: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    mrp: { type: Number, required: true },
    total: { type: Number, required: true },
    image: { type: String, required: true },
  },
  { _id: false }
);

const AddressSnapshotSchema = new Schema<IAddressSnapshot>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    houseFlatNo: String,
    apartmentBuilding: String,
    streetArea: String,
    addressLine1: { type: String, required: true },
    addressLine2: String,
    landmark: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },
  { _id: false }
);

const CustomerSnapshotSchema = new Schema<ICustomerSnapshot>(
  {
    fullName: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const PricingSnapshotSchema = new Schema<IPricingSnapshot>(
  {
    subtotal: { type: Number, required: true },
    couponCode: String,
    couponDiscount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    taxGst: { type: Number, required: true },
    finalTotal: { type: Number, required: true },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      sparse: true,
    },
    guestEmail: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
    },
    guestPhone: {
      type: String,
      trim: true,
      sparse: true,
    },
    customerSnapshot: {
      type: CustomerSnapshotSchema,
    },
    items: {
      type: [OrderItemSnapshotSchema],
      required: true,
      validate: [(items: IOrderItemSnapshot[]) => items.length > 0, 'Order must contain at least one item'],
    },
    shippingAddress: {
      type: AddressSnapshotSchema,
      required: true,
    },
    billingAddress: {
      type: AddressSnapshotSchema,
    },
    pricing: {
      type: PricingSnapshotSchema,
      required: true,
    },
    orderStatus: {
      type: String,
      enum: [
        'PENDING',
        'CONFIRMED',
        'PROCESSING',
        'PACKED',
        'READY_TO_SHIP',
        'SHIPPED',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'SHIPMENT_DELAYED',
        'DELIVERY_FAILED',
        'RETURN_REQUESTED',
        'RETURNED',
        'CANCELLED',
        'REFUNDED',
      ],
      default: 'PENDING',
      index: true,
    },
    fulfillmentStage: {
      type: String,
      enum: [
        'NEW_ORDER',
        'ACCEPTED',
        'LABEL_READY',
        'READY_FOR_PICKUP',
        'SHIPPED',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'EXCEPTION',
        'CANCELLED',
      ],
      default: 'NEW_ORDER',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'UNPAID',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['SHIPROCKET', 'RAZORPAY', 'COD'],
      default: 'SHIPROCKET',
    },
    cancellationReason: String,
    notes: String,
    shipmentDetails: {
      courierName: String,
      courierCompanyId: Number,
      awbNumber: String,
      trackingUrl: String,
      labelUrl: String,
      manifestUrl: String,
      pickupTokenNumber: String,
      shiprocketOrderId: String,
      shiprocketShipmentId: String,
      packageWeight: Number,
      dispatchedAt: Date,
      deliveredAt: Date,
    },
    orderTimeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' },
        source: {
          type: String,
          enum: ['ADMIN', 'SHIPROCKET_WEBHOOK', 'SYSTEM', 'CUSTOMER'],
          default: 'SYSTEM',
        },
        location: String,
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        authorName: String,
      },
    ],
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>('Order', OrderSchema);

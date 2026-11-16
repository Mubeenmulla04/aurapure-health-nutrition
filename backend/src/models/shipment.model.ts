import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITrackingCheckpoint {
  status: string;
  activity: string;
  location: string;
  timestamp: Date;
}

export interface IShipment extends Document {
  orderId: Types.ObjectId;
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  awbCode?: string;
  courierCompanyId?: number;
  courierName?: string;
  trackingUrl?: string;
  currentStatus:
    | 'PENDING'
    | 'PROCESSING'
    | 'PACKED'
    | 'READY_TO_SHIP'
    | 'PICKUP_SCHEDULED'
    | 'SHIPPED'
    | 'IN_TRANSIT'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'DELIVERY_FAILED'
    | 'RTO_INITIATED'
    | 'RETURNED'
    | 'CANCELLED';
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
  pickupTokenNumber?: string;
  pickupScheduledDate?: Date;
  actualPickupDate?: Date;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  packageWeight?: number;
  dimensions?: {
    length: number;
    breadth: number;
    height: number;
  };
  failureReason?: string;
  trackingHistory: ITrackingCheckpoint[];
  labelUrl?: string;
  manifestUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TrackingCheckpointSchema = new Schema<ITrackingCheckpoint>(
  {
    status: { type: String, required: true },
    activity: { type: String, required: true },
    location: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ShipmentSchema = new Schema<IShipment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
      index: true,
    },
    shiprocketOrderId: String,
    shiprocketShipmentId: String,
    awbCode: {
      type: String,
      sparse: true,
      index: true,
    },
    courierCompanyId: Number,
    courierName: String,
    trackingUrl: String,
    currentStatus: {
      type: String,
      enum: [
        'PENDING',
        'PROCESSING',
        'PACKED',
        'READY_TO_SHIP',
        'PICKUP_SCHEDULED',
        'SHIPPED',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'DELIVERY_FAILED',
        'RTO_INITIATED',
        'RETURNED',
        'CANCELLED',
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
    pickupTokenNumber: String,
    pickupScheduledDate: Date,
    actualPickupDate: Date,
    estimatedDeliveryDate: Date,
    actualDeliveryDate: Date,
    packageWeight: { type: Number, default: 0.5 },
    dimensions: {
      length: { type: Number, default: 20 },
      breadth: { type: Number, default: 15 },
      height: { type: Number, default: 10 },
    },
    failureReason: String,
    trackingHistory: [TrackingCheckpointSchema],
    labelUrl: String,
    manifestUrl: String,
  },
  { timestamps: true }
);

export const Shipment = mongoose.model<IShipment>('Shipment', ShipmentSchema);

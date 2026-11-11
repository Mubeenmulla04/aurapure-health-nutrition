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
    | 'PICKUP_SCHEDULED'
    | 'IN_TRANSIT'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'RTO_INITIATED'
    | 'CANCELLED';
  pickupScheduledDate?: Date;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
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
        'PICKUP_SCHEDULED',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'RTO_INITIATED',
        'CANCELLED',
      ],
      default: 'PENDING',
      index: true,
    },
    pickupScheduledDate: Date,
    estimatedDeliveryDate: Date,
    actualDeliveryDate: Date,
    trackingHistory: [TrackingCheckpointSchema],
    labelUrl: String,
    manifestUrl: String,
  },
  { timestamps: true }
);

export const Shipment = mongoose.model<IShipment>('Shipment', ShipmentSchema);

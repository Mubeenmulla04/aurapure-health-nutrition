import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReview extends Document {
  productId: Types.ObjectId;
  userId?: Types.ObjectId;
  orderId?: Types.ObjectId;
  userName: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  isApproved: boolean;
  photos: string[];
  helpfulVotes: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
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
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    comment: {
      type: String,
      required: true,
    },
    verifiedPurchase: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: true, // auto-approve verified reviews, moderation queue in admin
      index: true,
    },
    photos: {
      type: [String],
      default: [],
    },
    helpfulVotes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

ReviewSchema.index({ productId: 1, isApproved: 1, createdAt: -1 });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);

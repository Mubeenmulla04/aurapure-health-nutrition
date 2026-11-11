import mongoose, { Document, Schema } from 'mongoose';

export interface IBanner extends Document {
  title: string;
  subtitle?: string;
  tagline?: string;
  imageDesktop: string;
  imageMobile: string;
  ctaText?: string;
  ctaLink?: string;
  placement: 'HERO' | 'PROMO_BAR' | 'COLLECTION_FEATURE' | 'FOOTER_CALLOUT';
  isActive: boolean;
  sortOrder: number;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: String,
    tagline: String,
    imageDesktop: {
      type: String,
      required: true,
    },
    imageMobile: {
      type: String,
      required: true,
    },
    ctaText: String,
    ctaLink: String,
    placement: {
      type: String,
      enum: ['HERO', 'PROMO_BAR', 'COLLECTION_FEATURE', 'FOOTER_CALLOUT'],
      default: 'HERO',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    startDate: Date,
    endDate: Date,
  },
  { timestamps: true }
);

export const Banner = mongoose.model<IBanner>('Banner', BannerSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface ISlide extends Document {
  title: string;
  heading: string;
  subtitle: string;
  desktopImage: string;
  mobileImage: string;
  imageAltText: string;
  ctaText: string;
  ctaLink: string;
  badgeText?: string;
  displayOrder: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SlideSchema = new Schema<ISlide>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    heading: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
      trim: true,
    },
    desktopImage: {
      type: String,
      required: true,
      trim: true,
    },
    mobileImage: {
      type: String,
      required: true,
      trim: true,
    },
    imageAltText: {
      type: String,
      default: 'AuraPure Botanical Nutrition',
      trim: true,
    },
    ctaText: {
      type: String,
      default: 'Shop Now',
      trim: true,
    },
    ctaLink: {
      type: String,
      default: '/collections',
      trim: true,
    },
    badgeText: {
      type: String,
      trim: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

SlideSchema.index({ isActive: 1, displayOrder: 1 });

export const Slide = mongoose.model<ISlide>('Slide', SlideSchema);

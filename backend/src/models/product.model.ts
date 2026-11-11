import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IProduct extends Document {
  title: string;
  slug: string;
  subtitle: string;
  categoryId: Types.ObjectId;
  description: string;
  benefits: string[];
  certifications: string[];
  nutritionalHighlights: {
    proteinPerServing: string;
    bcaa: string;
    servingsPerTub: number;
    addedSugar: string;
    digestiveEnzymes: boolean;
  };
  ingredients: string[];
  howToUse: {
    step: string;
    description: string;
  }[];
  badges: string[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  sortOrder: number;
  seoMeta: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    subtitle: {
      type: String,
      default: '',
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    benefits: {
      type: [String],
      default: [],
    },
    certifications: {
      type: [String],
      default: ['100% Plant Based', 'Non-GMO Certified', 'Lab Tested for Heavy Metals', 'No Added Sugar'],
    },
    nutritionalHighlights: {
      proteinPerServing: { type: String, default: '25g' },
      bcaa: { type: String, default: '4.8g' },
      servingsPerTub: { type: Number, default: 30 },
      addedSugar: { type: String, default: '0g' },
      digestiveEnzymes: { type: Boolean, default: true },
    },
    ingredients: {
      type: [String],
      default: [],
    },
    howToUse: [
      {
        step: { type: String, required: true },
        description: { type: String, required: true },
      },
    ],
    badges: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 4.9,
      min: 1,
      max: 5,
      index: true,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
      index: true,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    seoMeta: {
      title: String,
      description: String,
      keywords: [String],
    },
  },
  { timestamps: true }
);

// Full text search index
ProductSchema.index({ title: 'text', subtitle: 'text', description: 'text' });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);

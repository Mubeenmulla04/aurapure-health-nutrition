import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IStoreSettings extends Document {
  storeName: string;
  legalEntityName: string;
  gstin: string;
  supportEmail: string;
  supportPhone: string;
  supportWhatsApp: string;
  registeredAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  currency: {
    code: 'INR';
    symbol: '₹';
  };
  taxation: {
    defaultGstPercent: number;
    pricesInclusiveOfGst: boolean;
  };
  shipping: {
    freeShippingThreshold: number;
    standardShippingFee: number;
    estimatedMetroDays: number;
    estimatedRestDays: number;
  };
  invoice: {
    prefix: string;
    nextNumber: number;
    termsAndConditions: string;
  };
  integrations: {
    razorpayConfigured: boolean;
    shiprocketConfigured: boolean;
    whatsappConfigured: boolean;
    smtpConfigured: boolean;
  };
  seoDefaults: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string[];
  };
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StoreSettingsSchema = new Schema<IStoreSettings>(
  {
    storeName: {
      type: String,
      required: true,
      default: 'AuraPure Nutrition',
      trim: true,
    },
    legalEntityName: {
      type: String,
      required: true,
      default: 'AuraPure Bio-Wellness Private Limited',
      trim: true,
    },
    gstin: {
      type: String,
      required: true,
      default: '29AABCA1234F1Z5',
      trim: true,
    },
    supportEmail: {
      type: String,
      required: true,
      default: 'support@aurapure.in',
      trim: true,
    },
    supportPhone: {
      type: String,
      required: true,
      default: '+91 80 4920 1800',
      trim: true,
    },
    supportWhatsApp: {
      type: String,
      required: true,
      default: '+91 98765 43210',
      trim: true,
    },
    registeredAddress: {
      line1: { type: String, default: '108 Bio-Valley Tech Park, Whitefield' },
      line2: { type: String, default: 'Phase 2, EPIP Zone' },
      city: { type: String, default: 'Bengaluru' },
      state: { type: String, default: 'Karnataka' },
      pincode: { type: String, default: '560066' },
      country: { type: String, default: 'India' },
    },
    currency: {
      code: { type: String, default: 'INR' },
      symbol: { type: String, default: '₹' },
    },
    taxation: {
      defaultGstPercent: { type: Number, default: 18 },
      pricesInclusiveOfGst: { type: Boolean, default: true },
    },
    shipping: {
      freeShippingThreshold: { type: Number, default: 999 },
      standardShippingFee: { type: Number, default: 99 },
      estimatedMetroDays: { type: Number, default: 2 },
      estimatedRestDays: { type: Number, default: 4 },
    },
    invoice: {
      prefix: { type: String, default: 'AP-INV-' },
      nextNumber: { type: Number, default: 1001 },
      termsAndConditions: {
        type: String,
        default: 'All consumable goods are non-returnable once seal is opened. Replacements provided for transit damages within 7 days.',
      },
    },
    integrations: {
      razorpayConfigured: { type: Boolean, default: true },
      shiprocketConfigured: { type: Boolean, default: true },
      whatsappConfigured: { type: Boolean, default: true },
      smtpConfigured: { type: Boolean, default: true },
    },
    seoDefaults: {
      metaTitle: {
        type: String,
        default: 'AuraPure Nutrition | 100% Clean Plant Protein & Botanical Alchemy',
      },
      metaDescription: {
        type: String,
        default: 'Certified organic cold-pressed plant protein and Ayurvedic adaptogens for clean energy and effortless digestion.',
      },
      metaKeywords: {
        type: [String],
        default: ['plant protein', 'organic protein', 'clean nutrition', 'ashwagandha', 'zero bloat'],
      },
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const StoreSettings = mongoose.model<IStoreSettings>('StoreSettings', StoreSettingsSchema);

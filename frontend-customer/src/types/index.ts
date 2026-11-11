export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin' | 'inventory_manager' | 'support';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
}

export interface Address {
  _id?: string;
  id?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  badge?: string;
  productCount?: number;
}

export interface ProductVariant {
  _id: string;
  sku: string;
  title: string;
  flavor: string;
  packSize: string; // e.g. "500g", "1kg", "30 Sachets"
  weightGrams: number;
  mrp: number; // Maximum Retail Price (INR)
  sellingPrice: number; // Discounted Price (INR)
  discountPercent: number;
  images: string[];
  stockQuantity: number;
  inStock: boolean;
}

export interface Product {
  _id: string;
  title: string;
  slug: string;
  subtitle: string;
  category: Category | string;
  categorySlug?: string;
  description: string;
  benefits: string[];
  certifications: string[];
  nutritionalHighlights: {
    proteinPerServing: string; // e.g. "25g"
    bcaa: string; // e.g. "4.8g"
    servingsPerTub: number; // e.g. 30
    addedSugar: string; // "0g"
    digestiveEnzymes: boolean;
  };
  ingredients: string[];
  howToUse: {
    step: string;
    description: string;
  }[];
  variants: ProductVariant[];
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
}

export interface CartItem {
  variantId: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  flavor: string;
  packSize: string;
  image: string;
  unitPrice: number;
  mrp: number;
  quantity: number;
}

export interface CouponDiscount {
  code: string;
  discountAmount: number;
  description: string;
}

export interface OrderItem {
  productId: string;
  variantId: string;
  title: string;
  flavor: string;
  packSize: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  mrp: number;
  total: number;
  image: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  createdAt: string;
  orderStatus: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod: 'RAZORPAY_UPI' | 'RAZORPAY_CARD' | 'RAZORPAY_NETBANKING';
  items: OrderItem[];
  shippingAddress: Address;
  pricing: {
    subtotal: number;
    couponDiscount: number;
    shippingFee: number;
    taxGst: number;
    finalTotal: number;
  };
  tracking?: {
    awbCode?: string;
    courierName?: string;
    trackingUrl?: string;
    currentStatus?: string;
  };
  invoiceUrl?: string;
}

export interface Review {
  _id: string;
  productId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
  photos?: string[];
}

export interface FAQItem {
  _id: string;
  question: string;
  answer: string;
  category: 'GENERAL' | 'NUTRITION' | 'SHIPPING' | 'ORDERS';
}

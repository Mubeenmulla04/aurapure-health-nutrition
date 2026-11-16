import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const adminApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('aurapure_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('aurapure_admin_token');
      localStorage.removeItem('aurapure_admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Dashboard & Analytics APIs
export interface DashboardData {
  kpi: {
    totalRevenue: number;
    todayRevenue: number;
    totalOrders: number;
    todayOrders: number;
    pendingOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalCustomers: number;
    totalProducts: number;
    lowStockProducts: number;
    refundRequests: number;
    averageOrderValue: number;
  };
  revenueChart: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  orderStatusDistribution: {
    status: string;
    count: number;
  }[];
  paymentMethodDistribution: {
    method: string;
    count: number;
    totalAmount: number;
  }[];
  topProducts: {
    title: string;
    image: string;
    unitsSold: number;
    totalSales: number;
  }[];
  lowStockItems: any[];
  recentOrders: any[];
}

export const dashboardApi = {
  getOverview: async (range = '7d') => {
    const res = await adminApi.get<{ data: DashboardData }>('/admin/dashboard', {
      params: { range },
    });
    return res.data.data;
  },
  downloadSalesCsv: async (range = '30d') => {
    const res = await adminApi.get('/admin/analytics/export', {
      params: { range },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `aurapure-sales-${range}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

// Orders APIs
export interface OrderItemData {
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

export interface OrderAddressData {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderPricingData {
  subtotal: number;
  couponCode?: string;
  couponDiscount: number;
  shippingFee: number;
  taxGst: number;
  finalTotal: number;
}

export interface OrderTimelineData {
  status: string;
  timestamp: string;
  note?: string;
  source?: string;
  location?: string;
  authorName?: string;
}

export interface ShipmentDetailsData {
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
  dispatchedAt?: string;
  deliveredAt?: string;
}

export interface CourierOptionData {
  courierCompanyId: number;
  courierName: string;
  rate: number;
  estimatedDeliveryDays: number;
  rating: number;
  etd?: string;
  cod: boolean;
}

export interface OrderOperationalCounts {
  all: number;
  newOrders: number;
  accepted: number;
  readyForPickup: number;
  shipped: number;
  delivered: number;
  exceptions: number;
  cancelled: number;
}

export interface OrderData {
  _id: string;
  orderNumber: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  guestEmail?: string;
  guestPhone?: string;
  items: OrderItemData[];
  shippingAddress: OrderAddressData;
  billingAddress?: OrderAddressData;
  pricing: OrderPricingData;
  orderStatus: string;
  fulfillmentStage?: string;
  paymentStatus: string;
  paymentMethod: string;
  cancellationReason?: string;
  notes?: string;
  shipmentDetails?: ShipmentDetailsData;
  orderTimeline?: OrderTimelineData[];
  createdAt: string;
  updatedAt: string;
}

export const orderApi = {
  list: async (params?: { page?: number; limit?: number; status?: string; category?: string; paymentStatus?: string; search?: string }) => {
    const res = await adminApi.get<{
      data: { orders: OrderData[]; total: number; page: number; totalPages: number; counts?: OrderOperationalCounts };
    }>('/admin/orders', { params });
    return res.data.data;
  },
  getById: async (id: string) => {
    const res = await adminApi.get<{
      data: { order: OrderData; invoice?: any; shipment?: any; payment?: any };
    }>(`/admin/orders/${id}`);
    return res.data.data;
  },
  getCouriers: async (id: string) => {
    const res = await adminApi.get<{ data: { metrics: any; couriers: CourierOptionData[] } }>(`/admin/orders/${id}/couriers`);
    return res.data.data;
  },
  acceptShipment: async (id: string, courierCompanyId?: number) => {
    const res = await adminApi.post<{ data: { order: OrderData; shipment: any; labelUrl?: string }; message: string }>(
      `/admin/orders/${id}/accept-shipment`,
      { courierCompanyId }
    );
    return res.data;
  },
  getLabel: async (id: string) => {
    const res = await adminApi.get<{ data: { labelUrl: string; orderNumber: string; awbNumber?: string; courierName?: string } }>(
      `/admin/orders/${id}/label`
    );
    return res.data.data;
  },
  schedulePickup: async (id: string, pickupDate?: string) => {
    const res = await adminApi.post<{
      data: { order: OrderData; shipment: any; pickupTokenNumber: string; pickupScheduledDate: string };
      message: string;
    }>(`/admin/orders/${id}/schedule-pickup`, { pickupDate });
    return res.data;
  },
  getManifest: async (id: string) => {
    const res = await adminApi.get<{ data: { manifestUrl: string; orderId: string } }>(`/admin/orders/${id}/manifest`);
    return res.data.data;
  },
  updateStatus: async (
    id: string,
    status: string,
    payload?: string | { note?: string; location?: string; manualTracking?: { courierName?: string; awbNumber?: string; trackingUrl?: string } }
  ) => {
    const body = typeof payload === 'string' ? { status, note: payload } : { status, ...payload };
    const res = await adminApi.put<{ data: { order: OrderData }; message: string }>(`/admin/orders/${id}/status`, body);
    return res.data;
  },
  cancel: async (id: string, reason: string) => {
    const res = await adminApi.post<{ data: { order: OrderData }; message: string }>(`/admin/orders/${id}/cancel`, {
      reason,
    });
    return res.data;
  },
  addNote: async (id: string, note: string) => {
    const res = await adminApi.post<{ data: { order: OrderData }; message: string }>(`/admin/orders/${id}/notes`, {
      note,
    });
    return res.data;
  },
  downloadInvoice: async (id: string, orderNumber: string) => {
    const res = await adminApi.get(`/admin/orders/${id}/invoice`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Invoice-${orderNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

// Inventory APIs
export interface InventoryData {
  _id: string;
  variantId?: {
    _id: string;
    sku: string;
    title: string;
    flavor?: string;
    packSize?: string;
    sellingPrice?: number;
    productId?: {
      _id: string;
      title: string;
      slug: string;
      images?: string[];
    };
  };
  sku: string;
  stockOnHand: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
  alertStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  updatedAt: string;
}

export interface InventoryTxData {
  _id: string;
  inventoryId: string;
  changeQuantity: number;
  previousQuantity: number;
  newQuantity: number;
  type: string;
  reason?: string;
  performedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export const inventoryApi = {
  list: async (params?: { page?: number; limit?: number; search?: string; alertStatus?: string }) => {
    const res = await adminApi.get<{
      data: { inventory: InventoryData[]; total: number; page: number; totalPages: number };
    }>('/admin/inventory', { params });
    return res.data.data;
  },
  adjustStock: async (
    id: string,
    data: { changeQty: number; type?: string; reason: string; note?: string }
  ) => {
    const res = await adminApi.post<{ data: { inventory: InventoryData }; message: string }>(
      `/admin/inventory/${id}/adjust`,
      data
    );
    return res.data;
  },
  getHistory: async (id: string, params?: { page?: number; limit?: number }) => {
    const res = await adminApi.get<{
      data: { transactions: InventoryTxData[]; total: number; page: number; totalPages: number };
    }>(`/admin/inventory/${id}/history`, { params });
    return res.data.data;
  },
};

// Finance APIs
export interface PaymentData {
  _id: string;
  orderId?: {
    _id: string;
    orderNumber: string;
    shippingAddress?: { fullName: string; phone: string };
    pricing?: { finalTotal: number };
    orderStatus?: string;
    paymentMethod?: string;
  };
  gateway: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  shiprocketOrderId?: string;
  shiprocketPaymentId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  createdAt: string;
}

export interface RefundData {
  _id: string;
  orderId?: {
    _id: string;
    orderNumber: string;
    shippingAddress?: { fullName: string; phone: string };
    pricing?: { finalTotal: number };
  };
  paymentId?: {
    _id: string;
    razorpayPaymentId?: string;
    amount: number;
    gateway: string;
  };
  razorpayRefundId?: string;
  amount: number;
  reason: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  createdAt: string;
}

export const financeApi = {
  listPayments: async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const res = await adminApi.get<{
      data: { payments: PaymentData[]; total: number; page: number; totalPages: number };
    }>('/admin/payments', { params });
    return res.data.data;
  },
  reconcilePayment: async (id: string) => {
    const res = await adminApi.post<{ data: { payment: PaymentData }; message: string }>(
      `/admin/payments/${id}/reconcile`
    );
    return res.data;
  },
  listRefunds: async (params?: { page?: number; limit?: number; status?: string }) => {
    const res = await adminApi.get<{
      data: { refunds: RefundData[]; total: number; page: number; totalPages: number };
    }>('/admin/refunds', { params });
    return res.data.data;
  },
  approveRefund: async (id: string) => {
    const res = await adminApi.post<{ data: { refund: RefundData }; message: string }>(
      `/admin/refunds/${id}/approve`
    );
    return res.data;
  },
  rejectRefund: async (id: string, reason: string) => {
    const res = await adminApi.post<{ data: { refund: RefundData }; message: string }>(
      `/admin/refunds/${id}/reject`,
      { reason }
    );
    return res.data;
  },
};

// Logistics APIs
export interface ShipmentData {
  _id: string;
  orderId?: {
    _id: string;
    orderNumber: string;
    shippingAddress?: { fullName: string; phone: string; city: string; state: string; pincode: string };
    pricing?: { finalTotal: number };
    orderStatus?: string;
  };
  awbCode?: string;
  courierName?: string;
  trackingUrl?: string;
  currentStatus: string;
  pickupScheduledDate?: string;
  estimatedDeliveryDate?: string;
  trackingHistory?: {
    status: string;
    activity: string;
    location: string;
    timestamp: string;
  }[];
  createdAt: string;
}

export const logisticsApi = {
  listShipments: async (params?: { page?: number; limit?: number; status?: string }) => {
    const res = await adminApi.get<{
      data: { shipments: ShipmentData[]; total: number; page: number; totalPages: number };
    }>('/admin/shipments', { params });
    return res.data.data;
  },
  createShipment: async (orderId: string, courierName?: string) => {
    const res = await adminApi.post<{ data: { shipment: ShipmentData }; message: string }>(
      '/admin/shipments/create',
      { orderId, courierName }
    );
    return res.data;
  },
  trackShipment: async (id: string) => {
    const res = await adminApi.get<{
      data: { shipment: ShipmentData; checkpoints: any[] };
    }>(`/admin/shipments/${id}/track`);
    return res.data.data;
  },
};

// CMS APIs
export interface ReviewData {
  _id: string;
  productId?: {
    _id: string;
    title: string;
    slug: string;
    images?: string[];
  };
  userName: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  isApproved: boolean;
  helpfulVotes?: number;
  createdAt: string;
}

export interface BannerData {
  _id: string;
  title: string;
  subtitle?: string;
  tagline?: string;
  imageDesktop: string;
  imageMobile: string;
  ctaText?: string;
  ctaLink?: string;
  placement: string;
  isActive: boolean;
  sortOrder: number;
}

export interface FaqData {
  _id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}

export const cmsApi = {
  listReviews: async (params?: { page?: number; limit?: number }) => {
    const res = await adminApi.get<{
      data: { reviews: ReviewData[]; total: number; page: number; totalPages: number };
    }>('/admin/reviews', { params });
    return res.data.data;
  },
  toggleReview: async (id: string, isApproved: boolean) => {
    const res = await adminApi.patch<{ data: { review: ReviewData }; message: string }>(
      `/admin/reviews/${id}/status`,
      { isApproved }
    );
    return res.data;
  },
  deleteReview: async (id: string) => {
    const res = await adminApi.delete<{ message: string }>(`/admin/reviews/${id}`);
    return res.data;
  },
  listBanners: async () => {
    const res = await adminApi.get<{ data: { banners: BannerData[] } }>('/admin/cms/banners');
    return res.data.data.banners;
  },
  createBanner: async (data: Partial<BannerData>) => {
    const res = await adminApi.post<{ data: { banner: BannerData }; message: string }>('/admin/cms/banners', data);
    return res.data;
  },
  updateBanner: async (id: string, data: Partial<BannerData>) => {
    const res = await adminApi.put<{ data: { banner: BannerData }; message: string }>(
      `/admin/cms/banners/${id}`,
      data
    );
    return res.data;
  },
  deleteBanner: async (id: string) => {
    const res = await adminApi.delete<{ message: string }>(`/admin/cms/banners/${id}`);
    return res.data;
  },
  listFaqs: async () => {
    const res = await adminApi.get<{ data: { faqs: FaqData[] } }>('/admin/cms/faqs');
    return res.data.data.faqs;
  },
  createFaq: async (data: Partial<FaqData>) => {
    const res = await adminApi.post<{ data: { faq: FaqData }; message: string }>('/admin/cms/faqs', data);
    return res.data;
  },
  updateFaq: async (id: string, data: Partial<FaqData>) => {
    const res = await adminApi.put<{ data: { faq: FaqData }; message: string }>(`/admin/cms/faqs/${id}`, data);
    return res.data;
  },
  deleteFaq: async (id: string) => {
    const res = await adminApi.delete<{ message: string }>(`/admin/cms/faqs/${id}`);
    return res.data;
  },
};

// Customers APIs
export interface CustomerData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  ordersCount: number;
  paidOrdersCount: number;
  totalSpend: number;
  lastOrderDate?: string | null;
  createdAt: string;
  addresses?: any[];
  orders?: any[];
}

export const customerApi = {
  list: async (params?: { page?: number; limit?: number; search?: string }) => {
    const res = await adminApi.get<{
      data: { customers: CustomerData[]; total: number; page: number; totalPages: number };
    }>('/admin/customers', { params });
    return res.data.data;
  },
  getById: async (id: string) => {
    const res = await adminApi.get<{ data: { customer: CustomerData } }>(`/admin/customers/${id}`);
    return res.data.data.customer;
  },
  toggleStatus: async (id: string, isActive: boolean) => {
    const res = await adminApi.patch<{ data: { customer: CustomerData }; message: string }>(
      `/admin/customers/${id}/status`,
      { isActive }
    );
    return res.data;
  },
  downloadCsv: async () => {
    const res = await adminApi.get('/admin/customers/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'aurapure-customers-directory.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

// Coupons APIs
export interface CouponData {
  _id: string;
  code: string;
  description: string;
  discountType: 'PERCENT' | 'FLAT';
  discountValue: number;
  minOrderValue: number;
  maxDiscountCap?: number;
  startDate: string;
  endDate: string;
  usageLimitTotal?: number;
  usageLimitPerUser: number;
  timesUsed: number;
  isActive: boolean;
  createdAt?: string;
}

export const couponApi = {
  list: async () => {
    const res = await adminApi.get<{ data: { coupons: CouponData[] } }>('/admin/coupons');
    return res.data.data.coupons;
  },
  create: async (data: Partial<CouponData>) => {
    const res = await adminApi.post<{ data: { coupon: CouponData }; message: string }>('/admin/coupons', data);
    return res.data;
  },
  update: async (id: string, data: Partial<CouponData>) => {
    const res = await adminApi.put<{ data: { coupon: CouponData }; message: string }>(`/admin/coupons/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await adminApi.delete<{ message: string }>(`/admin/coupons/${id}`);
    return res.data;
  },
};

// Categories APIs
export interface CategoryData {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  bannerImage?: string;
  badge?: string;
  parentId?: string | null;
  isActive: boolean;
  sortOrder: number;
  productCount?: number;
  createdAt?: string;
}

export const categoryApi = {
  list: async () => {
    const res = await adminApi.get<{ data: { categories: CategoryData[] } }>('/admin/categories');
    return res.data.data.categories;
  },
  create: async (data: Partial<CategoryData>) => {
    const res = await adminApi.post<{ data: { category: CategoryData }; message: string }>('/admin/categories', data);
    return res.data;
  },
  update: async (id: string, data: Partial<CategoryData>) => {
    const res = await adminApi.put<{ data: { category: CategoryData }; message: string }>(`/admin/categories/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await adminApi.delete<{ message: string }>(`/admin/categories/${id}`);
    return res.data;
  },
};

// Products APIs
export interface ProductVariantData {
  _id?: string;
  sku: string;
  title?: string;
  flavor: string;
  packSize: string;
  weightGrams: number;
  mrp: number;
  sellingPrice: number;
  discountPercent?: number;
  images: string[];
  isActive?: boolean;
  initialStock?: number;
  inventory?: {
    stockOnHand: number;
    reservedStock: number;
    availableStock: number;
  };
}

export interface ProductData {
  _id: string;
  title: string;
  slug: string;
  subtitle?: string;
  categoryId: any;
  description: string;
  benefits?: string[];
  ingredients?: string[];
  nutritionalHighlights?: {
    proteinPerServing: string;
    bcaa: string;
    servingsPerTub: number;
    addedSugar: string;
    digestiveEnzymes: boolean;
  };
  isActive: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  sortOrder?: number;
  variantsCount?: number;
  variants?: ProductVariantData[];
  totalStock?: number;
  priceRange?: { min: number; max: number };
  primaryImage?: string;
  createdAt?: string;
}

export const productApi = {
  list: async (params?: { page?: number; limit?: number; search?: string; categoryId?: string; status?: string; sort?: string }) => {
    const res = await adminApi.get<{
      data: { products: ProductData[]; total: number; page: number; totalPages: number };
    }>('/admin/products', { params });
    return res.data.data;
  },
  getById: async (id: string) => {
    const res = await adminApi.get<{ data: { product: ProductData } }>(`/admin/products/${id}`);
    return res.data.data.product;
  },
  create: async (data: { product: Partial<ProductData>; variants: ProductVariantData[] }) => {
    const res = await adminApi.post<{ data: { product: ProductData }; message: string }>('/admin/products', data);
    return res.data;
  },
  update: async (id: string, data: { product: Partial<ProductData>; variants: ProductVariantData[] }) => {
    const res = await adminApi.put<{ data: { product: ProductData }; message: string }>(`/admin/products/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await adminApi.delete<{ message: string }>(`/admin/products/${id}`);
    return res.data;
  },
  toggleStatus: async (id: string, flags: { isActive?: boolean; isFeatured?: boolean; isBestSeller?: boolean; isNewArrival?: boolean }) => {
    const res = await adminApi.patch<{ data: { product: ProductData }; message: string }>(`/admin/products/${id}/status`, flags);
    return res.data;
  },
  duplicate: async (id: string) => {
    const res = await adminApi.post<{ data: { product: ProductData }; message: string }>(`/admin/products/${id}/duplicate`);
    return res.data;
  },
  bulkAction: async (action: 'activate' | 'deactivate' | 'delete', productIds: string[]) => {
    const res = await adminApi.post<{ message: string }>('/admin/products/bulk', { action, productIds });
    return res.data;
  },
  uploadImage: async (image: string, filename?: string) => {
    const res = await adminApi.post<{ data: { url: string } }>('/admin/upload', { image, filename });
    return res.data.data.url;
  },
};

export const uploadApi = {
  uploadImage: async (image: string, filename?: string) => {
    const res = await adminApi.post<{ data: { url: string } }>('/admin/upload', { image, filename });
    return res.data.data.url;
  },
};

// Slideshow APIs
export interface SlideItemData {
  _id: string;
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
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const slidesApi = {
  list: async (params?: { page?: number; limit?: number; search?: string }) => {
    const res = await adminApi.get<{
      data: { slides: SlideItemData[]; total: number; page: number; totalPages: number };
    }>('/admin/slides', { params });
    return res.data.data;
  },
  getById: async (id: string) => {
    const res = await adminApi.get<{ data: { slide: SlideItemData } }>(`/admin/slides/${id}`);
    return res.data.data.slide;
  },
  create: async (data: Partial<SlideItemData>) => {
    const res = await adminApi.post<{ data: { slide: SlideItemData }; message: string }>('/admin/slides', data);
    return res.data;
  },
  update: async (id: string, data: Partial<SlideItemData>) => {
    const res = await adminApi.put<{ data: { slide: SlideItemData }; message: string }>(`/admin/slides/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await adminApi.delete<{ message: string }>(`/admin/slides/${id}`);
    return res.data;
  },
  toggleStatus: async (id: string) => {
    const res = await adminApi.patch<{ data: { slide: SlideItemData }; message: string }>(`/admin/slides/${id}/status`);
    return res.data;
  },
  reorder: async (items: { id: string; displayOrder: number }[]) => {
    const res = await adminApi.patch<{ message: string }>('/admin/slides/reorder', { items });
    return res.data;
  },
};

// Staff & RBAC APIs
export interface StaffMember {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  roleId?: {
    _id: string;
    name: string;
    description: string;
    permissions: string[];
  };
}

export interface RoleDoc {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
}

export const staffApi = {
  list: async () => {
    const res = await adminApi.get<{ data: { staff: StaffMember[] } }>('/admin/staff');
    return res.data.data.staff;
  },
  listRoles: async () => {
    const res = await adminApi.get<{ data: { roles: RoleDoc[] } }>('/admin/roles');
    return res.data.data.roles;
  },
  create: async (data: { name: string; email?: string; password?: string; phone?: string; mobileNumber?: string; role: string }) => {
    const res = await adminApi.post<{ data: { staff: StaffMember }; message: string }>('/admin/staff', data);
    return res.data;
  },
  update: async (id: string, data: { name?: string; phone?: string; role?: string; isActive?: boolean }) => {
    const res = await adminApi.put<{ data: { staff: StaffMember }; message: string }>(`/admin/staff/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await adminApi.delete<{ message: string }>(`/admin/staff/${id}`);
    return res.data;
  },
};

// Store Settings & Audit Log APIs
export interface StoreSettingsData {
  _id?: string;
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
    code: string;
    symbol: string;
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
  updatedAt?: string;
}

export interface AuditLogItem {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  userName?: string;
  action: string;
  entity: string;
  entityId: string;
  diff?: {
    before?: any;
    after?: any;
  };
  ipAddress?: string;
  createdAt: string;
}

export const settingsApi = {
  getStoreSettings: async () => {
    const res = await adminApi.get<{ data: { settings: StoreSettingsData } }>('/admin/settings/store');
    return res.data.data.settings;
  },
  updateStoreSettings: async (data: Partial<StoreSettingsData>) => {
    const res = await adminApi.put<{ data: { settings: StoreSettingsData }; message: string }>('/admin/settings/store', data);
    return res.data;
  },
  listAuditLogs: async (params?: { page?: number; limit?: number; entity?: string; action?: string; search?: string }) => {
    const res = await adminApi.get<{ data: { logs: AuditLogItem[]; total: number; page: number; totalPages: number } }>(
      '/admin/settings/audit-logs',
      { params }
    );
    return res.data.data;
  },
};

// Invoices & Reports Center APIs
export interface InvoiceItemData {
  _id: string;
  orderId?: {
    _id: string;
    orderNumber: string;
    orderStatus: string;
    createdAt: string;
  };
  invoiceNumber: string;
  invoiceDate: string;
  businessDetails: {
    name: string;
    address: string;
    gstin: string;
    pan: string;
    email: string;
    phone: string;
  };
  customerDetails: {
    name: string;
    address: string;
    phone: string;
    email?: string;
  };
  subtotal: number;
  discount: number;
  taxBreakup: {
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
  };
  shippingFee: number;
  totalPayable: number;
  paymentMethod: string;
  paymentStatus: string;
  pdfPath?: string;
  pdfUrl?: string;
  isSentEmail: boolean;
  isSentWhatsApp: boolean;
  createdAt: string;
}

export interface NotificationLogData {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  orderId?: {
    _id: string;
    orderNumber: string;
  };
  channel: 'WHATSAPP' | 'EMAIL' | 'SMS';
  templateName: string;
  recipient: string;
  status: 'QUEUED' | 'SENT' | 'FAILED';
  payload: any;
  attempts: number;
  lastError?: string;
  externalMessageId?: string;
  sentAt?: string;
  createdAt: string;
}

export const reportsApi = {
  listInvoices: async (params?: { page?: number; limit?: number; search?: string }) => {
    const res = await adminApi.get<{
      data: { invoices: InvoiceItemData[]; total: number; page: number; totalPages: number };
    }>('/admin/invoices', { params });
    return res.data.data;
  },
  listNotifications: async (params?: { page?: number; limit?: number; channel?: string; status?: string }) => {
    const res = await adminApi.get<{
      data: { notifications: NotificationLogData[]; total: number; page: number; totalPages: number };
    }>('/admin/settings/notifications', { params });
    return res.data.data;
  },
  downloadTaxReport: async () => {
    const res = await adminApi.get('/admin/reports/tax', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'aurapure-gst-tax-report.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  downloadInventoryValuation: async () => {
    const res = await adminApi.get('/admin/reports/inventory', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'aurapure-inventory-valuation.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  downloadSalesLedger: async () => {
    const res = await adminApi.get('/admin/analytics/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sales-analytics-report.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  downloadCustomerDirectory: async () => {
    const res = await adminApi.get('/admin/customers/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'customers-directory.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

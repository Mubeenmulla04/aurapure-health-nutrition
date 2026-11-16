import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { StaffController } from './staff.controller.js';
import { SettingsController } from './settings.controller.js';
import { AdminProductController } from './product.controller.js';
import { AdminCategoryController } from './category.controller.js';
import { AdminInventoryController } from './inventory.controller.js';
import { AdminOrderController } from './order.controller.js';
import { AdminCustomerController } from './customer.controller.js';
import { AdminCouponController } from './coupon.controller.js';
import { AdminFinanceController } from './finance.controller.js';
import { AdminLogisticsController } from './logistics.controller.js';
import { AdminCmsController } from './cms.controller.js';
import { AdminUploadController } from './upload.controller.js';
import { AdminReportsController } from './reports.controller.js';
import { SlideController } from '../slides/slide.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireStaff, requireAdmin } from '../../middleware/role.middleware.js';

const router = Router();

// Protect all admin endpoints with authentication & staff role guard
router.use(authenticate, requireStaff);

// Executive Dashboard & Analytics
router.get('/dashboard', AdminController.getDashboard);
router.get('/analytics/overview', AdminController.getDashboard);
router.get('/analytics/export', AdminController.exportSalesCsv);

// Product Catalog Management
router.get('/products', AdminProductController.listProducts);
router.get('/products/:id', AdminProductController.getProductById);
router.post('/products', AdminProductController.createProduct);
router.put('/products/:id', AdminProductController.updateProduct);
router.delete('/products/:id', AdminProductController.deleteProduct);
router.patch('/products/:id/status', AdminProductController.toggleStatus);
router.post('/products/:id/duplicate', AdminProductController.duplicateProduct);
router.post('/products/bulk', AdminProductController.bulkAction);

// Category Management
router.get('/categories', AdminCategoryController.listCategories);
router.post('/categories', AdminCategoryController.createCategory);
router.put('/categories/:id', AdminCategoryController.updateCategory);
router.delete('/categories/:id', AdminCategoryController.deleteCategory);

// Media Upload
router.post('/upload', AdminUploadController.uploadImage);

// Order Fulfillment & Lifecycle
router.get('/orders', AdminOrderController.listOrders);
router.get('/orders/:id', AdminOrderController.getOrderById);
router.put('/orders/:id/status', AdminOrderController.updateOrderStatus);
router.patch('/orders/:id/status', AdminOrderController.updateOrderStatus);
router.post('/orders/:id/cancel', AdminOrderController.cancelOrder);
router.post('/orders/:id/notes', AdminOrderController.addTimelineNote);
router.get('/orders/:id/invoice', AdminOrderController.downloadInvoicePdf);

// Shiprocket Automated Order Fulfillment Workflow
router.get('/orders/:id/couriers', AdminOrderController.getAvailableCouriers);
router.post('/orders/:id/accept-shipment', AdminOrderController.acceptOrderAndCreateShipment);
router.get('/orders/:id/label', AdminOrderController.downloadShippingLabel);
router.post('/orders/:id/schedule-pickup', AdminOrderController.schedulePickup);
router.get('/orders/:id/manifest', AdminOrderController.downloadManifest);

// Inventory Master & Stock Ledger
router.get('/inventory', AdminInventoryController.listInventory);
router.post('/inventory/:id/adjust', AdminInventoryController.adjustStock);
router.put('/inventory/:id/adjust', AdminInventoryController.adjustStock);
router.get('/inventory/:id/history', AdminInventoryController.getTransactionHistory);

// Customer Directory & Spend Profiles
router.get('/customers', AdminCustomerController.listCustomers);
router.get('/customers/export', AdminCustomerController.exportCustomersCsv);
router.get('/customers/:id', AdminCustomerController.getCustomerById);
router.patch('/customers/:id/status', AdminCustomerController.toggleStatus);

// Coupons & Promotional Discounts
router.get('/coupons', AdminCouponController.listCoupons);
router.post('/coupons', AdminCouponController.createCoupon);
router.put('/coupons/:id', AdminCouponController.updateCoupon);
router.delete('/coupons/:id', AdminCouponController.deleteCoupon);

// Revenue & Financial Gateway Operations
router.get('/payments', AdminFinanceController.listPayments);
router.post('/payments/:id/reconcile', AdminFinanceController.reconcilePayment);
router.get('/refunds', AdminFinanceController.listRefunds);
router.post('/refunds/:id/approve', AdminFinanceController.approveRefund);
router.post('/refunds/:id/reject', AdminFinanceController.rejectRefund);

// Logistics & Courier Fulfillment (Shiprocket)
router.get('/shipments', AdminLogisticsController.listShipments);
router.post('/shipments/create', AdminLogisticsController.createShipment);
router.get('/shipments/:id/track', AdminLogisticsController.trackShipment);

// Customer Reviews & Content CMS
router.get('/reviews', AdminCmsController.listReviews);
router.patch('/reviews/:id/status', AdminCmsController.toggleReviewStatus);
router.delete('/reviews/:id', AdminCmsController.deleteReview);

router.get('/cms/banners', AdminCmsController.listBanners);
router.post('/cms/banners', AdminCmsController.createBanner);
router.put('/cms/banners/:id', AdminCmsController.updateBanner);
router.delete('/cms/banners/:id', AdminCmsController.deleteBanner);

router.get('/cms/faqs', AdminCmsController.listFaqs);
router.post('/cms/faqs', AdminCmsController.createFaq);
router.put('/cms/faqs/:id', AdminCmsController.updateFaq);
router.delete('/cms/faqs/:id', AdminCmsController.deleteFaq);

// Hero Slideshow Carousel (CMS)
router.get('/slides', SlideController.listAdminSlides);
router.post('/slides', SlideController.createSlide);
router.get('/slides/:id', SlideController.getSlideById);
router.put('/slides/:id', SlideController.updateSlide);
router.delete('/slides/:id', SlideController.deleteSlide);
router.patch('/slides/:id/status', SlideController.toggleStatus);
router.patch('/slides/reorder', SlideController.reorderSlides);

// Tax Invoices & Reports Center
router.get('/invoices', AdminReportsController.listInvoices);
router.get('/reports/tax', AdminReportsController.exportTaxReport);
router.get('/reports/inventory', AdminReportsController.exportInventoryValuation);
router.get('/settings/notifications', AdminReportsController.listNotifications);

// Staff & Role Governance (Super Admin / Admin)
router.get('/staff', requireAdmin, StaffController.listStaff);
router.get('/roles', requireAdmin, StaffController.listRoles);
router.post('/staff', requireAdmin, StaffController.createStaff);
router.put('/staff/:id', requireAdmin, StaffController.updateStaff);
router.delete('/staff/:id', requireAdmin, StaffController.deleteStaff);

// Store Configuration & Audit Ledger
router.get('/settings/store', SettingsController.getStoreSettings);
router.put('/settings/store', requireAdmin, SettingsController.updateStoreSettings);
router.get('/settings/audit-logs', requireAdmin, SettingsController.listAuditLogs);

export const adminRoutes = router;

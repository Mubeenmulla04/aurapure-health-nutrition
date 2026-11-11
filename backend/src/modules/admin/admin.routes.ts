import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireAdmin } from '../../middleware/role.middleware.js';

const router = Router();

// Protect all admin endpoints with authentication & admin role guard
router.use(authenticate, requireAdmin);

router.get('/dashboard', AdminController.getDashboard);
router.get('/orders', AdminController.listOrders);
router.put('/orders/:id/status', AdminController.updateOrderStatus);

router.get('/inventory', AdminController.listInventory);
router.put('/inventory/:id/adjust', AdminController.adjustStock);

router.post('/products', AdminController.createProduct);

export const adminRoutes = router;

import { Router } from 'express';
import { OrderController } from './order.controller.js';
import { authenticate, optionalAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/checkout-preview', optionalAuth, OrderController.checkoutPreview);
router.post('/', optionalAuth, OrderController.createOrder);
router.post('/verify-payment', optionalAuth, OrderController.verifyPayment);
router.post('/verify-shiprocket-payment', optionalAuth, OrderController.verifyShiprocketPayment);
router.post('/shiprocket-webhook', OrderController.handleShiprocketWebhook);
router.get('/track', optionalAuth, OrderController.trackOrder);

router.get('/my-orders', authenticate, OrderController.getMyOrders);
router.get('/:id', optionalAuth, OrderController.getOrderById);
router.post('/:id/cancel', authenticate, OrderController.cancelOrder);

export const orderRoutes = router;

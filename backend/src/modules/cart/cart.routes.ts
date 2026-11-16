import { Router } from 'express';
import { CartController } from './cart.controller.js';
import { optionalAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(optionalAuth);

router.get('/', CartController.getCart);
router.post('/items', CartController.addItem);
router.put('/items/:variantId', CartController.updateQuantity);
router.delete('/items/:variantId', CartController.removeItem);
router.post('/apply-coupon', CartController.applyCoupon);
router.post('/remove-coupon', CartController.removeCoupon);
router.delete('/remove-coupon', CartController.removeCoupon);

export const cartRoutes = router;

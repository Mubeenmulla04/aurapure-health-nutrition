import { Router } from 'express';
import { WishlistController } from './wishlist.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', WishlistController.getWishlist);
router.post('/toggle', WishlistController.toggle);

export const wishlistRoutes = router;

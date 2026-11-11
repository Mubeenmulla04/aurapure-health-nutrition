import { Router } from 'express';
import { ReviewController } from './review.controller.js';
import { optionalAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/product/:productId', ReviewController.getProductReviews);
router.post('/', optionalAuth, ReviewController.submitReview);

export const reviewRoutes = router;

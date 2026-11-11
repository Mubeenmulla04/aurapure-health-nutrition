import { Router } from 'express';
import { ProductController } from './product.controller.js';

const router = Router();

router.get('/', ProductController.list);
router.get('/featured', ProductController.getFeatured);
router.get('/:slug', ProductController.getBySlug);

export const productRoutes = router;

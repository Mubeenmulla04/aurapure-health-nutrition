import { Router } from 'express';
import { CategoryController } from './category.controller.js';

const router = Router();

router.get('/', CategoryController.list);
router.get('/:slug', CategoryController.getBySlug);

export const categoryRoutes = router;

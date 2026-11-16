import { Router } from 'express';
import { SlideController } from './slide.controller.js';

const router = Router();

// Public customer endpoint: returns active, scheduled slides
router.get('/', SlideController.getActiveSlides);
router.get('/active', SlideController.getActiveSlides);

export const slideRoutes = router;

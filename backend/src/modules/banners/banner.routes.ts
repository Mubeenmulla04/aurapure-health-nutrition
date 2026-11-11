import { Router } from 'express';
import { BannerController } from './banner.controller.js';

const router = Router();

router.get('/', BannerController.list);

export const bannerRoutes = router;

import { Router } from 'express';
import { FAQController } from './faq.controller.js';

const router = Router();

router.get('/', FAQController.list);

export const faqRoutes = router;

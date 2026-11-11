import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authRateLimiter } from '../../middleware/rateLimiter.middleware.js';
import { registerSchema, loginSchema } from './auth.validator.js';

const router = Router();

router.post(
  '/register',
  authRateLimiter,
  validateRequest({ body: registerSchema }),
  AuthController.register
);

router.post(
  '/login',
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  AuthController.login
);

router.post('/refresh', AuthController.refreshToken);
router.post('/logout', authenticate, AuthController.logout);

router.get('/me', authenticate, AuthController.getMe);
router.put('/me', authenticate, AuthController.updateProfile);

export const authRoutes = router;

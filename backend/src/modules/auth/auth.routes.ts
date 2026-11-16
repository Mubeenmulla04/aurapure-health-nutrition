import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authRateLimiter, otpSendRateLimiter } from '../../middleware/rateLimiter.middleware.js';
import {
  sendOtpSchema,
  verifyOtpSchema,
  resendOtpSchema,
  changeMobileVerifyOldSchema,
  changeMobileVerifyNewSchema,
  updateProfileSchema,
} from './auth.validator.js';

const router = Router();

// Public Phone + OTP Authentication Endpoints
router.post(
  '/send-otp',
  otpSendRateLimiter,
  authRateLimiter,
  validateRequest({ body: sendOtpSchema }),
  AuthController.sendOtp
);

router.post(
  '/verify-otp',
  authRateLimiter,
  validateRequest({ body: verifyOtpSchema }),
  AuthController.verifyOtp
);

router.post(
  '/resend-otp',
  authRateLimiter,
  validateRequest({ body: resendOtpSchema }),
  AuthController.resendOtp
);

router.post('/refresh', AuthController.refreshToken);

// Authenticated Session Endpoints
router.post('/logout', authenticate, AuthController.logout);
router.post('/logout-all', authenticate, AuthController.logoutAll);
router.get('/me', authenticate, AuthController.getMe);
router.put('/me', authenticate, validateRequest({ body: updateProfileSchema }), AuthController.updateProfile);

// Authenticated Mobile Number Change Flow
router.post('/change-mobile/send-otp', authenticate, AuthController.changeMobileSendOtp);
router.post(
  '/change-mobile/verify-old',
  authenticate,
  validateRequest({ body: changeMobileVerifyOldSchema }),
  AuthController.changeMobileVerifyOld
);
router.post('/change-mobile/send-new-otp', authenticate, AuthController.changeMobileSendNewOtp);
router.post(
  '/change-mobile/verify-new',
  authenticate,
  validateRequest({ body: changeMobileVerifyNewSchema }),
  AuthController.changeMobileVerifyNew
);

export const authRoutes = router;

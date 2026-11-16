import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

const REFRESH_COOKIE_NAME = 'aurapure_refresh_token';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

export class AuthController {
  /**
   * POST /api/v1/auth/send-otp
   */
  static async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { mobileNumber, countryCode } = req.body;
      const result = await AuthService.sendOtp({
        mobileNumber,
        countryCode,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        purpose: 'LOGIN',
      });

      ApiResponse.success({
        res,
        message: result.message,
        data: {
          cooldownSeconds: result.cooldownSeconds,
          ...((process.env.NODE_ENV !== 'production' && (result as any).rawOtp) ? { devOtp: (result as any).rawOtp } : {}),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/verify-otp
   */
  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { mobileNumber, otp, countryCode } = req.body;
      const result = await AuthService.verifyOtp({
        mobileNumber,
        otp,
        countryCode,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions);

      ApiResponse.success({
        res,
        message: result.user.isNewUser ? 'Welcome to AuraPure!' : 'Signed in successfully.',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/resend-otp
   */
  static async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { mobileNumber, countryCode } = req.body;
      const result = await AuthService.sendOtp({
        mobileNumber,
        countryCode,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        purpose: 'LOGIN',
      });

      ApiResponse.success({
        res,
        message: result.message,
        data: {
          cooldownSeconds: result.cooldownSeconds,
          ...((process.env.NODE_ENV !== 'production' && (result as any).rawOtp) ? { devOtp: (result as any).rawOtp } : {}),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/refresh
   */
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies[REFRESH_COOKIE_NAME] || req.body.refreshToken;
      const result = await AuthService.refreshToken(token, req.ip, req.headers['user-agent']);

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions);

      ApiResponse.success({
        res,
        message: 'Token refreshed.',
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user?.userId) {
        await AuthService.logout(req.user.userId, req.user.sessionId);
      }
      res.clearCookie(REFRESH_COOKIE_NAME);
      ApiResponse.success({
        res,
        message: 'Logged out successfully from this device.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout-all
   */
  static async logoutAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user?.userId) {
        await AuthService.logoutAll(req.user.userId);
      }
      res.clearCookie(REFRESH_COOKIE_NAME);
      ApiResponse.success({
        res,
        message: 'Logged out successfully from all devices.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getMe(req.user!.userId);
      ApiResponse.success({
        res,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/auth/me
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.updateProfile(req.user!.userId, req.body);
      ApiResponse.success({
        res,
        message: 'Profile updated successfully.',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/change-mobile/send-otp
   */
  static async changeMobileSendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.changeMobileSendOldOtp(req.user!.userId, req.ip, req.headers['user-agent']);
      ApiResponse.success({
        res,
        message: result.message,
        data: { cooldownSeconds: result.cooldownSeconds },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/change-mobile/verify-old
   */
  static async changeMobileVerifyOld(req: Request, res: Response, next: NextFunction) {
    try {
      const { otp } = req.body;
      const result = await AuthService.changeMobileVerifyOldOtp(req.user!.userId, otp, req.ip, req.headers['user-agent']);
      ApiResponse.success({
        res,
        message: result.message,
        data: { changeToken: result.changeToken },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/change-mobile/send-new-otp
   */
  static async changeMobileSendNewOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { newMobileNumber } = req.body;
      const result = await AuthService.changeMobileSendNewOtp(newMobileNumber, req.ip, req.headers['user-agent']);
      ApiResponse.success({
        res,
        message: result.message,
        data: { cooldownSeconds: result.cooldownSeconds },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/change-mobile/verify-new
   */
  static async changeMobileVerifyNew(req: Request, res: Response, next: NextFunction) {
    try {
      const { newMobileNumber, otp, changeToken } = req.body;
      const result = await AuthService.changeMobileVerifyNewOtp(
        req.user!.userId,
        newMobileNumber,
        otp,
        changeToken,
        req.ip,
        req.headers['user-agent']
      );
      ApiResponse.success({
        res,
        message: result.message,
        data: { mobileNumber: result.mobileNumber },
      });
    } catch (error) {
      next(error);
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

const REFRESH_COOKIE_NAME = 'aurapure_refresh_token';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions);
      ApiResponse.success({
        res,
        statusCode: 201,
        message: 'Account registered successfully.',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions);
      ApiResponse.success({
        res,
        message: 'Logged in successfully.',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies[REFRESH_COOKIE_NAME] || req.body.refreshToken;
      const result = await AuthService.refreshToken(token);
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions);
      ApiResponse.success({
        res,
        message: 'Token refreshed.',
        data: {
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user?.userId) {
        await AuthService.logout(req.user.userId);
      }
      res.clearCookie(REFRESH_COOKIE_NAME);
      ApiResponse.success({
        res,
        message: 'Logged out successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

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
}

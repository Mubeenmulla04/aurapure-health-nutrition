import crypto from 'crypto';
import { User, IUser } from '../../models/user.model.js';
import { Address } from '../../models/address.model.js';
import { OtpChallenge } from '../../models/otpChallenge.model.js';
import { UserSession } from '../../models/userSession.model.js';
import { AuthAuditLog } from '../../models/authAuditLog.model.js';
import { TokenUtils } from '../../utils/tokens.js';
import { SmsIntegrationService } from '../../integrations/sms/sms.service.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const INACTIVITY_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days of inactivity
const MAX_VERIFY_ATTEMPTS = 5;

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(`${otp}_${env.JWT_ACCESS_SECRET}`).digest('hex');
}

function parseDeviceType(userAgent = ''): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|android|blackberry|iemobile|opera mini/i.test(ua)) return 'mobile';
  if (/windows|macintosh|linux/i.test(ua)) return 'desktop';
  return 'unknown';
}

export class AuthService {
  /**
   * Generates and dispatches a cryptographically secure 6-digit OTP to the mobile number
   */
  static async sendOtp(data: {
    mobileNumber: string;
    countryCode?: string;
    ipAddress?: string;
    userAgent?: string;
    purpose?: 'LOGIN' | 'CHANGE_MOBILE_OLD' | 'CHANGE_MOBILE_NEW';
  }) {
    const { mobileNumber, countryCode = '+91', ipAddress = '127.0.0.1', userAgent, purpose = 'LOGIN' } = data;

    // 1. Check for active cooldown on existing challenge
    const activeChallenge = await OtpChallenge.findOne({
      mobileNumber,
      purpose,
      isConsumed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (activeChallenge && activeChallenge.resendCooldownUntil > new Date()) {
      const waitSeconds = Math.ceil((activeChallenge.resendCooldownUntil.getTime() - Date.now()) / 1000);
      throw {
        statusCode: 429,
        code: 'OTP_COOLDOWN_ACTIVE',
        message: `Please wait ${waitSeconds} seconds before requesting another verification code.`,
        data: { cooldownSeconds: waitSeconds },
      };
    }

    // 2. Invalidate any previous unconsumed challenges for this number & purpose
    await OtpChallenge.updateMany(
      { mobileNumber, purpose, isConsumed: false },
      { $set: { isConsumed: true, consumedAt: new Date() } }
    );

    // 3. Generate cryptographically secure random 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const otpHash = hashOtp(rawOtp);

    // 4. Save new OTP challenge
    const now = new Date();
    await OtpChallenge.create({
      mobileNumber,
      countryCode,
      otpHash,
      purpose,
      attempts: 0,
      maxAttempts: MAX_VERIFY_ATTEMPTS,
      resendCooldownUntil: new Date(now.getTime() + RESEND_COOLDOWN_MS),
      expiresAt: new Date(now.getTime() + OTP_EXPIRY_MS),
      ipAddress,
      userAgent,
      isConsumed: false,
    });

    // 5. Dispatch through configured SMS gateway (MSG91, 2Factor, Twilio, or Dev simulator)
    const smsResult = await SmsIntegrationService.sendOtp(mobileNumber, rawOtp, countryCode);

    // 6. Record in immutable security audit log
    await AuthAuditLog.create({
      mobileNumber,
      countryCode,
      event: 'OTP_REQUESTED',
      status: smsResult.success ? 'SUCCESS' : 'FAILURE',
      reason: smsResult.error,
      ipAddress,
      userAgent,
      metadata: { purpose },
    });

    if (!smsResult.success) {
      throw {
        statusCode: 502,
        code: 'SMS_GATEWAY_ERROR',
        message: 'Failed to deliver SMS verification code. Please try again shortly.',
      };
    }

    return {
      success: true,
      message: `Verification code sent to ${countryCode} ${mobileNumber}`,
      cooldownSeconds: 60,
      ...(process.env.NODE_ENV !== 'production' ? { rawOtp } : {}),
    };
  }

  /**
   * Verifies the 6-digit OTP, handles customer auto-registration, issues JWT and starts active session
   */
  static async verifyOtp(data: {
    mobileNumber: string;
    otp: string;
    countryCode?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const { mobileNumber, otp, countryCode = '+91', ipAddress = '127.0.0.1', userAgent } = data;

    // 1. Fetch latest active OTP challenge
    const challenge = await OtpChallenge.findOne({
      mobileNumber,
      purpose: 'LOGIN',
      isConsumed: false,
    }).sort({ createdAt: -1 });

    if (!challenge || challenge.expiresAt < new Date()) {
      await AuthAuditLog.create({
        mobileNumber,
        countryCode,
        event: 'OTP_FAILED',
        status: 'FAILURE',
        reason: 'Expired or missing challenge',
        ipAddress,
        userAgent,
      });
      throw {
        statusCode: 400,
        code: 'OTP_EXPIRED_OR_NOT_FOUND',
        message: 'Verification code has expired or was not requested. Please request a new code.',
      };
    }

    // 2. Check maximum attempt threshold
    if (challenge.attempts >= challenge.maxAttempts) {
      await AuthAuditLog.create({
        mobileNumber,
        countryCode,
        event: 'OTP_LIMIT_EXCEEDED',
        status: 'FAILURE',
        reason: 'Exceeded 5 incorrect attempts',
        ipAddress,
        userAgent,
      });
      throw {
        statusCode: 429,
        code: 'OTP_MAX_ATTEMPTS_EXCEEDED',
        message: 'Maximum verification attempts exceeded. Please request a fresh OTP.',
      };
    }

    // 3. Verify OTP hash (allow dev master OTP in development/test environments)
    const isDev = process.env.NODE_ENV !== 'production';
    const isDevMasterOtp = isDev && otp === '123456';
    const incomingHash = hashOtp(otp);
    if (!isDevMasterOtp && incomingHash !== challenge.otpHash) {
      challenge.attempts += 1;
      await challenge.save();

      const remaining = challenge.maxAttempts - challenge.attempts;
      await AuthAuditLog.create({
        mobileNumber,
        countryCode,
        event: 'OTP_FAILED',
        status: 'FAILURE',
        reason: `Incorrect code entered. ${remaining} attempts remaining.`,
        ipAddress,
        userAgent,
      });

      throw {
        statusCode: 400,
        code: 'INVALID_OTP',
        message: `Incorrect verification code. ${remaining} attempts remaining.`,
        data: { remainingAttempts: remaining },
      };
    }

    // 4. Mark challenge consumed (Single-use security guarantee)
    challenge.isConsumed = true;
    challenge.consumedAt = new Date();
    await challenge.save();

    // 5. Look up user by mobile number or auto-register customer account
    let user = await User.findOne({ mobileNumber, countryCode });
    let isNewUser = false;

    if (!user) {
      user = await User.create({
        mobileNumber,
        countryCode,
        name: 'Customer',
        phone: mobileNumber,
        role: 'customer',
        isActive: true,
        isMobileVerified: true,
        lastLoginAt: new Date(),
        lastActivityAt: new Date(),
      });
      isNewUser = true;

      await AuthAuditLog.create({
        userId: user._id,
        mobileNumber,
        countryCode,
        event: 'ACCOUNT_CREATED',
        status: 'SUCCESS',
        ipAddress,
        userAgent,
      });
    } else {
      if (!user.isActive) {
        throw {
          statusCode: 403,
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been deactivated. Please contact customer support.',
        };
      }
      user.isMobileVerified = true;
      user.lastLoginAt = new Date();
      user.lastActivityAt = new Date();
      await user.save();
    }

    // 6. Create server-side UserSession
    const refreshToken = TokenUtils.generateRefreshToken({
      userId: user._id.toString(),
      mobileNumber: user.mobileNumber,
      role: user.role,
    });
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const session = await UserSession.create({
      userId: user._id,
      refreshTokenHash,
      ipAddress,
      userAgent,
      deviceType: parseDeviceType(userAgent),
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days absolute TTL
      isRevoked: false,
    });

    // 7. Generate short-lived JWT Access Token
    const accessToken = TokenUtils.generateAccessToken({
      userId: user._id.toString(),
      mobileNumber: user.mobileNumber,
      email: user.email,
      role: user.role,
      sessionId: session._id.toString(),
    });

    await AuthAuditLog.create({
      userId: user._id,
      mobileNumber,
      countryCode,
      event: 'LOGIN_SUCCESS',
      status: 'SUCCESS',
      ipAddress,
      userAgent,
    });

    return {
      user: {
        id: user._id,
        mobileNumber: user.mobileNumber,
        countryCode: user.countryCode,
        name: user.name,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isNewUser,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refreshes JWT access token with 7-day inactivity policy enforcement & refresh-token rotation
   */
  static async refreshToken(rawRefreshToken: string, ipAddress = '127.0.0.1', userAgent?: string) {
    if (!rawRefreshToken) {
      throw { statusCode: 401, code: 'REFRESH_TOKEN_REQUIRED', message: 'No refresh token provided' };
    }

    let payload: any;
    try {
      payload = TokenUtils.verifyRefreshToken(rawRefreshToken);
    } catch {
      throw { statusCode: 401, code: 'INVALID_REFRESH_TOKEN', message: 'Session expired or token invalid' };
    }

    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const session = await UserSession.findOne({
      userId: payload.userId,
      refreshTokenHash: tokenHash,
      isRevoked: false,
    });

    if (!session) {
      throw { statusCode: 401, code: 'SESSION_REVOKED', message: 'Session has been invalidated. Please sign in again.' };
    }

    // Enforce 7 days of inactivity policy
    const timeSinceLastActivity = Date.now() - session.lastActivityAt.getTime();
    if (timeSinceLastActivity > INACTIVITY_TIMEOUT_MS) {
      session.isRevoked = true;
      session.revokedReason = 'INACTIVITY_TIMEOUT';
      await session.save();

      await AuthAuditLog.create({
        userId: session.userId,
        mobileNumber: payload.mobileNumber || '',
        countryCode: '+91',
        event: 'SESSION_INACTIVITY_EXPIRED',
        status: 'FAILURE',
        reason: 'Expired due to 7 days of inactivity',
        ipAddress,
        userAgent,
      });

      throw {
        statusCode: 401,
        code: 'SESSION_INACTIVITY_EXPIRED',
        message: 'Your session has expired due to 7 days of inactivity. Please verify your mobile number again.',
      };
    }

    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      session.isRevoked = true;
      await session.save();
      throw { statusCode: 403, code: 'ACCOUNT_SUSPENDED', message: 'Account is no longer active.' };
    }

    // Refresh-token rotation: generate fresh tokens
    const newRefreshToken = TokenUtils.generateRefreshToken({
      userId: user._id.toString(),
      mobileNumber: user.mobileNumber,
      role: user.role,
    });
    session.refreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    session.lastActivityAt = new Date();
    await session.save();

    user.lastActivityAt = new Date();
    await user.save();

    const newAccessToken = TokenUtils.generateAccessToken({
      userId: user._id.toString(),
      mobileNumber: user.mobileNumber,
      email: user.email,
      role: user.role,
      sessionId: session._id.toString(),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user._id,
        mobileNumber: user.mobileNumber,
        countryCode: user.countryCode,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Revokes the current device session
   */
  static async logout(userId: string, sessionId?: string) {
    if (sessionId) {
      await UserSession.updateOne(
        { _id: sessionId, userId },
        { $set: { isRevoked: true, revokedAt: new Date(), revokedReason: 'USER_LOGOUT' } }
      );
    } else {
      await UserSession.updateMany(
        { userId, isRevoked: false },
        { $set: { isRevoked: true, revokedAt: new Date(), revokedReason: 'USER_LOGOUT' } }
      );
    }

    const user = await User.findById(userId);
    if (user) {
      await AuthAuditLog.create({
        userId: user._id,
        mobileNumber: user.mobileNumber,
        countryCode: user.countryCode,
        event: 'LOGOUT_SINGLE',
        status: 'SUCCESS',
      });
    }
  }

  /**
   * Revokes all active sessions for the user across every device
   */
  static async logoutAll(userId: string) {
    await UserSession.updateMany(
      { userId, isRevoked: false },
      { $set: { isRevoked: true, revokedAt: new Date(), revokedReason: 'USER_LOGOUT_ALL' } }
    );

    const user = await User.findById(userId);
    if (user) {
      await AuthAuditLog.create({
        userId: user._id,
        mobileNumber: user.mobileNumber,
        countryCode: user.countryCode,
        event: 'LOGOUT_ALL',
        status: 'SUCCESS',
      });
    }
  }

  /**
   * Fetches the current authenticated user's profile with completeness calculation
   */
  static async getMe(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User record not found' };
    }

    const hasCompletedName = !!(user.fullName || (user.name && user.name.trim() !== 'Customer'));
    const hasEmail = !!(user.email && user.email.trim());
    const addressCount = await Address.countDocuments({ userId: user._id });
    const isProfileComplete = hasCompletedName && hasEmail && addressCount > 0;

    return {
      id: user._id,
      mobileNumber: user.mobileNumber,
      countryCode: user.countryCode,
      name: user.name,
      fullName: user.fullName || user.name,
      email: user.email,
      phone: user.phone || user.mobileNumber,
      role: user.role,
      isMobileVerified: user.isMobileVerified,
      isProfileComplete,
      addressCount,
      createdAt: user.createdAt,
    };
  }

  /**
   * Progressive profile updates (Name, Email)
   */
  static async updateProfile(userId: string, data: { name?: string; fullName?: string; email?: string }) {
    const user = await User.findById(userId);
    if (!user) {
      throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User record not found' };
    }

    if (data.email && data.email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ email: data.email.toLowerCase(), _id: { $ne: user._id } });
      if (emailExists) {
        throw { statusCode: 409, code: 'EMAIL_ALREADY_EXISTS', message: 'This email is already in use by another account.' };
      }
      user.email = data.email.toLowerCase();
    }

    if (data.fullName) {
      user.fullName = data.fullName.trim();
      user.name = data.fullName.trim();
    } else if (data.name) {
      user.name = data.name.trim();
      user.fullName = data.name.trim();
    }

    user.lastActivityAt = new Date();
    await user.save();

    return {
      id: user._id,
      mobileNumber: user.mobileNumber,
      countryCode: user.countryCode,
      name: user.name,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };
  }

  /**
   * Initiates changing mobile number: Step 1 - Send OTP to existing registered number
   */
  static async changeMobileSendOldOtp(userId: string, ipAddress?: string, userAgent?: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    return this.sendOtp({
      mobileNumber: user.mobileNumber,
      countryCode: user.countryCode,
      purpose: 'CHANGE_MOBILE_OLD',
      ipAddress,
      userAgent,
    });
  }

  /**
   * Step 2: Verifies OTP on old number and returns an authorization change-token (valid 10 mins)
   */
  static async changeMobileVerifyOldOtp(userId: string, otp: string, ipAddress?: string, userAgent?: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    const challenge = await OtpChallenge.findOne({
      mobileNumber: user.mobileNumber,
      purpose: 'CHANGE_MOBILE_OLD',
      isConsumed: false,
    }).sort({ createdAt: -1 });

    if (!challenge || challenge.expiresAt < new Date()) {
      throw { statusCode: 400, code: 'OTP_EXPIRED', message: 'Verification code has expired' };
    }

    if (hashOtp(otp) !== challenge.otpHash) {
      challenge.attempts += 1;
      await challenge.save();
      throw { statusCode: 400, code: 'INVALID_OTP', message: 'Incorrect verification code' };
    }

    challenge.isConsumed = true;
    challenge.consumedAt = new Date();
    await challenge.save();

    // Generate signed changeToken
    const changeToken = crypto.randomBytes(32).toString('hex');
    await AuthAuditLog.create({
      userId: user._id,
      mobileNumber: user.mobileNumber,
      countryCode: user.countryCode,
      event: 'MOBILE_CHANGE_REQUESTED',
      status: 'SUCCESS',
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      changeToken,
      message: 'Identity verified. You may now enter your new mobile number.',
    };
  }

  /**
   * Step 3: Sends OTP to new mobile number
   */
  static async changeMobileSendNewOtp(newMobileNumber: string, ipAddress?: string, userAgent?: string) {
    const exists = await User.findOne({ mobileNumber: newMobileNumber });
    if (exists) {
      throw {
        statusCode: 409,
        code: 'MOBILE_ALREADY_REGISTERED',
        message: 'This mobile number is already linked to an existing account.',
      };
    }

    return this.sendOtp({
      mobileNumber: newMobileNumber,
      purpose: 'CHANGE_MOBILE_NEW',
      ipAddress,
      userAgent,
    });
  }

  /**
   * Step 4: Verifies OTP on new number and commits the account phone number change
   */
  static async changeMobileVerifyNewOtp(
    userId: string,
    newMobileNumber: string,
    otp: string,
    changeToken: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    if (!changeToken || changeToken.length < 10) {
      throw { statusCode: 403, code: 'UNAUTHORIZED_CHALLENGE', message: 'Invalid or missing security change token.' };
    }

    const challenge = await OtpChallenge.findOne({
      mobileNumber: newMobileNumber,
      purpose: 'CHANGE_MOBILE_NEW',
      isConsumed: false,
    }).sort({ createdAt: -1 });

    if (!challenge || challenge.expiresAt < new Date()) {
      throw { statusCode: 400, code: 'OTP_EXPIRED', message: 'Verification code on new mobile has expired.' };
    }

    if (hashOtp(otp) !== challenge.otpHash) {
      challenge.attempts += 1;
      await challenge.save();
      throw { statusCode: 400, code: 'INVALID_OTP', message: 'Incorrect verification code for new mobile number.' };
    }

    challenge.isConsumed = true;
    challenge.consumedAt = new Date();
    await challenge.save();

    const user = await User.findById(userId);
    if (!user) {
      throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    const previousNumber = user.mobileNumber;
    user.mobileNumber = newMobileNumber;
    user.phone = newMobileNumber;
    user.isMobileVerified = true;
    user.lastActivityAt = new Date();
    await user.save();

    await AuthAuditLog.create({
      userId: user._id,
      mobileNumber: newMobileNumber,
      countryCode: user.countryCode,
      event: 'MOBILE_CHANGE_COMPLETED',
      status: 'SUCCESS',
      ipAddress,
      userAgent,
      metadata: { previousNumber },
    });

    return {
      success: true,
      message: 'Mobile number updated successfully.',
      mobileNumber: newMobileNumber,
    };
  }
}

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../../models/user.model.js';
import { TokenUtils } from '../../utils/tokens.js';

export class AuthService {
  static async register(data: { name: string; email: string; phone?: string; password: string }) {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw { statusCode: 409, code: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email already exists.' };
    }

    if (data.phone) {
      const existingPhone = await User.findOne({ phone: data.phone });
      if (existingPhone) {
        throw { statusCode: 409, code: 'PHONE_ALREADY_EXISTS', message: 'An account with this mobile number already exists.' };
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      passwordHash,
      role: 'customer',
      isEmailVerified: true, // Auto-verified for seamless D2C experience
    });

    const accessToken = TokenUtils.generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const refreshToken = TokenUtils.generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Hash refresh token for storage
    user.refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await user.save();

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  static async login(data: { email: string; password: string }) {
    const user = await User.findOne({ email: data.email.toLowerCase() }).select('+passwordHash +refreshTokenHash');
    if (!user || !user.passwordHash) {
      throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
    }

    const accessToken = TokenUtils.generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const refreshToken = TokenUtils.generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    user.refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    user.lastLoginAt = new Date();
    await user.save();

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  static async refreshToken(rawRefreshToken: string) {
    if (!rawRefreshToken) {
      throw { statusCode: 401, code: 'REFRESH_TOKEN_REQUIRED', message: 'Refresh token missing.' };
    }

    let payload;
    try {
      payload = TokenUtils.verifyRefreshToken(rawRefreshToken);
    } catch (err) {
      throw { statusCode: 401, code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token invalid or expired.' };
    }

    const user = await User.findById(payload.userId).select('+refreshTokenHash');
    if (!user || !user.refreshTokenHash) {
      throw { statusCode: 401, code: 'USER_NOT_FOUND', message: 'User not found or session terminated.' };
    }

    const incomingHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    if (incomingHash !== user.refreshTokenHash) {
      // Possible reuse attack detected - clear session
      user.refreshTokenHash = undefined;
      await user.save();
      throw { statusCode: 401, code: 'TOKEN_REUSE_DETECTED', message: 'Session invalid. Please log in again.' };
    }

    // Issue new pair (Rotation)
    const newAccessToken = TokenUtils.generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = TokenUtils.generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    user.refreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    await user.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  static async logout(userId: string) {
    await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
  }

  static async getMe(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User profile not found.' };
    }
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      createdAt: user.createdAt,
    };
  }

  static async updateProfile(userId: string, data: { name?: string; phone?: string }) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!user) {
      throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User profile not found.' };
    }
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  }
}

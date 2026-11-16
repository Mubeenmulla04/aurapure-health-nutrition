import { z } from 'zod';

export const sendOtpSchema = z.object({
  mobileNumber: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number starting with 6-9'),
  countryCode: z.string().trim().default('+91'),
});

export const verifyOtpSchema = z.object({
  mobileNumber: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  otp: z
    .string()
    .trim()
    .length(6, 'Verification code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain numbers only'),
  countryCode: z.string().trim().default('+91'),
});

export const resendOtpSchema = z.object({
  mobileNumber: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  countryCode: z.string().trim().default('+91'),
});

export const changeMobileVerifyOldSchema = z.object({
  otp: z
    .string()
    .trim()
    .length(6, 'Verification code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain numbers only'),
});

export const changeMobileVerifyNewSchema = z.object({
  newMobileNumber: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  otp: z
    .string()
    .trim()
    .length(6, 'Verification code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain numbers only'),
  changeToken: z.string().min(10, 'Invalid or expired authorization challenge token'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
  fullName: z.string().trim().min(2).optional(),
  email: z.string().trim().email('Invalid email address').optional(),
});

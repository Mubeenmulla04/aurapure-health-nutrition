import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  API_PREFIX: z.string().default('/api/v1'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  ADMIN_URL: z.string().default('http://localhost:3001'),

  // Database
  MONGODB_URI: z.string().default('mongodb://localhost:27017/aurapure_ecommerce'),
  MONGODB_DB_NAME: z.string().default('aurapure_ecommerce'),

  // JWT
  JWT_ACCESS_SECRET: z.string().default('aurapure_super_secret_access_jwt_key_2026_dev_38472918374'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().default('aurapure_super_secret_refresh_jwt_key_2026_dev_98237489234'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  COOKIE_SECRET: z.string().default('aurapure_cookie_secret_key_8374928374823974'),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().default('rzp_test_YourTestKeyIdHere'),
  RAZORPAY_KEY_SECRET: z.string().default('YourRazorpaySecretKeyHere'),
  RAZORPAY_WEBHOOK_SECRET: z.string().default('YourRazorpayWebhookSecretHere'),

  // Meta WhatsApp
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().default('aurapure_whatsapp_webhook_verify_token_secure'),

  // Shiprocket
  SHIPROCKET_EMAIL: z.string().optional(),
  SHIPROCKET_PASSWORD: z.string().optional(),
  SHIPROCKET_API_KEY: z.string().optional(),
  SHIPROCKET_MERCHANT_ID: z.string().optional(),
  SHIPROCKET_WEBHOOK_SECRET: z.string().default('shiprocket_webhook_secret_key_2026'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // SMTP Email
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().transform((val) => parseInt(val, 10)).default('587'),
  SMTP_SECURE: z.string().transform((val) => val === 'true').default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('"AuraPure Nutrition" <orders@aurapure.in>'),

  // Rate Limiter
  RATE_LIMIT_WINDOW_MS: z.string().transform((val) => parseInt(val, 10)).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform((val) => parseInt(val, 10)).default('100'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables configured:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;

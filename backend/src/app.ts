import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import { globalRateLimiter } from './middleware/rateLimiter.middleware.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import { ApiResponse } from './utils/apiResponse.js';

// Modular Route Handlers
import { authRoutes } from './modules/auth/auth.routes.js';
import { addressRoutes } from './modules/addresses/address.routes.js';
import { categoryRoutes } from './modules/categories/category.routes.js';
import { productRoutes } from './modules/products/product.routes.js';
import { searchRoutes } from './modules/search/search.routes.js';
import { cartRoutes } from './modules/cart/cart.routes.js';
import { wishlistRoutes } from './modules/wishlist/wishlist.routes.js';
import { orderRoutes } from './modules/orders/order.routes.js';
import { invoiceRoutes } from './modules/invoices/invoice.routes.js';
import { reviewRoutes } from './modules/reviews/review.routes.js';
import { faqRoutes } from './modules/faqs/faq.routes.js';
import { bannerRoutes } from './modules/banners/banner.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';

export function createApp(): Application {
  const app: Application = express();

  // Security Middlewares
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    })
  );

  // Strict CORS allowlist
  const allowedOrigins = [env.CLIENT_URL, env.ADMIN_URL, 'http://localhost:3000', 'http://localhost:3001'];
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-razorpay-signature', 'x-guest-session-id'],
    })
  );

  // Body and cookie parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));

  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Rate Limiter
  app.use(env.API_PREFIX, globalRateLimiter);

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    ApiResponse.success({
      res,
      message: 'AuraPure API Gateway Operational',
      data: {
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
        status: 'UP',
      },
    });
  });

  // Base API index & route registration
  const api = express.Router();

  api.get('/', (_req: Request, res: Response) => {
    ApiResponse.success({
      res,
      message: 'AuraPure D2C E-Commerce Platform API v1',
      data: {
        version: '1.0.0',
        documentation: `${env.API_PREFIX}/docs`,
      },
    });
  });

  api.use('/auth', authRoutes);
  api.use('/addresses', addressRoutes);
  api.use('/categories', categoryRoutes);
  api.use('/products', productRoutes);
  api.use('/search', searchRoutes);
  api.use('/cart', cartRoutes);
  api.use('/wishlist', wishlistRoutes);
  api.use('/orders', orderRoutes);
  api.use('/invoices', invoiceRoutes);
  api.use('/reviews', reviewRoutes);
  api.use('/faqs', faqRoutes);
  api.use('/banners', bannerRoutes);
  api.use('/admin', adminRoutes);

  app.use(env.API_PREFIX, api);

  // 404 Route Handler
  app.use((req: Request, res: Response) => {
    ApiResponse.error({
      res,
      statusCode: 404,
      code: 'ROUTE_NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} not found on this server`,
    });
  });

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}

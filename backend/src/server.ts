import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  try {
    // 1. Connect to MongoDB
    await connectDatabase();

    // 2. Initialize Express application
    const app = createApp();

    // 3. Listen on configured port
    const server = app.listen(env.PORT, () => {
      logger.info(`🌿 AuraPure API Server running on http://localhost:${env.PORT}`);
      logger.info(`🛡️ Environment: ${env.NODE_ENV}`);
      logger.info(`📦 API Base Route: http://localhost:${env.PORT}${env.API_PREFIX}`);
    });

    // Graceful Shutdown Handling
    const handleShutdown = (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    logger.error('Fatal error during application startup:', error);
    process.exit(1);
  }
}

bootstrap();

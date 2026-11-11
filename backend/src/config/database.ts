import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export async function connectDatabase(): Promise<typeof mongoose> {
  try {
    mongoose.set('strictQuery', true);

    const connection = await mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
      autoIndex: true,
    });

    logger.info(`✅ Connected to MongoDB: ${connection.connection.host}/${connection.connection.name}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection lost. Reconnecting...');
    });

    return connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    // Don't kill process immediately in dev so app can start with mock/fallback if needed
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return mongoose;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected gracefully.');
}

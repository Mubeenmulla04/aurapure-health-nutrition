import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';
import { seedDatabase } from '../seeds/seed.js';

let mongodInstance: any = null;

export async function connectDatabase(): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);

  try {
    logger.info(`Attempting connection to MongoDB at ${env.MONGODB_URI}...`);
    const connection = await mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 3000, // 3-second timeout for local dev check
    });

    logger.info(`✅ Connected to external/local MongoDB: ${connection.connection.host}/${connection.connection.name}`);
    return connection;
  } catch (error) {
    logger.warn('Local/External MongoDB daemon not reachable. Initializing embedded high-performance MongoDB instance for testing...');
    
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const memoryUri = mongodInstance.getUri();

      const connection = await mongoose.connect(memoryUri, {
        dbName: 'aurapure_ecommerce',
      });

      logger.info(`✅ Connected to embedded MongoDB at: ${memoryUri}`);

      // Automatically seed catalog
      logger.info('🌱 Seeding embedded database with realistic Indian wellness catalog...');
      await seedDatabase();
      logger.info('🎉 Catalog ready for immediate testing!');

      return connection;
    } catch (memErr) {
      logger.error('Failed to initialize embedded MongoDB:', memErr);
      if (env.NODE_ENV === 'production') {
        process.exit(1);
      }
      return mongoose;
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
  logger.info('MongoDB disconnected gracefully.');
}

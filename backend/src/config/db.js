import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

async function connectDB() {
  try {
    await mongoose.connect(env.MONGO_URI, {
      autoIndex: true,
    });
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error('MongoDB connection error', err);
    throw err;
  }
}

export { connectDB };


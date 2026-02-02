import dotenv from 'dotenv';

dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  // Seed / admin registration control
  ALLOW_INITIAL_ADMIN_REGISTER:
    process.env.ALLOW_INITIAL_ADMIN_REGISTER === 'true',
  // OCR Configuration
  ENABLE_OCR: process.env.ENABLE_OCR === 'true',
  OCR_PROVIDER: process.env.OCR_PROVIDER || null,
  OCR_API_KEY: process.env.OCR_API_KEY || null,
  // AI Provider Configuration
  AI_PROVIDER: process.env.AI_PROVIDER || 'groq', // groq, gemini, longcat
  AI_API_KEY: process.env.AI_API_KEY || null,
  GROQ_API_KEY: process.env.GROQ_API_KEY || null,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || null,
  LONGCAT_API_KEY: process.env.LONGCAT_API_KEY || null,
  // File upload configuration
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  // Shop information for invoices
  SHOP_NAME: process.env.SHOP_NAME || 'Rehman Trader',
  SHOP_ADDRESS: process.env.SHOP_ADDRESS || '',
  SHOP_PHONE: process.env.SHOP_PHONE || '',
  SHOP_EMAIL: process.env.SHOP_EMAIL || '',
};

if (!env.MONGO_URI) {
  // eslint-disable-next-line no-console
  console.warn('MONGO_URI is not set in environment variables');
}

if (!env.JWT_SECRET) {
  // eslint-disable-next-line no-console
  console.warn('JWT_SECRET is not set in environment variables');
}

export { env };


import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { apiResponse } from './utils/apiResponse.js';
import { errorHandler, notFoundHandler } from './middlewares/error.js';
import v1Router from './routes/index.js';

const app = express();

// Security middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// Logging
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Basic rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);

// Static file serving for uploads (invoices, etc.)
const uploadDir = path.resolve(env.UPLOAD_DIR || './uploads');
app.use('/uploads', express.static(uploadDir));

// Health check
app.get('/api/v1/health', (req, res) => {
  return res.status(200).json(apiResponse(true, null, 'OK'));
});

// API v1 routes
app.use('/api/v1', v1Router);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;


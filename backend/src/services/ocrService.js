import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Extract text from image using OCR
 * Provider-agnostic interface
 */
async function extractTextFromImage(imagePath) {
  if (!env.ENABLE_OCR) {
    const err = new Error('OCR is not enabled. Set ENABLE_OCR=true in environment variables.');
    err.statusCode = 400;
    err.errorCode = 'OCR_NOT_CONFIGURED';
    throw err;
  }

  // Placeholder implementation
  // In production, this would call the configured OCR provider
  if (env.OCR_PROVIDER === 'tesseract') {
    try {
      // Optional Tesseract implementation
      // const Tesseract = require('tesseract.js');
      // const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');
      // return text;
      
      // For now, throw error if Tesseract is requested but not fully configured
      const err = new Error('Tesseract OCR is not fully configured');
      err.statusCode = 501;
      err.errorCode = 'OCR_NOT_IMPLEMENTED';
      throw err;
    } catch (error) {
      logger.error('Tesseract OCR error', error);
      throw error;
    }
  }

  // Default: throw error indicating OCR needs configuration
  const err = new Error(`OCR provider "${env.OCR_PROVIDER}" is not configured or not supported`);
  err.statusCode = 400;
  err.errorCode = 'OCR_NOT_CONFIGURED';
  throw err;
}

/**
 * Validate image file
 */
async function validateImageFile(file) {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  if (!file) {
    const err = new Error('No file uploaded');
    err.statusCode = 400;
    err.errorCode = 'NO_FILE';
    throw err;
  }

  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext) || !allowedMimeTypes.includes(file.mimetype)) {
    const err = new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
    err.statusCode = 400;
    err.errorCode = 'INVALID_FILE_TYPE';
    throw err;
  }

  if (file.size > env.MAX_FILE_SIZE) {
    const err = new Error(`File size exceeds maximum allowed size of ${env.MAX_FILE_SIZE / 1024 / 1024}MB`);
    err.statusCode = 400;
    err.errorCode = 'FILE_TOO_LARGE';
    throw err;
  }

  return true;
}

export { extractTextFromImage, validateImageFile };

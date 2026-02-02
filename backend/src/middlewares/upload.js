import multer from 'multer';
import { env } from '../config/env.js';
import { validateImageFile } from '../services/ocrService.js';

// Configure multer for memory storage (file will be in req.file.buffer)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE,
  },
  fileFilter: async (req, file, cb) => {
    try {
      // Create a mock file object for validation
      const mockFile = {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: 0, // Will be set after upload
      };

      // Basic validation (full validation happens in controller after file is uploaded)
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
      }

      cb(null, true);
    } catch (error) {
      cb(error);
    }
  },
});

// Middleware to validate file after upload
async function validateUploadedFile(req, res, next) {
  if (!req.file) {
    return next();
  }

  try {
    // Set size for validation
    req.file.size = req.file.buffer.length;
    await validateImageFile(req.file);
    next();
  } catch (error) {
    return next(error);
  }
}

export { upload, validateUploadedFile };

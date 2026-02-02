import { apiResponse } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

// 404 handler
function notFoundHandler(req, res, next) {
  return res.status(404).json(
    apiResponse(false, null, 'Not Found', 'NOT_FOUND', {
      path: req.originalUrl,
    })
  );
}

// Central error handler
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  logger.error('Error handler caught:', err);

  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errorCode = err.errorCode || 'INTERNAL_ERROR';
  const details = err.details || null;

  return res.status(status).json(apiResponse(false, null, message, errorCode, details));
}

export { errorHandler, notFoundHandler };


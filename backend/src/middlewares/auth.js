import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';

async function authRequired(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      err.errorCode = 'AUTH_REQUIRED';
      throw err;
    }

    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) {
      const err = new Error('User not found or inactive');
      err.statusCode = 401;
      err.errorCode = 'USER_INACTIVE';
      throw err;
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      name: user.name,
      phone: user.phone,
    };

    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      const err = new Error('Invalid or expired token');
      err.statusCode = 401;
      err.errorCode = 'INVALID_TOKEN';
      return next(err);
    }
    return next(error);
  }
}

function requireRole(roles = []) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user || (allowed.length && !allowed.includes(req.user.role))) {
      const err = new Error('Forbidden');
      err.statusCode = 403;
      err.errorCode = 'FORBIDDEN';
      return next(err);
    }
    return next();
  };
}

export { authRequired, requireRole };


import { env } from '../config/env.js';

function log(level, ...args) {
  const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
  // eslint-disable-next-line no-console
  console[level === 'error' ? 'error' : 'log'](prefix, ...args);
}

const logger = {
  info: (...args) => log('info', ...args),
  warn: (...args) => log('warn', ...args),
  error: (...args) => log('error', ...args),
  debug: (...args) => {
    if (env.NODE_ENV === 'development') {
      log('debug', ...args);
    }
  },
};

export { logger };


import arcjet from '#config/arcjet.js';
import logger from '#config/logger.js';
import { slidingWindow } from '@arcjet/node';

export const securityMiddleware = async (req, res, next) => {
  try {
    const role = req.user?.role || 'guest';

    let limit;
    let message;

    switch (role) {
      case 'admin':
        limit = 20;
        message = 'Admin request limit exceeded (20 per min). Slow down.';
        break;
      case 'user':
        limit = 10;
        message = 'User request limit exceeded (10 per min). Slow down.';
        break;
      case 'guest':
        limit = 5;
        message = 'Guest request limit exceeded (5 per min). Slow down.';
        break;
      default:
        limit = 5;
        message = 'Request limit exceeded (5 per min). Slow down.';
        break;
    }

    const client = arcjet.withRule(
      slidingWindow({
        mode: 'LIVE',
        interval: '1m',
        max: limit,
        name: `${role}-rate-limit`,
      })
    );

    const decision = await client.protect(req);

    if (decision.isDenied() && decision.reason.isBot()) {
      logger.warn('Bot request blocked', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Automated requests are not allowed',
      });
    }

    if (decision.isDenied() && decision.reason.isShield()) {
      logger.warn('Shield request blocked', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      });
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Request blocked by security policy',
      });
    }

    if (decision.isDenied() && decision.reason.isRateLimit()) {
      logger.warn('Rate limit exceeded request blocked', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      });
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Too many requests. ${message}`,
      });
    }

    next();
  } catch (e) {
    logger.error('Arcjet middleware error: ', e);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Something went wrong',
    });
  }
};

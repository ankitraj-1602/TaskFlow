const { randomUUID } = require('crypto');
const logger = require('../config/logger');

/**
 * Attaches a correlation ID to each request and logs request start/end.
 * The correlationId can be used to trace a request across all layers.
 */
const requestLogger = (req, res, next) => {
  // Use incoming correlation ID if present (from upstream service), otherwise generate
  const correlationId = req.headers['x-correlation-id'] || randomUUID();

  // Attach to request for use in other middleware/services
  req.correlationId = correlationId;

  // Return it in the response header so clients can trace too
  res.setHeader('x-correlation-id', correlationId);

  const startTime = Date.now();

  // Log when the response finishes (works for both success and error paths)
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger.log(level, 'HTTP request', {
      correlationId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.userId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  });

  next();
};

module.exports = { requestLogger };
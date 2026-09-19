const winston = require('winston');
const path = require('path');
const fs = require('fs');

const LOG_DIR = path.join(__dirname, '../../logs');
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'error' : 'info');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// ─── Custom format: adds timestamp + correlationId + formatting ───
const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat()
);

// ─── Dev format: colorized, human-readable ───
const devFormat = winston.format.combine(
  baseFormat,
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
    const cid = correlationId ? `[${correlationId.slice(0, 8)}] ` : '';
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${cid}${message}${metaStr}`;
  })
);

// ─── Prod format: JSON for log aggregators ───
const prodFormat = winston.format.combine(baseFormat, winston.format.json());

// ─── Transports ───
const transports = [];

if (process.env.NODE_ENV === 'test') {
  // Tests: silence almost everything
  transports.push(
    new winston.transports.Console({
      silent: true,
    })
  );
} else if (process.env.NODE_ENV === 'production') {
  // Production: stdout (for Render) + rotating files
  transports.push(
    new winston.transports.Console({
      format: prodFormat,
    }),
    new winston.transports.DailyRotateFile({
      filename: path.join(LOG_DIR, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: prodFormat,
    }),
    new winston.transports.DailyRotateFile({
      level: 'error',
      filename: path.join(LOG_DIR, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: prodFormat,
    })
  );
} else {
  // Development: colorized console only
  transports.push(
    new winston.transports.Console({
      format: devFormat,
    })
  );
}

// ─── Create the logger ───
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: baseFormat,
  defaultMeta: { service: 'taskflow-backend' },
  transports,
  // Don't crash on uncaught exceptions
  exitOnError: false,
});

module.exports = logger;
/**
 * Centralized Winston logger.
 *
 * - Dev:  colorized console output (debug level)
 * - Prod: JSON to console (info level) — PM2 captures to files automatically
 *         + separate error log file for post-mortem analysis
 */

const { createLogger, format, transports } = require('winston');
const path = require('path');
const { IS_PROD } = require('./config');

const logger = createLogger({
    level: IS_PROD ? 'info' : 'debug',
    defaultMeta: { service: 'aypn.me' },
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
    ),
    transports: [],
});

if (IS_PROD) {
    // JSON lines — easy to parse, PM2 rotates via log_date_format
    logger.add(new transports.Console({
        format: format.combine(format.json()),
    }));

    // Persistent error log for post-mortem debugging
    logger.add(new transports.File({
        filename: path.join(__dirname, '..', 'logs', 'error.log'),
        level: 'error',
        maxsize: 5 * 1024 * 1024, // 5 MB
        maxFiles: 3,
    }));
} else {
    // Colorized, human-readable for local dev
    logger.add(new transports.Console({
        format: format.combine(
            format.colorize(),
            format.printf(({ timestamp, level, message, stack, ...meta }) => {
                const metaStr = Object.keys(meta).length > 1 // exclude 'service'
                    ? ` ${JSON.stringify(meta)}`
                    : '';
                return `${timestamp} ${level}: ${stack || message}${metaStr}`;
            }),
        ),
    }));
}

module.exports = logger;

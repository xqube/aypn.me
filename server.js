/**
 * Server entry point.
 * Imports the Express app and starts listening.
 * Separated from app.js so supertest can import the app without binding a port.
 */

const app = require('./app');
const { PORT } = require('./src/config');
const logger = require('./src/logger');
const { initCache } = require('./src/content/cache');
const { ensureIndexes, closeDb } = require('./src/db');

async function start() {
    await initCache();
    await ensureIndexes();

    const server = app.listen(PORT, () => {
        logger.info(`server listening on http://localhost:${PORT}`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
        logger.info(`${signal} received — shutting down`);
        server.close(async () => {
            await closeDb();
            process.exit(0);
        });
        // Force exit after 10s if connections hang
        setTimeout(() => process.exit(1), 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
    logger.error('Failed to start:', err);
    process.exit(1);
});

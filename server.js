/**
 * Server entry point.
 * Imports the Express app and starts listening.
 * Separated from app.js so supertest can import the app without binding a port.
 */

const app = require('./app');
const { PORT } = require('./src/config');
const logger = require('./src/logger');
const { initCache } = require('./src/content/cache');

async function start() {
    await initCache();
    app.listen(PORT, () => {
        logger.info(`server listening on http://localhost:${PORT}`);
    });
}

start().catch((err) => {
    logger.error('Failed to start:', err);
    process.exit(1);
});

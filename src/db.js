/**
 * MongoDB connection manager.
 * Uses the native `mongodb` driver — no Mongoose.
 *
 * Lazy connection: connects once on first getDb() call, reuses thereafter.
 * Graceful degradation: if MongoDB is unavailable, getDb() returns null
 * and all analytics operations become no-ops.
 */

const { MongoClient } = require('mongodb');
const logger = require('./logger');
const { MONGO_URI } = require('./config');

let client = null;
let db = null;
let connectionFailed = false;

/**
 * Get the database instance. Connects lazily on first call.
 * Returns null if MongoDB is unavailable.
 */
async function getDb() {
    if (db) return db;
    if (connectionFailed) return null;

    try {
        client = new MongoClient(MONGO_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
        });
        await client.connect();
        db = client.db();
        logger.info(`MongoDB connected: ${db.databaseName}`);
        return db;
    } catch (err) {
        connectionFailed = true;
        logger.warn(`MongoDB unavailable — analytics disabled: ${err.message}`);
        return null;
    }
}

/**
 * Ensure indexes exist on analytics collections.
 * Call once on server startup after connecting.
 */
async function ensureIndexes() {
    const database = await getDb();
    if (!database) return;

    try {
        const views = database.collection('views');
        await views.createIndex({ slug: 1, timestamp: -1 });
        await views.createIndex({ slug: 1, ip: 1, timestamp: -1 });

        const reactions = database.collection('reactions');
        await reactions.createIndex({ slug: 1 }, { unique: true });

        logger.info('MongoDB indexes ensured');
    } catch (err) {
        logger.error('Failed to create indexes:', err);
    }
}

/**
 * Close the MongoDB connection gracefully.
 */
async function closeDb() {
    if (client) {
        await client.close();
        client = null;
        db = null;
        logger.info('MongoDB connection closed');
    }
}

module.exports = { getDb, ensureIndexes, closeDb };

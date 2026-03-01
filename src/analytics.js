/**
 * Analytics service — all MongoDB read/write operations for tracking.
 *
 * Every function is safe to call even when MongoDB is unavailable —
 * returns sensible defaults (0, {}, []) instead of throwing.
 */

const { getDb } = require('./db');
const logger = require('./logger');

const VIEW_DEDUP_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const TRENDING_WINDOW_DAYS = 7;
const VALID_REACTIONS = ['👍', '🔥', '💡'];

// ── View Tracking ────────────────────────────────────────────

/**
 * Record a page view. Deduplicates by IP + slug within a 30-minute window.
 * Fire-and-forget — does not block the request.
 */
async function trackView(slug, ip, userAgent) {
    try {
        const db = await getDb();
        if (!db) return;

        const views = db.collection('views');
        const cutoff = new Date(Date.now() - VIEW_DEDUP_WINDOW_MS);

        // Check for recent view from same IP on same post
        const recent = await views.findOne({
            slug,
            ip,
            timestamp: { $gte: cutoff },
        });

        if (recent) return; // Already counted

        await views.insertOne({
            slug,
            ip,
            userAgent: (userAgent || '').slice(0, 256), // cap length
            timestamp: new Date(),
        });
    } catch (err) {
        logger.error(`Failed to track view for ${slug}:`, err);
    }
}

/**
 * Get total view count for a single post.
 */
async function getViewCount(slug) {
    try {
        const db = await getDb();
        if (!db) return 0;

        return await db.collection('views').countDocuments({ slug });
    } catch (err) {
        logger.error(`Failed to get view count for ${slug}:`, err);
        return 0;
    }
}

/**
 * Get view counts for all posts. Returns { slug: count }.
 */
async function getAllViewCounts() {
    try {
        const db = await getDb();
        if (!db) return {};

        const pipeline = [
            { $group: { _id: '$slug', count: { $sum: 1 } } },
        ];
        const results = await db.collection('views').aggregate(pipeline).toArray();

        const counts = {};
        for (const r of results) {
            counts[r._id] = r.count;
        }
        return counts;
    } catch (err) {
        logger.error('Failed to get all view counts:', err);
        return {};
    }
}

/**
 * Get top N slugs by views in the last 7 days (trending).
 */
async function getTrendingSlugs(n = 5) {
    try {
        const db = await getDb();
        if (!db) return [];

        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - TRENDING_WINDOW_DAYS);

        const pipeline = [
            { $match: { timestamp: { $gte: cutoff } } },
            { $group: { _id: '$slug', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: n },
        ];

        const results = await db.collection('views').aggregate(pipeline).toArray();
        return results.map((r) => r._id);
    } catch (err) {
        logger.error('Failed to get trending slugs:', err);
        return [];
    }
}

// ── Reactions ────────────────────────────────────────────────

/**
 * Increment a reaction counter for a post.
 */
async function trackReaction(slug, type) {
    if (!VALID_REACTIONS.includes(type)) return null;

    try {
        const db = await getDb();
        if (!db) return null;

        const result = await db.collection('reactions').findOneAndUpdate(
            { slug },
            { $inc: { [type]: 1 } },
            { upsert: true, returnDocument: 'after' },
        );

        return formatReactions(result);
    } catch (err) {
        logger.error(`Failed to track reaction for ${slug}:`, err);
        return null;
    }
}

/**
 * Get reaction counts for a post.
 */
async function getReactions(slug) {
    try {
        const db = await getDb();
        if (!db) return defaultReactions();

        const doc = await db.collection('reactions').findOne({ slug });
        return formatReactions(doc);
    } catch (err) {
        logger.error(`Failed to get reactions for ${slug}:`, err);
        return defaultReactions();
    }
}

function defaultReactions() {
    return { '👍': 0, '🔥': 0, '💡': 0 };
}

function formatReactions(doc) {
    if (!doc) return defaultReactions();
    return {
        '👍': doc['👍'] || 0,
        '🔥': doc['🔥'] || 0,
        '💡': doc['💡'] || 0,
    };
}

module.exports = {
    trackView,
    getViewCount,
    getAllViewCounts,
    getTrendingSlugs,
    trackReaction,
    getReactions,
    VALID_REACTIONS,
};

/**
 * API routes — lightweight JSON endpoints for client-side interactions.
 *
 * GET  /api/views/:slug       → { views: number }
 * GET  /api/reactions/:slug   → { 👍: n, 🔥: n, 💡: n }
 * POST /api/reactions/:slug   → { 👍: n, 🔥: n, 💡: n }  (body: { type: "👍" })
 */

const express = require('express');
const router = express.Router();
const { getViewCount, getReactions, trackReaction, VALID_REACTIONS } = require('../analytics');

// View count for a post
router.get('/views/:slug', async (req, res) => {
    const views = await getViewCount(req.params.slug);
    res.json({ views });
});

// Get reactions for a post
router.get('/reactions/:slug', async (req, res) => {
    const reactions = await getReactions(req.params.slug);
    res.json(reactions);
});

// Increment a reaction
router.post('/reactions/:slug', async (req, res) => {
    const { type } = req.body || {};

    if (!type || !VALID_REACTIONS.includes(type)) {
        return res.status(400).json({
            error: `Invalid reaction. Allowed: ${VALID_REACTIONS.join(', ')}`,
        });
    }

    const reactions = await trackReaction(req.params.slug, type);
    if (!reactions) {
        return res.status(503).json({ error: 'Analytics unavailable' });
    }

    res.json(reactions);
});

module.exports = router;

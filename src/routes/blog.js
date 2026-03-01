const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { SITE_URL, POSTS_PER_PAGE } = require('../config');
const { getAllPosts, getPost, getLatestPosts, getTrendingPosts } = require('../content/cache');
const { trackView, getViewCount } = require('../analytics');

/** Generate a weak ETag from a short string key */
function etag(key) {
    const hash = crypto.createHash('md5').update(key).digest('hex').slice(0, 12);
    return `W/"${hash}"`;
}

// Blog list — all posts
router.get('/', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const allPosts = getAllPosts();
    const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);

    // Ensure page is within bounds
    const currentPage = Math.max(1, Math.min(page, totalPages || 1));
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    const paginatedPosts = allPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

    // ETag based on post count + first post date + page
    const firstDate = allPosts[0]?.frontmatter.date || '0';
    const tag = etag(`list:${allPosts.length}:${firstDate}:${currentPage}`);
    res.set('ETag', tag);
    if (req.fresh) return res.sendStatus(304);

    res.render('blog', {
        title: 'Posts — blog.aypn',
        description: 'All posts on blog.aypn.',
        url: `/blog${currentPage > 1 ? '?page=' + currentPage : ''}`,
        siteUrl: SITE_URL,
        posts: paginatedPosts,
        currentPage,
        totalPages,
        latestPosts: getLatestPosts(3),
        trendingPosts: getTrendingPosts(3),
    });
});

// Single post
router.get('/:slug', async (req, res) => {
    const post = getPost(req.params.slug);
    const fromPage = parseInt(req.query.page) || null;

    if (!post) {
        return res.status(404).render('404', {
            title: '404 — Not Found',
            description: 'The page you are looking for does not exist.',
            url: req.originalUrl,
            siteUrl: SITE_URL,
        });
    }

    // ETag based on the post's pre-compiled HTML (stable until rebuild)
    const tag = etag(`post:${post.frontmatter.slug}:${post.frontmatter.date}`);
    res.set('ETag', tag);
    if (req.fresh) return res.sendStatus(304);

    // Fire-and-forget view tracking
    trackView(req.params.slug, req.ip, req.headers['user-agent']);

    // Fetch view count (non-blocking if DB is down — returns 0)
    const viewCount = await getViewCount(req.params.slug);

    res.render('post', {
        title: `${post.frontmatter.title} — blog.aypn`,
        description: post.frontmatter.description,
        url: `/blog/${post.frontmatter.slug}`,
        siteUrl: SITE_URL,
        html: post.html,
        toc: post.toc || [],
        frontmatter: post.frontmatter,
        viewCount,
        latestPosts: getLatestPosts(3, req.params.slug),
        trendingPosts: getTrendingPosts(3, req.params.slug),
        fromPage,
    });
});

// Serve static assets from folder-based posts (e.g. /blog/my-slug/cover.png)
const fs = require('fs');
const path = require('path');
const POSTS_DIR = path.join(__dirname, '..', '..', 'content', 'posts');

router.get('/:slug/*', (req, res, next) => {
    const slug = req.params.slug;
    const assetPath = req.params[0]; // the rest of the path after the slug/

    const post = getPost(slug);
    if (!post || !post.dirPath) {
        return next();
    }

    const postDir = post.dirPath;
    const fullPath = path.join(postDir, assetPath);

    // Security check: ensure resolved path is still inside the intended directory
    if (!fullPath.startsWith(postDir)) {
        return next();
    }

    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        res.sendFile(fullPath);
    } else {
        next(); // pass to 404 handler
    }
});

module.exports = router;

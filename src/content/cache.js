/**
 * Content cache — in-memory store with pre-computed indexes.
 *
 * Owns: storage, startup population, query API.
 * All derived data (sorted posts, trending, tag counts) is computed
 * ONCE at startup, not per-request.
 *
 * ⚠ CLUSTER NOTE: This is per-process in-memory state. Under PM2 cluster
 * mode, each worker holds its own copy. The data is read-only after init,
 * so this is safe but uses N× memory. At scale (50+ posts × N workers),
 * consider a shared store (Redis) or a single cache-builder process that
 * writes to a shared file/mmap.
 */

const fs = require('fs');
const path = require('path');
const { compileFile } = require('./pipeline');
const { buildSearchIndex } = require('./search');
const config = require('../config');

const POSTS_DIR = path.join(__dirname, '..', '..', 'content', 'posts');

// ── Primary store ────────────────────────────────────────────
const cache = new Map(); // Map<slug, { html, toc, frontmatter }>

// ── Pre-computed indexes (populated by initCache) ────────────
let sortedPosts = [];    // sorted by date descending
let trendingPosts = [];  // sorted by tag count descending
let tagCounts = {};      // { tag: count }

/**
 * Rebuild derived indexes from the primary cache.
 * Called once after all posts are compiled.
 */
function rebuildIndexes() {
    const all = Array.from(cache.values());

    // Sort by date descending
    sortedPosts = all.sort((a, b) => {
        const da = new Date(a.frontmatter.date || 0);
        const db = new Date(b.frontmatter.date || 0);
        return db - da;
    });

    // Trending: sorted by tag count descending
    trendingPosts = [...sortedPosts].sort(
        (a, b) => (b.frontmatter.tags?.length || 0) - (a.frontmatter.tags?.length || 0)
    );

    // Tag counts
    tagCounts = {};
    sortedPosts.forEach((p) => {
        (p.frontmatter.tags || []).forEach((tag) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });
}

// ── Public API ───────────────────────────────────────────────

/**
 * Read all .mdx files from content/posts/, compile, cache, and
 * build derived indexes + search index. Called once at startup.
 * @param {boolean} silent
 */
async function initCache(silent = false) {
    if (!fs.existsSync(POSTS_DIR)) {
        console.warn(`Posts directory not found: ${POSTS_DIR}`);
        return;
    }

    // Prevent memory leaks during dev hot-reloads
    cache.clear();

    const entries = fs.readdirSync(POSTS_DIR, { withFileTypes: true });

    const filesToCompile = [];

    for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.mdx')) {
            // Loose files: e.g., my-post.mdx
            filesToCompile.push(path.join(POSTS_DIR, entry.name));
        } else if (entry.isDirectory()) {
            // Folder posts: e.g., my-post/index.mdx
            const indexPath = path.join(POSTS_DIR, entry.name, 'index.mdx');
            if (fs.existsSync(indexPath)) {
                filesToCompile.push(indexPath);
            }
        }
    }

    if (!silent) console.log(`Compiling ${filesToCompile.length} MDX post(s)...`);
    const start = Date.now();

    for (const filePath of filesToCompile) {
        const { slug, html, toc, frontmatter, dirPath } = await compileFile(filePath);
        cache.set(slug, { html, toc, frontmatter, dirPath });
    }

    if (!silent) console.log(`MDX cache ready in ${Date.now() - start}ms`);

    rebuildIndexes();
    buildSearchIndex(sortedPosts, silent);
}

/**
 * Get a single post by slug.
 * @returns {{ html: string, toc: Array, frontmatter: object } | null}
 */
function getPost(slug) {
    return cache.get(slug) || null;
}

/**
 * Get all posts, pre-sorted by date descending.
 * O(1) — returns the pre-computed array reference (unless cache disabled).
 */
function getAllPosts() {
    return sortedPosts;
}

/**
 * Get the top N most recent posts, optionally excluding a slug.
 * @param {number} n
 * @param {string} [excludeSlug]
 */
function getLatestPosts(n, excludeSlug) {
    const source = excludeSlug
        ? sortedPosts.filter((p) => p.frontmatter.slug !== excludeSlug)
        : sortedPosts;
    return source.slice(0, n);
}

/**
 * Get the top N trending posts (by tag count), optionally excluding a slug.
 * @param {number} n
 * @param {string} [excludeSlug]
 */
function getTrendingPosts(n, excludeSlug) {
    const source = excludeSlug
        ? trendingPosts.filter((p) => p.frontmatter.slug !== excludeSlug)
        : trendingPosts;
    return source.slice(0, n);
}

/**
 * Get pre-computed tag counts.
 * @returns {{ [tag: string]: number }}
 */
function getTagCounts() {
    return tagCounts;
}

/**
 * Get posts filtered by tag (from the pre-sorted list).
 */
function getPostsByTag(tag) {
    return sortedPosts.filter((p) => p.frontmatter.tags.includes(tag));
}

module.exports = {
    initCache,
    getPost,
    getAllPosts,
    getLatestPosts,
    getTrendingPosts,
    getTagCounts,
    getPostsByTag,
};

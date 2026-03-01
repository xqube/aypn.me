/**
 * Content cache — in-memory store with pre-computed indexes.
 *
 * LOAD STRATEGY:
 *   1. If dist/posts/*.json exist → load per-post artifacts (~50ms)
 *   2. Otherwise → fall back to runtime compilation via pipeline.js
 *
 * DEV MODE:
 *   Starts a chokidar watcher on content/posts/.
 *   Only the changed .mdx file is recompiled — not all posts.
 *
 * ⚠ CLUSTER NOTE: Per-process in-memory state. Under PM2 cluster mode
 * each worker holds its own copy. Data is read-only after init, so safe.
 */

const fs = require('fs');
const path = require('path');
const { compileFile, ensureModules } = require('./pipeline');
const { buildSearchIndex } = require('./search');
const { getTrendingSlugs } = require('../analytics');

const POSTS_DIR = path.join(__dirname, '..', '..', 'content', 'posts');
const DIST_POSTS_DIR = path.join(__dirname, '..', '..', 'dist', 'posts');

// ── Primary store ────────────────────────────────────────────
const cache = new Map(); // Map<slug, { html, toc, frontmatter, dirPath }>

// ── Pre-computed indexes ─────────────────────────────────────
let sortedPosts = [];
let trendingPosts = [];
let tagCounts = {};

function rebuildIndexes() {
    const all = Array.from(cache.values());

    sortedPosts = all.sort((a, b) => {
        const da = new Date(a.frontmatter.date || 0);
        const db = new Date(b.frontmatter.date || 0);
        if (db.getTime() === da.getTime()) {
            return b.frontmatter.slug.localeCompare(a.frontmatter.slug);
        }
        return db - da;
    });

    // Fallback trending (by tag count) — overridden by refreshTrending() if MongoDB is up
    trendingPosts = [...sortedPosts].sort(
        (a, b) => (b.frontmatter.tags?.length || 0) - (a.frontmatter.tags?.length || 0)
    );

    tagCounts = {};
    sortedPosts.forEach((p) => {
        (p.frontmatter.tags || []).forEach((tag) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });
}

/**
 * Refresh trending posts from MongoDB view analytics.
 * Runs on init and every 5 minutes. Non-blocking — if MongoDB is
 * unavailable, the fallback tag-count sort remains in effect.
 */
async function refreshTrending() {
    try {
        const slugs = await getTrendingSlugs(10);
        if (slugs.length === 0) return; // No data yet — keep fallback

        const fromDb = slugs
            .map((s) => cache.get(s))
            .filter(Boolean);

        // Append posts not in the trending list (for diversity)
        const trendingSlugsSet = new Set(slugs);
        const rest = sortedPosts.filter((p) => !trendingSlugsSet.has(p.frontmatter.slug));

        trendingPosts = [...fromDb, ...rest];
    } catch {
        // Keep existing fallback trending
    }
}

const TRENDING_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

// ── Load from per-post JSON artifacts ────────────────────────

function loadFromArtifacts(silent) {
    if (!fs.existsSync(DIST_POSTS_DIR)) return false;

    const files = fs.readdirSync(DIST_POSTS_DIR).filter(f => f.endsWith('.json'));
    if (files.length === 0) return false;

    cache.clear();
    let loaded = 0;

    for (const file of files) {
        try {
            const raw = fs.readFileSync(path.join(DIST_POSTS_DIR, file), 'utf-8');
            const post = JSON.parse(raw);
            cache.set(post.slug, {
                html: post.html,
                toc: post.toc,
                frontmatter: post.frontmatter,
                dirPath: post.dirPath,
            });
            loaded++;
        } catch (err) {
            if (!silent) console.warn(`  Skipping corrupt artifact: ${file}`);
        }
    }

    if (!silent) console.log(`Loaded ${loaded} post(s) from dist/posts/`);
    return loaded > 0;
}

// ── Compile from source (fallback) ───────────────────────────

function findMDXFiles(dir) {
    const results = [];
    if (!fs.existsSync(dir)) return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...findMDXFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
            results.push(fullPath);
        }
    }
    return results;
}

async function compileFromSource(silent) {
    if (!fs.existsSync(POSTS_DIR)) {
        if (!silent) console.warn(`Posts directory not found: ${POSTS_DIR}`);
        return;
    }

    cache.clear();
    await ensureModules();

    const files = findMDXFiles(POSTS_DIR);
    if (!silent) console.log(`Compiling ${files.length} MDX post(s)...`);
    const start = Date.now();

    for (const filePath of files) {
        try {
            const { slug, html, toc, frontmatter, dirPath } = await compileFile(filePath);
            cache.set(slug, { html, toc, frontmatter, dirPath });
        } catch (err) {
            console.error(`Failed to compile ${filePath}:`, err.message);
        }
    }

    if (!silent) console.log(`MDX cache ready in ${Date.now() - start}ms`);
}

// ── Dev Mode File Watcher ────────────────────────────────────

let watcher = null;

async function startDevWatcher() {
    if (process.env.NODE_ENV !== 'development') return;

    let chokidar;
    try {
        chokidar = require('chokidar');
    } catch {
        console.log('  (chokidar not installed — dev hot-reload disabled)');
        return;
    }

    await ensureModules();

    watcher = chokidar.watch(path.join(POSTS_DIR, '**', '*.mdx'), {
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
    });

    let debounceTimer = null;

    function handleChange(filePath) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            const start = Date.now();
            try {
                const result = await compileFile(filePath);
                cache.set(result.slug, {
                    html: result.html,
                    toc: result.toc,
                    frontmatter: result.frontmatter,
                    dirPath: result.dirPath,
                });
                rebuildIndexes();
                buildSearchIndex(sortedPosts, true);
                console.log(`  [HMR] Recompiled: ${result.slug} (${Date.now() - start}ms)`);
            } catch (err) {
                console.error(`  [HMR] Failed: ${path.relative(POSTS_DIR, filePath)} — ${err.message}`);
            }
        }, 100);
    }

    function handleUnlink(filePath) {
        const bn = path.basename(filePath, path.extname(filePath));
        const slug = bn === 'index' ? path.basename(path.dirname(filePath)) : bn;
        if (cache.has(slug)) {
            cache.delete(slug);
            rebuildIndexes();
            buildSearchIndex(sortedPosts, true);
            console.log(`  [HMR] Removed: ${slug}`);
        }
    }

    watcher.on('change', handleChange);
    watcher.on('add', (fp) => { console.log(`  [HMR] New post: ${path.relative(POSTS_DIR, fp)}`); handleChange(fp); });
    watcher.on('unlink', handleUnlink);

    console.log('  [HMR] Watching content/posts/ for changes...');
}

// ── Public API ───────────────────────────────────────────────

async function initCache(silent = false) {
    const start = Date.now();

    const loaded = loadFromArtifacts(silent);
    if (!loaded) {
        if (!silent) console.log('No build artifacts found. Falling back to runtime compilation...');
        await compileFromSource(silent);
    }

    rebuildIndexes();
    buildSearchIndex(sortedPosts, silent);

    // Initial trending refresh from MongoDB (non-blocking fallback)
    await refreshTrending();

    // Periodic trending refresh
    setInterval(() => refreshTrending(), TRENDING_REFRESH_MS);

    if (!silent) console.log(`Content cache ready in ${Date.now() - start}ms`);

    await startDevWatcher();
}

function getPost(slug) { return cache.get(slug) || null; }
function getAllPosts() { return sortedPosts; }

function getLatestPosts(n, excludeSlug) {
    const source = excludeSlug ? sortedPosts.filter((p) => p.frontmatter.slug !== excludeSlug) : sortedPosts;
    return source.slice(0, n);
}

function getTrendingPosts(n, excludeSlug) {
    const source = excludeSlug ? trendingPosts.filter((p) => p.frontmatter.slug !== excludeSlug) : trendingPosts;
    return source.slice(0, n);
}

function getTagCounts() { return tagCounts; }
function getPostsByTag(tag) { return sortedPosts.filter((p) => p.frontmatter.tags.includes(tag)); }

module.exports = {
    initCache,
    getPost,
    getAllPosts,
    getLatestPosts,
    getTrendingPosts,
    getTagCounts,
    getPostsByTag,
};

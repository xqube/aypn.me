/**
 * Content Build Script
 * ────────────────────
 * Pre-compiles all .mdx posts into per-post JSON artifacts:
 *   dist/posts/{slug}.json
 *
 * Supports incremental builds via content hashing (dist/manifest.json).
 *
 * Usage:
 *   node scripts/build-content.js           # incremental build
 *   node scripts/build-content.js --force   # full rebuild (ignores manifest)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const POSTS_DIR = path.join(__dirname, '..', 'content', 'posts');
const DIST_DIR = path.join(__dirname, '..', 'dist');
const DIST_POSTS_DIR = path.join(DIST_DIR, 'posts');
const MANIFEST_JSON = path.join(DIST_DIR, 'manifest.json');

const BATCH_SIZE = 10; // concurrent compilation batch size

// ── Helpers ──────────────────────────────────────────────────

function sha256(content) {
    return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
}

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

function loadManifest() {
    if (fs.existsSync(MANIFEST_JSON)) {
        try { return JSON.parse(fs.readFileSync(MANIFEST_JSON, 'utf-8')); }
        catch { return {}; }
    }
    return {};
}

/**
 * Compile files in batches for controlled concurrency.
 */
async function compileBatched(files, compileFile) {
    const results = [];
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.allSettled(
            batch.map(async (filePath) => {
                try {
                    return await compileFile(filePath);
                } catch (err) {
                    console.error(`  ✗ Failed: ${path.relative(POSTS_DIR, filePath)}`);
                    console.error(`    ${err.message}`);
                    return null;
                }
            })
        );
        for (const r of batchResults) {
            if (r.status === 'fulfilled' && r.value) results.push(r.value);
        }
    }
    return results;
}

// ── Main Build ───────────────────────────────────────────────

async function build() {
    const forceRebuild = process.argv.includes('--force');
    const startTime = Date.now();

    console.log('─────────────────────────────────────');
    console.log('Content Build Pipeline');
    console.log('─────────────────────────────────────');

    // Ensure directories exist
    if (!fs.existsSync(DIST_POSTS_DIR)) {
        fs.mkdirSync(DIST_POSTS_DIR, { recursive: true });
    }

    // Step 1: Discover all .mdx files
    const allFiles = findMDXFiles(POSTS_DIR);
    console.log(`Found ${allFiles.length} .mdx file(s)`);

    if (allFiles.length === 0) {
        // Clean dist/posts/ and write empty manifest
        if (fs.existsSync(DIST_POSTS_DIR)) {
            for (const f of fs.readdirSync(DIST_POSTS_DIR)) {
                fs.unlinkSync(path.join(DIST_POSTS_DIR, f));
            }
        }
        fs.writeFileSync(MANIFEST_JSON, '{}', 'utf-8');
        console.log('No posts found. Cleaned artifacts.');
        return;
    }

    // Step 2: Load existing manifest
    const oldManifest = forceRebuild ? {} : loadManifest();

    // Step 3: Hash each file, determine what to compile
    const matter = require('gray-matter');
    const newManifest = {};
    const filesToCompile = [];
    const unchangedSlugs = new Set();
    const activeSlugs = new Set();

    for (const filePath of allFiles) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const hash = sha256(raw);
        const { data: fm } = matter(raw);

        let slug = fm.slug;
        if (!slug) {
            const bn = path.basename(filePath, path.extname(filePath));
            slug = bn === 'index' ? path.basename(path.dirname(filePath)) : bn;
        }

        activeSlugs.add(slug);
        newManifest[slug] = {
            hash,
            srcPath: path.relative(path.join(__dirname, '..'), filePath),
            builtAt: new Date().toISOString(),
        };

        const postFile = path.join(DIST_POSTS_DIR, `${slug}.json`);
        if (oldManifest[slug] && oldManifest[slug].hash === hash && fs.existsSync(postFile)) {
            unchangedSlugs.add(slug);
        } else {
            filesToCompile.push(filePath);
        }
    }

    console.log(`  Unchanged: ${unchangedSlugs.size}`);
    console.log(`  To compile: ${filesToCompile.length}`);
    if (forceRebuild) console.log('  (--force: full rebuild)');

    // Step 4: Pre-warm ESM modules
    const { compileFile, ensureModules } = require('../src/content/pipeline');
    await ensureModules();

    // Step 5: Compile changed files in batches
    const compiledResults = await compileBatched(filesToCompile, compileFile);

    let compiled = 0;
    let failed = 0;

    // Step 6: Write per-post JSON files
    for (const result of compiledResults) {
        if (result) {
            const postData = {
                slug: result.slug,
                html: result.html,
                toc: result.toc,
                frontmatter: result.frontmatter,
                dirPath: result.dirPath,
            };
            const postFile = path.join(DIST_POSTS_DIR, `${result.slug}.json`);
            const tmp = postFile + '.tmp';
            fs.writeFileSync(tmp, JSON.stringify(postData, null, 2), 'utf-8');
            fs.renameSync(tmp, postFile);
            compiled++;
        } else {
            failed++;
        }
    }

    // Step 7: Delete JSON files for posts that no longer exist
    let deleted = 0;
    const existingJsonFiles = fs.readdirSync(DIST_POSTS_DIR).filter(f => f.endsWith('.json'));
    for (const f of existingJsonFiles) {
        const slug = path.basename(f, '.json');
        if (!activeSlugs.has(slug)) {
            fs.unlinkSync(path.join(DIST_POSTS_DIR, f));
            deleted++;
        }
    }

    // Step 8: Write manifest (atomic)
    const tmpManifest = MANIFEST_JSON + '.tmp';
    fs.writeFileSync(tmpManifest, JSON.stringify(newManifest, null, 2), 'utf-8');
    fs.renameSync(tmpManifest, MANIFEST_JSON);

    // Step 9: Build search index from ALL posts (unchanged + new)
    const allPosts = [];
    for (const slug of activeSlugs) {
        const postFile = path.join(DIST_POSTS_DIR, `${slug}.json`);
        if (fs.existsSync(postFile)) {
            try {
                allPosts.push(JSON.parse(fs.readFileSync(postFile, 'utf-8')));
            } catch { /* skip corrupt files */ }
        }
    }
    const { buildSearchIndex } = require('../src/content/search');
    buildSearchIndex(allPosts);

    // Step 10: Summary
    const totalSize = existingJsonFiles.reduce((sum, f) => {
        const fp = path.join(DIST_POSTS_DIR, f);
        return sum + (fs.existsSync(fp) ? fs.statSync(fp).size : 0);
    }, 0);

    const elapsed = Date.now() - startTime;
    console.log('─────────────────────────────────────');
    console.log(`✓ Build complete in ${elapsed}ms`);
    console.log(`  Compiled: ${compiled} | Skipped: ${unchangedSlugs.size} | Failed: ${failed} | Deleted: ${deleted}`);
    console.log(`  Artifacts: ${activeSlugs.size} files in dist/posts/ (${(totalSize / 1024).toFixed(1)} KB total)`);
    console.log('─────────────────────────────────────');
}

build().catch((err) => {
    console.error('Build failed:', err);
    process.exit(1);
});

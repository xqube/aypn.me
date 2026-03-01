/**
 * MDX compilation pipeline.
 * Owns: read .mdx → parse frontmatter → compile to HTML.
 * Does NOT own caching or storage.
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { visit } = require('unist-util-visit');
const { toString } = require('hast-util-to-string');
const { SITE_URL } = require('../config');

/**
 * Slugify a heading string into a URL-safe anchor ID.
 */
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

/**
 * Custom rehype plugin: extract h2/h3 headings, inject `id` attr,
 * and collect TOC entries as { id, text, depth }.
 */
function rehypeExtractToc(options) {
    const toc = options.toc;
    return function (tree) {
        visit(tree, 'element', (node) => {
            if (node.tagName === 'h2' || node.tagName === 'h3') {
                const text = toString(node);
                const id = slugify(text);
                const depth = parseInt(node.tagName.charAt(1), 10);

                // Inject id attribute for anchor linking
                node.properties = node.properties || {};
                node.properties.id = id;

                toc.push({ id, text, depth });
            }
        });
    };
}

/**
 * Custom rehype plugin: mark external links with security attrs + class.
 * Adds target="_blank", rel="noopener noreferrer", class="external-link".
 */
function rehypeExternalLinks() {
    const siteHost = SITE_URL
        .replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    return function (tree) {
        visit(tree, 'element', (node) => {
            if (node.tagName !== 'a') return;
            const href = node.properties && node.properties.href;
            if (!href || typeof href !== 'string') return;
            if (!href.startsWith('http')) return;

            // Skip internal links
            try {
                const linkHost = new URL(href).hostname;
                if (linkHost === siteHost || linkHost === 'localhost') return;
            } catch { return; }

            node.properties.target = '_blank';
            node.properties.rel = 'noopener noreferrer';
            const cls = node.properties.className || [];
            cls.push('external-link');
            node.properties.className = cls;
        });
    };
}

/**
 * Compile a single .mdx file to HTML with frontmatter extraction.
 * Uses unified + remark + rehype pipeline (ESM modules loaded dynamically).
 */

// ── ESM Module Cache ─────────────────────────────────────────
// Hoist imports: resolved ONCE, reused for every compileFile() call.
let _modules = null;
async function ensureModules() {
    if (_modules) return _modules;
    const [
        { unified },
        remarkParse,
        remarkGfm,
        remarkRehype,
        rehypeRaw,
        rehypePrism,
        rehypeStringify,
    ] = await Promise.all([
        import('unified'),
        import('remark-parse').then(m => m.default),
        import('remark-gfm').then(m => m.default),
        import('remark-rehype').then(m => m.default),
        import('rehype-raw').then(m => m.default),
        import('rehype-prism-plus').then(m => m.default),
        import('rehype-stringify').then(m => m.default),
    ]);
    _modules = { unified, remarkParse, remarkGfm, remarkRehype, rehypeRaw, rehypePrism, rehypeStringify };
    return _modules;
}

async function compileFile(filePath) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(raw);

    const { unified, remarkParse, remarkGfm, remarkRehype, rehypeRaw, rehypePrism, rehypeStringify } =
        await ensureModules();

    // Collect TOC entries during processing
    const toc = [];

    // Derive slug early so we can rewrite image paths
    let slug = frontmatter.slug;
    if (!slug) {
        const bn = path.basename(filePath, path.extname(filePath));
        slug = bn === 'index' ? path.basename(path.dirname(filePath)) : bn;
    }

    /**
     * Rehype plugin: rewrite relative image src (./foo.jpg)
     * to absolute /blog/{slug}/foo.jpg so the browser resolves correctly.
     */
    function rehypeRewriteImages() {
        return function (tree) {
            visit(tree, 'element', (node) => {
                if (node.tagName !== 'img') return;
                const src = node.properties && node.properties.src;
                if (!src || typeof src !== 'string') return;
                if (src.startsWith('./')) {
                    node.properties.src = `/blog/${slug}/${src.slice(2)}`;
                }
            });
        };
    }

    const result = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeRewriteImages)
        .use(rehypeExtractToc, { toc })
        .use(rehypeExternalLinks)
        .use(rehypePrism, { ignoreMissing: true })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .process(content);

    const html = String(result);

    return {
        slug,
        html,
        toc,
        frontmatter: {
            title: frontmatter.title || 'Untitled',
            date: frontmatter.date || null,
            slug,
            tags: frontmatter.tags || [],
            description: frontmatter.description || '',
            coverImage: frontmatter.coverImage
                && fs.existsSync(path.join(path.dirname(filePath), frontmatter.coverImage.replace(/^\.\//, '')))
                ? `/blog/${slug}/${frontmatter.coverImage.replace(/^\.\//, '')}`
                : null,
        },
        dirPath: path.dirname(filePath),
    };
}

module.exports = { compileFile, ensureModules };

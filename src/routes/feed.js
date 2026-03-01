/**
 * Feed routes — /sitemap.xml and /rss
 * No external dependencies — hand-built XML.
 */

const express = require('express');
const router = express.Router();
const { SITE_URL } = require('../config');
const { getAllPosts } = require('../content/cache');

// ── Sitemap ──────────────────────────────────────────────────

router.get('/sitemap.xml', (req, res) => {
    const posts = getAllPosts();

    const urls = [
        { loc: '/', priority: '1.0' },
        { loc: '/blog', priority: '0.8' },
        ...posts.map((p) => ({
            loc: `/blog/${p.frontmatter.slug}`,
            lastmod: p.frontmatter.date
                ? new Date(p.frontmatter.date).toISOString().split('T')[0]
                : undefined,
            priority: '0.6',
        })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
            .map(
                (u) => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <priority>${u.priority}</priority>
  </url>`
            )
            .join('\n')}
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
});

// ── RSS (Atom Feed) ──────────────────────────────────────────

router.get('/rss', (req, res) => {
    const posts = getAllPosts();
    const latestDate = posts.length
        ? new Date(posts[0].frontmatter.date).toISOString()
        : new Date().toISOString();

    const entries = posts
        .slice(0, 20)
        .map(
            (p) => `  <entry>
    <title>${escapeXml(p.frontmatter.title)}</title>
    <link href="${SITE_URL}/blog/${p.frontmatter.slug}" rel="alternate"/>
    <id>${SITE_URL}/blog/${p.frontmatter.slug}</id>
    <updated>${new Date(p.frontmatter.date).toISOString()}</updated>
    <summary>${escapeXml(p.frontmatter.description || '')}</summary>
    <author><name>Ayyappan Pillai</name></author>
  </entry>`
        )
        .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>blog.aypn</title>
  <link href="${SITE_URL}/rss" rel="self"/>
  <link href="${SITE_URL}" rel="alternate"/>
  <id>${SITE_URL}/</id>
  <updated>${latestDate}</updated>
${entries}
</feed>`;

    res.set('Content-Type', 'application/atom+xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
});

// ── Helpers ──────────────────────────────────────────────────

function escapeXml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

module.exports = router;

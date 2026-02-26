/**
 * Search index builder.
 * Generates a JSON index from cached posts for client-side search.
 */

const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.join(__dirname, '..', '..', 'public', 'search-index.json');

/**
 * Build and write the search index to public/search-index.json.
 * @param {Array<{ html: string, toc: Array, frontmatter: object }>} posts
 * @param {boolean} silent
 */
function buildSearchIndex(posts, silent = false) {
    const searchIndex = posts.map((entry) => {
        const { frontmatter, toc, html } = entry;
        // Strip HTML tags to get plain text, then extract unique words
        const plainText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const words = [...new Set(
            plainText.toLowerCase().match(/[a-z0-9]+/g) || []
        )].join(' ');

        return {
            slug: frontmatter.slug,
            title: frontmatter.title,
            description: frontmatter.description || '',
            tags: frontmatter.tags || [],
            headings: (toc || []).map((h) => h.text),
            words,
        };
    });

    fs.writeFileSync(INDEX_PATH, JSON.stringify(searchIndex), 'utf-8');
    if (!silent) console.log(`Search index written (${searchIndex.length} entries)`);
}

module.exports = { buildSearchIndex };

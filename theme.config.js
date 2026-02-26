/**
 * Global theme configuration.
 * Edit colors, fonts, and design tokens here — they propagate to
 * tailwind.config.js and input.css automatically.
 */

const { SITE_URL } = require('./src/config');

module.exports = {
    // ─── Colors ──────────────────────────────────────────────
    colors: {
        bg: '#0f0f0f',   // Primary background
        bgAlt: '#161616',   // Slightly lighter background (tables, code)
        bgCode: '#111',      // Code block background
        bgInline: '#1a1a1a',   // Inline code background
        border: '#262626',   // Borders, separators, rules

        text: '#d4d4d4',   // Primary body text
        textMuted: '#737373',   // Secondary / muted text
        textLight: '#a3a3a3',   // Blockquotes, captions
        heading: '#e5e5e5',   // Headings

        accent: '#4ade80',   // Primary accent (green-400)
        accentDim: '#22c55e',   // Accent hover state (green-500)

        // Syntax highlighting
        hlKeyword: '#c084fc',   // purple-400
        hlString: '#4ade80',   // green-400 (accent)
        hlComment: '#525252',   // neutral-600
        hlFunction: '#60a5fa',   // blue-400
        hlNumber: '#f59e0b',   // amber-500
        hlBuiltIn: '#f472b6',   // pink-400
        hlType: '#22d3ee',   // cyan-400
        hlVariable: '#fb923c',   // orange-400
        hlAttr: '#4ade80',   // green-400
    },

    // ─── Fonts ───────────────────────────────────────────────
    fonts: {
        mono: [
            'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco',
            'Consolas', 'Liberation Mono', 'Courier New', 'monospace',
        ],
        sans: [
            'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI',
            'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif',
        ],
    },

    // ─── Meta ────────────────────────────────────────────────
    site: {
        name: 'aypn',
        tagline: 'Systems engineering notes. Performance, infrastructure, low-level thinking.',
        url: SITE_URL,
    },
};

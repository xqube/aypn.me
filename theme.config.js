/**
 * Global theme configuration.
 * Edit colors, fonts, and design tokens here — they propagate to
 * tailwind.config.js and input.css automatically.
 *
 * All semantic tokens use CSS Custom Properties defined in input.css.
 * This file is the single source of truth for raw color values.
 */

const { SITE_URL } = require('./src/config');

module.exports = {
    // ─── Light palette ────────────────────────────────────────
    light: {
        bg: '#fafafa',
        bgAlt: '#ffffff',
        bgCode: '#f3f4f6',
        bgInline: '#e5e7eb',
        border: '#d1d5db',
        borderSubtle: '#e5e7eb',
        text: '#374151',
        textHeading: '#111827',
        textMuted: '#6b7280',
        textFaint: '#9ca3af',
        accent: '#16a34a',
        accentHover: '#15803d',
        accentSoft: '#dcfce7',
    },

    // ─── Dark palette ─────────────────────────────────────────
    dark: {
        bg: '#0f0f0f',
        bgAlt: '#161616',
        bgCode: '#111111',
        bgInline: '#1a1a1a',
        border: '#262626',
        borderSubtle: '#1f1f1f',
        text: '#d4d4d4',
        textHeading: '#e5e5e5',
        textMuted: '#737373',
        textFaint: '#525252',
        accent: '#4ade80',
        accentHover: '#22c55e',
        accentSoft: 'rgba(74,222,128,0.1)',
    },

    // ─── Syntax highlighting ──────────────────────────────────
    syntax: {
        light: {
            keyword: '#7c3aed',
            string: '#16a34a',
            comment: '#9ca3af',
            function: '#2563eb',
            number: '#d97706',
            builtin: '#db2777',
            type: '#0891b2',
            variable: '#ea580c',
            attr: '#16a34a',
            punctuation: '#6b7280',
        },
        dark: {
            keyword: '#c084fc',
            string: '#4ade80',
            comment: '#525252',
            function: '#60a5fa',
            number: '#f59e0b',
            builtin: '#f472b6',
            type: '#22d3ee',
            variable: '#fb923c',
            attr: '#4ade80',
            punctuation: '#a3a3a3',
        },
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

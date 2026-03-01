const { SITE_URL } = require('./src/config');

module.exports = {
    // ─── Light palette ────────────────────────────────────────
    light: {
        bg: '#F6F8FA',       // GitHub-style light grey
        bgAlt: '#FFFFFF',    // pure white elevation
        bgCode: '#F0F2F5',   // code block surface
        bgInline: '#E8ECF0', // inline code tint
        border: '#D0D7DE',   // standard border
        borderSubtle: '#E8ECF0', // faint separator
        text: '#1F2328',     // rich near-black body   (15.3:1 AAA ✓)
        textHeading: '#0D1117',  // deep heading          (19.1:1 AAA ✓)
        textMuted: '#57606A',    // grey metadata          (5.2:1 AA ✓)
        textFaint: '#8C959F',    // placeholder            (decorative)
        accent: '#0969DA',       // GitHub blue
        accentHover: '#0550AE',  // deeper blue on hover
        accentSoft: '#DDF4FF',   // soft blue tint
    },

    // ─── Dark palette ─────────────────────────────────────────
    dark: {
        bg: '#16181D',           // neutral charcoal — softer than 111318
        bgAlt: '#1E2127',        // elevated surface
        bgCode: '#13151A',       // code slightly deeper but not crushed
        bgInline: '#22262D',     // inline code neutral tint
        border: '#30363D',       // balanced neutral border
        borderSubtle: '#262A30', // micro separator
        text: '#D1D6DC',         // soft silver (AAA contrast)
        textHeading: '#F0F3F6',  // gentle near-white
        textMuted: '#9AA3AD',    // calm metadata grey (AA ✓)
        textFaint: '#5B636E',    // decorative faint
        accent: '#5EA8FF',       // softened GitHub-style blue
        accentHover: '#7DB8FF',
        accentSoft: 'rgba(94, 168, 255, 0.12)',
    },

    // ─── Syntax highlighting ──────────────────────────────────
    syntax: {
        light: {
            keyword: '#6639BA',   // calm violet — replaces fatiguing red
            string: '#1A7F64',    // muted teal — replaces harsh deep blue
            comment: '#8C959F',   // matches textFaint
            function: '#0550AE',  // rich blue
            number: '#953800',    // warm amber-brown
            builtin: '#953800',   // warm amber-brown
            type: '#116329',      // forest green
            variable: '#6639BA',  // violet, consistent with keyword
            attr: '#1A7F64',      // teal, consistent with string
            punctuation: '#57606A', // matches textMuted
        },
        dark: {
            keyword: '#D2A8FF',   // soft purple — calm, not electric
            string: '#7EE787',    // terminal green — easy on eyes
            comment: '#6A737D',   // mid-grey, clearly de-emphasized
            function: '#79C0FF',  // cornflower blue
            number: '#FFA657',    // amber orange
            builtin: '#FFA657',   // amber orange
            type: '#A5D6FF',      // sky blue
            variable: '#D2A8FF',  // purple, consistent with keyword
            attr: '#7EE787',      // green, consistent with string
            punctuation: '#8B949E', // matches textMuted
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
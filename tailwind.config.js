/** @type {import('tailwindcss').Config} */
const theme = require('./theme.config');

module.exports = {
    darkMode: 'class',
    content: ['./views/**/*.ejs', './src/**/*.js'],
    theme: {
        extend: {
            colors: {
                // Semantic surface tokens (auto-switch via CSS vars)
                surface: 'var(--color-bg)',
                'surface-alt': 'var(--color-bg-alt)',

                // Text tokens
                content: 'var(--color-text)',
                heading: 'var(--color-text-heading)',
                muted: 'var(--color-text-muted)',
                faint: 'var(--color-text-faint)',

                // Accent tokens
                accent: 'var(--color-accent)',
                'accent-hover': 'var(--color-accent-hover)',
                'accent-soft': 'var(--color-accent-soft)',

                // Border tokens
                line: 'var(--color-border)',
                'line-subtle': 'var(--color-border-subtle)',
            },
            fontFamily: {
                mono: theme.fonts.mono,
                sans: theme.fonts.sans,
            },
            keyframes: {
                breathing: {
                    '0%, 100%': { transform: 'scale(1)', opacity: '1' },
                    '50%': { transform: 'scale(1.05)', opacity: '0.8' },
                }
            },
            animation: {
                breathing: 'breathing 3s ease-in-out infinite',
            }
        },
    },
    plugins: [],
};

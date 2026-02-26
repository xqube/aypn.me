/** @type {import('tailwindcss').Config} */
const theme = require('./theme.config');

module.exports = {
    darkMode: 'class',
    content: ['./views/**/*.ejs', './src/**/*.js'],
    theme: {
        extend: {
            colors: {
                bg: theme.colors.bg,
                'bg-alt': theme.colors.bgAlt,
                text: theme.colors.text,
                'text-muted': theme.colors.textMuted,
                accent: theme.colors.accent,
                'accent-dim': theme.colors.accentDim,
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

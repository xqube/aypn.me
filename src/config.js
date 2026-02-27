/**
 * Centralized configuration.
 * Single point of access for all environment-derived values.
 * No other file should read process.env directly.
 */

const config = {
    PORT: parseInt(process.env.PORT, 10) || 3001,
    IS_PROD: process.env.NODE_ENV === 'production',
    SITE_URL: process.env.SITE_URL || 'http://localhost:3000',
    // When true, the app will rebuild MDX and JSON data on every request. for production make it 'false'
    DISABLE_CACHE: process.env.DISABLE_CACHE === 'true',
    POSTS_PER_PAGE: 10,
};

module.exports = config;

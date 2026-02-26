const express = require('express');
const compression = require('compression');
const path = require('path');

const { PORT, IS_PROD } = require('./src/config');
const { initCache } = require('./src/content/cache');
const indexRoutes = require('./src/routes/index');
const blogRoutes = require('./src/routes/blog');

const app = express();

// Gzip/deflate compression
app.use(compression());

// Static files with aggressive caching in production
app.use(
    '/css',
    express.static(path.join(__dirname, 'public', 'css'), {
        maxAge: IS_PROD ? '1y' : 0,
        immutable: IS_PROD,
    })
);

app.use(
    '/fonts',
    express.static(path.join(__dirname, 'public', 'fonts'), {
        maxAge: IS_PROD ? '1y' : 0,
        immutable: IS_PROD,
    })
);

app.use(
    '/img',
    express.static(path.join(__dirname, 'public', 'img'), {
        maxAge: IS_PROD ? '1y' : 0,
        immutable: IS_PROD,
    })
);

// Search index (regenerated on server start)
app.use(
    '/api',
    express.static(path.join(__dirname, 'public'), {
        maxAge: IS_PROD ? '5m' : 0,
    })
);

// Resume PDF — served inline so it opens in the browser viewer
app.get('/resume', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'AyyappanPillai.pdf'), {
        headers: { 'Content-Type': 'application/pdf' },
    });
});

app.get('/AyyappanPillai.pdf', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'AyyappanPillai.pdf'), {
        headers: { 'Content-Type': 'application/pdf' },
    });
});

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Optional Hot-Reload Middleware for Development
app.use(async (req, res, next) => {
    const { DISABLE_CACHE } = require('./src/config');
    if (DISABLE_CACHE) {
        // Clear JSON/JS require metadata cache
        delete require.cache[require.resolve(path.join(__dirname, 'content', 'projects.js'))];
        delete require.cache[require.resolve(path.join(__dirname, 'content', 'resume.js'))];

        // Silently rebuild the MDX cache
        const { initCache } = require('./src/content/cache');
        await initCache(true);
    }
    next();
});

// Routes
app.use('/', indexRoutes);
app.use('/blog', blogRoutes);

// 404 handler
app.use((req, res) => {
    const { SITE_URL } = require('./src/config');
    res.status(404).render('404', {
        title: '404 — Not Found',
        description: 'The page you are looking for does not exist.',
        url: req.originalUrl,
        siteUrl: SITE_URL,
    });
});

// Initialize content cache, then start server
async function start() {
    await initCache();
    app.listen(PORT, () => {
        console.log(`server listening on http://localhost:${PORT}`);
    });
}

start().catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
});

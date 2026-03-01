const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');

const { IS_PROD } = require('./src/config');
const logger = require('./src/logger');
const morgan = require('morgan');
const indexRoutes = require('./src/routes/index');
const blogRoutes = require('./src/routes/blog');
const feedRoutes = require('./src/routes/feed');
const apiRoutes = require('./src/routes/api');

const app = express();

// Request logging — pipe morgan through winston
app.use(morgan(IS_PROD ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.info(msg.trimEnd()) },
}));

// Gzip/deflate compression
app.use(compression());

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
            connectSrc: ["'self'"],
            formAction: ["'self'", "https://formsubmit.co"],
        },
    },
}));

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

// Dev-mode: clear require cache for JSON config files so edits take effect without restart.
// MDX posts are handled by the chokidar file watcher in cache.js.
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        delete require.cache[require.resolve(path.join(__dirname, 'content', 'projects.js'))];
        delete require.cache[require.resolve(path.join(__dirname, 'content', 'resume.js'))];
        next();
    });
}

// Routes
app.use('/', indexRoutes);
app.use('/', feedRoutes);
app.use('/api', express.json(), apiRoutes);
app.use('/blog', blogRoutes);

// 404 handler
app.use((req, res) => {
    const { SITE_URL } = require('./src/config');
    logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).render('404', {
        title: '404 — Not Found',
        description: 'The page you are looking for does not exist.',
        url: req.originalUrl,
        siteUrl: SITE_URL,
    });
});

module.exports = app;
